/**
 * OpenAI GPT-5 Service
 * 
 * Handles all AI reasoning and agent responses using GPT-5 (highest tier).
 * IMPORTANT: This service requires GPT-5. No fallback to GPT-4 or other models.
 */

const OpenAI = require('openai');
const logger = require('../utils/logger');

// Agent-specific prompt templates
const AGENT_PROMPTS = {
  toi: {
    name: 'Times of India Agent',
    biasProfile: 'Mainstream Indian media perspective with focus on national interest and centrist viewpoint',
    systemPrompt: `You are a fact-checking agent with the perspective of Times of India (TOI), one of India's largest English-language newspapers.

Your editorial voice characteristics:
- Mainstream centrist perspective
- Focus on national interest and development stories
- Generally supportive of establishment narratives but critical of policy failures
- Strong emphasis on economic and business angles
- Cautious approach to sensitive political topics

When evaluating claims:
1. Consider how TOI would report this story
2. Look for official government sources and mainstream corroboration
3. Be skeptical of sensationalist claims
4. Prioritize verified facts over speculation
5. Consider the business and economic implications

Provide your analysis in JSON format.`
  },

  indiaTimes: {
    name: 'India Times Agent',
    biasProfile: 'Digital-first, younger demographic focus with emphasis on trending and viral content',
    systemPrompt: `You are a fact-checking agent with the perspective of India Times, a digital-first news platform.

Your editorial voice characteristics:
- Digital-native audience focus
- Quick to pick up trending stories and viral content
- Mix of serious news and entertainment
- More willing to cover social media controversies
- Focus on technology and lifestyle angles

When evaluating claims:
1. Consider viral spread patterns and social media origins
2. Check for digital manipulation or deepfakes
3. Verify trending claims against primary sources
4. Be aware of clickbait and engagement-driven misinformation
5. Consider the social media ecosystem's amplification effects

Provide your analysis in JSON format.`
  },

  ndtv: {
    name: 'NDTV Agent',
    biasProfile: 'Liberal-leaning perspective with emphasis on investigative journalism and policy analysis',
    systemPrompt: `You are a fact-checking agent with the perspective of NDTV (New Delhi Television), known for in-depth journalism.

Your editorial voice characteristics:
- Liberal-leaning editorial stance
- Strong emphasis on investigative reporting
- Critical analysis of government policies
- Focus on social issues and human interest stories
- International news perspective

When evaluating claims:
1. Look for investigative angles and hidden context
2. Question official narratives with healthy skepticism
3. Consider impact on marginalized communities
4. Seek expert opinions and academic sources
5. Evaluate claims through civil liberties lens

Provide your analysis in JSON format.`
  },

  generic: {
    name: 'Generic Verification Agent',
    biasProfile: 'Neutral, evidence-based fact-checking without ideological bias',
    systemPrompt: `You are a neutral fact-checking agent focused purely on evidence-based verification.

Your approach:
- No political or ideological bias
- Strict adherence to verifiable facts
- Primary source verification
- Cross-referencing multiple independent sources
- Scientific method approach to claims

When evaluating claims:
1. Identify the core factual claim
2. Find primary sources and official records
3. Cross-reference with multiple independent sources
4. Assess the quality of evidence
5. Consider what would disprove the claim

Provide your analysis in JSON format.`
  }
};

// Orchestrator aggregation prompt
const ORCHESTRATOR_PROMPT = `You are the master orchestrator for a multi-agent news verification system.

You will receive reports from multiple specialized fact-checking agents, each with their own perspective and bias profile. Your job is to:

1. AGGREGATE: Combine all agent findings into a coherent assessment
2. WEIGH: Consider agent reputation scores and evidence quality
3. RESOLVE: Handle conflicting conclusions with nuanced analysis
4. SYNTHESIZE: Produce a final verdict with confidence level

Weighting rules:
- Higher reputation agents carry more weight
- More evidence links increase confidence
- Consensus among agents strengthens verdict
- Divergent opinions require explanation
- Quality of sources matters more than quantity

Output a final verdict: "true", "false", "mixed", or "unknown"
Include an accuracy_score (0-100) based on evidence strength.`;

// Graph canonicalization prompt
const GRAPH_PROMPT = `You are analyzing a source graph for news article propagation.

Your tasks:
1. Identify duplicate or near-duplicate content across sources
2. Determine the likely original source based on timestamps and citations
3. Map attribution relationships between articles
4. Identify key claims and how they evolved across sources
5. Flag potential misinformation amplification patterns

Output in JSON format with nodes and edges representing the information flow.`;

class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }

    this.modelName = process.env.MODEL_NAME;
    
    // STRICT REQUIREMENT: Model name must be specified
    if (!this.modelName) {
      throw new Error(
        'MODEL_NAME environment variable is required. ' +
        'This backend requires GPT-5 (highest tier). ' +
        'No silent fallback to GPT-4 is allowed.'
      );
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Rate limiting
    this.requestQueue = [];
    this.maxConcurrent = 5;
    this.currentRequests = 0;

    logger.info(`OpenAI service initialized with model: ${this.modelName}`);
  }

  /**
   * Make a GPT request with retry logic and rate limiting
   * @param {Object} params - OpenAI API parameters
   * @returns {Promise<Object>} API response
   */
  async makeRequest(params) {
    const maxRetries = 3;
    const baseDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Wait if too many concurrent requests
        while (this.currentRequests >= this.maxConcurrent) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.currentRequests++;

        const response = await this.client.chat.completions.create({
          model: this.modelName,
          ...params
        });

        this.currentRequests--;
        return response;
      } catch (error) {
        this.currentRequests--;

        if (error.status === 429 && attempt < maxRetries) {
          // Rate limited - exponential backoff
          const delay = baseDelay * Math.pow(2, attempt);
          logger.warn(`Rate limited. Retrying in ${delay}ms...`, { attempt });
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (error.status === 503 && attempt < maxRetries) {
          // Service unavailable - retry
          const delay = baseDelay * attempt;
          logger.warn(`Service unavailable. Retrying in ${delay}ms...`, { attempt });
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }
  }

  /**
   * Get agent verification prompt and analyze claim
   * @param {string} agentType - Agent type: 'toi', 'indiaTimes', 'ndtv', 'generic'
   * @param {string} claim - The claim to verify
   * @param {Array} evidence - Array of evidence objects from Tavily search
   * @returns {Promise<Object>} Agent analysis result
   */
  async agentVerify(agentType, claim, evidence) {
    const agentConfig = AGENT_PROMPTS[agentType] || AGENT_PROMPTS.generic;
    
    logger.info(`Agent verification started`, { agent: agentConfig.name, claim: claim.substring(0, 100) });

    const evidenceText = evidence.map((e, i) => 
      `[${i + 1}] ${e.title}\nURL: ${e.url}\nSnippet: ${e.snippet}\nReputation: ${e.domainReputationScore}/100`
    ).join('\n\n');

    const userPrompt = `Analyze the following claim and evidence:

CLAIM: "${claim}"

EVIDENCE:
${evidenceText}

Provide your analysis in the following JSON format:
{
  "agent_name": "${agentConfig.name}",
  "credibility_score": <0-100>,
  "confidence": <0-1>,
  "verdict": "<true|false|mixed|unknown>",
  "summary": "<brief summary>",
  "detailed_reasoning": "<detailed analysis>",
  "evidence_links": [<relevant URLs>],
  "key_findings": [<list of key findings>],
  "concerns": [<list of concerns or red flags>]
}`;

    try {
      const response = await this.makeRequest({
        messages: [
          { role: 'system', content: agentConfig.systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(content);

      logger.info(`Agent verification completed`, { 
        agent: agentConfig.name, 
        verdict: result.verdict,
        credibility: result.credibility_score 
      });

      return result;
    } catch (error) {
      logger.error(`Agent verification failed`, { agent: agentType, error: error.message });
      throw error;
    }
  }

  /**
   * Orchestrator: Aggregate agent reports into final verdict
   * @param {Array} agentReports - Array of agent report objects
   * @param {Object} reputations - Agent reputation scores
   * @returns {Promise<Object>} Final aggregated verdict
   */
  async orchestratorAggregate(agentReports, reputations = {}) {
    logger.info('Orchestrator aggregation started', { reportCount: agentReports.length });

    const reportsText = agentReports.map(report => {
      const reputation = reputations[report.agent_name] || 50;
      return `AGENT: ${report.agent_name}
Reputation Score: ${reputation}/100
Credibility Score: ${report.credibility_score}/100
Confidence: ${report.confidence}
Verdict: ${report.verdict}
Summary: ${report.summary}
Key Findings: ${report.key_findings?.join(', ') || 'None'}
Concerns: ${report.concerns?.join(', ') || 'None'}`;
    }).join('\n\n---\n\n');

    const userPrompt = `Aggregate the following agent reports into a final verdict:

${reportsText}

Provide your final analysis in JSON format:
{
  "verdict": "<true|false|mixed|unknown>",
  "accuracy_score": <0-100>,
  "confidence": <0-1>,
  "summary": "<comprehensive summary>",
  "reasoning": "<detailed reasoning for final verdict>",
  "agent_consensus": "<description of agent agreement/disagreement>",
  "key_evidence": [<most important evidence points>],
  "remaining_uncertainties": [<unresolved questions>]
}`;

    try {
      const response = await this.makeRequest({
        messages: [
          { role: 'system', content: ORCHESTRATOR_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      logger.info('Orchestrator aggregation completed', { 
        verdict: result.verdict, 
        accuracy: result.accuracy_score 
      });

      return result;
    } catch (error) {
      logger.error('Orchestrator aggregation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze source graph for deduplication and relationship mapping
   * @param {Array} sources - Array of source objects with content
   * @returns {Promise<Object>} Graph analysis with nodes and edges
   */
  async analyzeSourceGraph(sources) {
    logger.info('Source graph analysis started', { sourceCount: sources.length });

    const sourcesText = sources.map((s, i) => 
      `[${i + 1}] URL: ${s.url}\nTitle: ${s.title}\nDate: ${s.publishDate || 'Unknown'}\nSnippet: ${s.snippet?.substring(0, 300) || 'N/A'}`
    ).join('\n\n');

    const userPrompt = `Analyze these news sources and create a source graph:

${sourcesText}

Output JSON with:
{
  "nodes": [
    { "id": "<unique_id>", "url": "<url>", "title": "<title>", "timestamp": "<ISO8601>", "role": "<origin|amplifier|modifier|debunker>", "snippet": "<key quote>" }
  ],
  "edges": [
    { "from": "<node_id>", "to": "<node_id>", "relationship": "<cites|quotes|contradicts|amplifies>", "evidence": "<why this connection exists>" }
  ],
  "origin_node": "<id of likely original source>",
  "claim_evolution": "<how the claim changed across sources>",
  "duplicate_clusters": [[<ids of near-duplicate content>]]
}`;

    try {
      const response = await this.makeRequest({
        messages: [
          { role: 'system', content: GRAPH_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      logger.info('Source graph analysis completed', { 
        nodes: result.nodes?.length, 
        edges: result.edges?.length 
      });

      return result;
    } catch (error) {
      logger.error('Source graph analysis failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Extract key claims from article text
   * @param {string} text - Article text
   * @returns {Promise<Array>} Array of extracted claims
   */
  async extractClaims(text) {
    const response = await this.makeRequest({
      messages: [
        { 
          role: 'system', 
          content: 'You are a claim extraction expert. Extract verifiable factual claims from text.' 
        },
        { 
          role: 'user', 
          content: `Extract the main verifiable factual claims from this text. Output JSON array:
          
${text.substring(0, 5000)}

Format: { "claims": [{ "claim": "<claim text>", "type": "<statistical|event|quote|attribution>", "verifiability": "<high|medium|low>" }] }` 
        }
      ],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.claims || [];
  }
}

// Export singleton instance
module.exports = new OpenAIService();

