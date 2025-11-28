/**
 * Orchestrator Agent
 * 
 * Coordinates multiple verification agents, aggregates their outputs,
 * and produces final verdicts with weighted scoring.
 */

const logger = require('../../utils/logger');
const openaiService = require('../../services/openaiService');
const tavilyService = require('../../services/tavilyService');
const graphService = require('../../services/graphService');
const blockchainService = require('../../services/blockchainService');
const reputationSystem = require('../../utils/reputationSystem');
const pLimit = require('p-limit');

// Import all agents
const toiAgent = require('./toiAgent');
const indiaTimesAgent = require('./indiaTimesAgent');
const ndtvAgent = require('./ndtvAgent');
const genericAgent = require('./genericAgent');

// Concurrency limit for parallel agent execution
const limit = pLimit(4);

class Orchestrator {
  constructor() {
    // Register all available agents
    this.agents = {
      toi: toiAgent,
      indiaTimes: indiaTimesAgent,
      ndtv: ndtvAgent,
      generic: genericAgent
    };

    // Default agent configuration
    this.defaultAgents = ['toi', 'ndtv', 'generic'];
  }

  /**
   * Run full verification pipeline
   * @param {Object} params - Verification parameters
   * @param {string} params.url - Article URL (optional)
   * @param {string} params.text - Raw text to verify (optional)
   * @param {string} params.source - Request source (frontend, telegram, twitter, extension)
   * @param {string[]} params.agents - List of agents to use (optional)
   * @returns {Promise<Object>} Complete verification result
   */
  async verify(params) {
    const { url, text, source = 'frontend', agents: requestedAgents } = params;
    const startTime = Date.now();
    
    logger.info('Orchestrator: Starting verification', { url, source, hasText: !!text });

    try {
      // Step 1: Extract or use provided claim
      const claim = await this.extractClaim(url, text);
      logger.info('Orchestrator: Claim extracted', { claim: claim.substring(0, 100) });

      // Step 2: Gather evidence using Tavily
      const evidence = await this.gatherEvidence(claim, url);
      logger.info('Orchestrator: Evidence gathered', { count: evidence.length });

      // Step 3: Run agents in parallel
      const agentsToRun = requestedAgents || this.defaultAgents;
      const agentReports = await this.runAgents(agentsToRun, claim, evidence);
      logger.info('Orchestrator: Agents completed', { reportCount: agentReports.length });

      // Step 4: Get agent reputations
      const reputations = await this.getAgentReputations(agentsToRun);

      // Step 5: Aggregate results using AI orchestrator
      const aggregatedResult = await openaiService.orchestratorAggregate(agentReports, reputations);

      // Step 6: Build source graph
      const sourceGraph = await graphService.buildGraph(claim, evidence);

      // Step 7: Store on blockchain
      const blockchainResult = await blockchainService.storeVerification({
        graphHash: sourceGraph.hash,
        verdict: aggregatedResult.verdict,
        timestamp: Date.now(),
        metadata: {
          source,
          agentCount: agentReports.length,
          evidenceCount: evidence.length
        }
      });

      // Step 8: Update agent reputations based on consensus
      await this.updateReputations(agentReports, aggregatedResult.verdict);

      // Step 9: Compile final result
      const result = {
        verdict: aggregatedResult.verdict,
        accuracy_score: aggregatedResult.accuracy_score,
        confidence: aggregatedResult.confidence,
        agent_reports: agentReports.map(r => ({
          agent_name: r.agent_name,
          credibility_score: r.credibility_score,
          summary: r.summary,
          evidence_links: r.evidence_links || [],
          reasoning: r.detailed_reasoning
        })),
        source_graph: {
          nodes: sourceGraph.nodes,
          edges: sourceGraph.edges,
          hash: sourceGraph.hash
        },
        blockchain_hash: blockchainResult.transactionHash,
        timestamp: new Date().toISOString(),
        metadata: {
          claim,
          source,
          url: url || null,
          processing_time_ms: Date.now() - startTime,
          agents_used: agentsToRun,
          evidence_count: evidence.length,
          consensus: aggregatedResult.agent_consensus,
          remaining_uncertainties: aggregatedResult.remaining_uncertainties
        }
      };

      logger.info('Orchestrator: Verification complete', {
        verdict: result.verdict,
        accuracy: result.accuracy_score,
        processingTime: result.metadata.processing_time_ms
      });

      return result;
    } catch (error) {
      logger.error('Orchestrator: Verification failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Extract claim from URL or text
   */
  async extractClaim(url, text) {
    if (text) {
      // If text is short, use it directly as the claim
      if (text.length < 500) {
        return text.trim();
      }
      // Extract main claims from longer text
      const claims = await openaiService.extractClaims(text);
      if (claims.length > 0) {
        return claims[0].claim;
      }
      return text.substring(0, 500).trim();
    }

    if (url) {
      // Fetch article content
      const article = await tavilyService.fetch(url);
      if (article.content) {
        const claims = await openaiService.extractClaims(article.content);
        if (claims.length > 0) {
          return claims[0].claim;
        }
        return article.title || article.content.substring(0, 300);
      }
      return article.title;
    }

    throw new Error('Either URL or text must be provided');
  }

  /**
   * Gather evidence from multiple sources
   */
  async gatherEvidence(claim, originalUrl) {
    const results = await tavilyService.searchClaim(claim, {
      maxResults: 8
    });

    // Combine direct results and fact-check results
    let allEvidence = [
      ...results.directResults,
      ...results.factCheckResults
    ];

    // If we have the original URL, fetch it too
    if (originalUrl) {
      try {
        const originalArticle = await tavilyService.fetch(originalUrl);
        allEvidence.unshift({
          url: originalUrl,
          title: originalArticle.title,
          snippet: originalArticle.content?.substring(0, 500),
          publishDate: originalArticle.publishDate,
          domainReputationScore: originalArticle.domainReputationScore,
          isOriginal: true
        });
      } catch (error) {
        logger.warn('Failed to fetch original URL', { url: originalUrl, error: error.message });
      }
    }

    // Deduplicate by URL
    const seen = new Set();
    allEvidence = allEvidence.filter(e => {
      if (seen.has(e.url)) return false;
      seen.add(e.url);
      return true;
    });

    return allEvidence;
  }

  /**
   * Run verification agents in parallel
   */
  async runAgents(agentNames, claim, evidence) {
    const tasks = agentNames.map(name => 
      limit(async () => {
        const agent = this.agents[name];
        if (!agent) {
          logger.warn(`Unknown agent: ${name}`);
          return null;
        }

        try {
          const report = await agent.verify(claim, evidence);
          return report;
        } catch (error) {
          logger.error(`Agent ${name} failed`, { error: error.message });
          return {
            agent_name: name,
            credibility_score: 0,
            confidence: 0,
            verdict: 'unknown',
            summary: `Agent failed: ${error.message}`,
            error: true
          };
        }
      })
    );

    const results = await Promise.all(tasks);
    return results.filter(r => r !== null);
  }

  /**
   * Get current reputation scores for agents
   */
  async getAgentReputations(agentNames) {
    const reputations = {};
    for (const name of agentNames) {
      reputations[name] = await reputationSystem.getReputation(name);
    }
    return reputations;
  }

  /**
   * Update agent reputations based on consensus
   */
  async updateReputations(agentReports, finalVerdict) {
    for (const report of agentReports) {
      if (report.error) continue;

      // Compare agent verdict with final verdict
      const agreed = report.verdict === finalVerdict;
      const confidenceWeight = report.confidence || 0.5;

      await reputationSystem.updateReputation(
        report.agent_name,
        agreed,
        confidenceWeight,
        {
          finalVerdict,
          agentVerdict: report.verdict,
          credibilityScore: report.credibility_score
        }
      );
    }
  }

  /**
   * Get quick verification for extension (optimized response)
   */
  async verifyQuick(params) {
    const { url, text } = params;
    
    // Use only generic agent for speed
    const result = await this.verify({
      ...params,
      agents: ['generic']
    });

    // Return compact response
    return {
      verdict: result.verdict,
      accuracy_score: result.accuracy_score,
      summary: result.agent_reports[0]?.summary || 'Unable to verify',
      detail_url: `/api/v1/verify?url=${encodeURIComponent(url || '')}`,
      timestamp: result.timestamp
    };
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      availableAgents: Object.keys(this.agents),
      defaultAgents: this.defaultAgents,
      status: 'operational'
    };
  }
}

// Export singleton instance
module.exports = new Orchestrator();

