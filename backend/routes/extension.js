/**
 * Extension Routes
 * 
 * Complete backend route for Chrome Extension integration.
 * Receives DOM content, analyzes with GPT-5, fact-checks with Tavily,
 * and returns structured verification results.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const openaiService = require('../services/openaiService');
const tavilyService = require('../services/tavilyService');
const logger = require('../utils/logger');

// Rate limiting for extension endpoint
const extensionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many requests from this extension. Please wait.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * GPT Prompt: Analyze DOM content
 * Summarizes page, extracts claims, identifies statements needing verification
 */
const DOM_ANALYSIS_PROMPT = `You are an expert content analyzer for a fact-checking system.

Analyze the provided webpage content and:
1. Create a concise summary of the page
2. Extract all factual claims made in the content
3. Identify statements that require verification (potentially misleading or unverified)

Be thorough but focus on verifiable factual claims, not opinions.

Output in this exact JSON format:
{
  "summary": "<concise 2-3 sentence summary of the page>",
  "claims": [
    {
      "claim": "<exact claim text>",
      "type": "<statistical|event|quote|attribution|scientific|political>",
      "verifiability": "<high|medium|low>",
      "context": "<brief context where claim appears>"
    }
  ],
  "statements_requiring_verification": [
    {
      "statement": "<statement text>",
      "reason": "<why this needs verification>",
      "risk_level": "<high|medium|low>"
    }
  ],
  "page_metadata": {
    "topic": "<main topic>",
    "content_type": "<news|blog|social|official|unknown>",
    "potential_bias": "<left|center|right|unknown>",
    "overall_credibility_signal": "<high|medium|low|unknown>"
  }
}`;

/**
 * GPT Prompt: Final verdict after evidence analysis
 */
const VERDICT_PROMPT = `You are the final arbiter in a fact-checking system.

You will receive:
1. Original claims extracted from a webpage
2. Evidence gathered from Tavily search (real-time web search)

Your task:
1. Compare each claim against the evidence
2. Evaluate truthfulness of each claim
3. Generate a final overall verdict for the webpage
4. Suggest corrections for any misinformation detected

Be fair, balanced, and base your verdict strictly on evidence.

Output in this exact JSON format:
{
  "overall_verdict": "<True|False|Misleading|Partially True|Unverifiable>",
  "confidence_score": <0-100>,
  "claim_verdicts": [
    {
      "claim": "<claim text>",
      "verdict": "<True|False|Misleading|Partially True|Unverifiable>",
      "confidence": <0-100>,
      "evidence_summary": "<brief summary of supporting/contradicting evidence>",
      "sources": ["<url1>", "<url2>"]
    }
  ],
  "misinformation_detected": <true|false>,
  "suggested_corrections": [
    {
      "original_claim": "<misleading claim>",
      "correction": "<accurate information>",
      "source": "<authoritative source URL>"
    }
  ],
  "supporting_evidence": [
    {
      "title": "<evidence title>",
      "url": "<source URL>",
      "relevance": "<how it supports/contradicts claims>"
    }
  ],
  "summary": "<comprehensive summary of findings>",
  "recommendation": "<user recommendation based on findings>"
}`;

/**
 * POST /api/v1/verify/extension/analyze
 * 
 * Main endpoint for Chrome extension DOM analysis.
 * Receives DOM content, processes through GPT-5 and Tavily,
 * returns structured verification result.
 * 
 * Request body: { 
 *   domContent: string,      // Extracted DOM text content
 *   url: string,             // Page URL
 *   title?: string,          // Page title
 *   metadata?: object        // Optional page metadata
 * }
 * 
 * Response: Structured verification result
 */
router.post('/analyze', extensionLimiter, async (req, res) => {
  const startTime = Date.now();
  const { domContent, url, title, metadata } = req.body;

  logger.info('Extension analyze request received', {
    url,
    contentLength: domContent?.length,
    hasMetadata: !!metadata
  });

  try {
    // Validate request
    if (!domContent || typeof domContent !== 'string') {
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'domContent is required and must be a string',
        timestamp: new Date().toISOString()
      });
    }

    if (domContent.length < 50) {
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'domContent is too short for meaningful analysis',
        timestamp: new Date().toISOString()
      });
    }

    if (domContent.length > 100000) {
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'domContent exceeds maximum length (100KB)',
        timestamp: new Date().toISOString()
      });
    }

    // STEP 1: Send DOM content to GPT for analysis
    logger.info('Step 1: Analyzing DOM content with GPT');
    
    let domAnalysis;
    try {
      const truncatedContent = domContent.substring(0, 15000); // Limit for GPT context
      
      const analysisResponse = await openaiService.makeRequest({
        messages: [
          { role: 'system', content: DOM_ANALYSIS_PROMPT },
          { 
            role: 'user', 
            content: `Analyze this webpage content:\n\nURL: ${url || 'Unknown'}\nTitle: ${title || 'Unknown'}\n\nContent:\n${truncatedContent}` 
          }
        ],
        temperature: 0.3,
        max_completion_tokens: 2500,
        response_format: { type: 'json_object' }
      });

      domAnalysis = JSON.parse(analysisResponse.choices[0].message.content);
      
      logger.info('DOM analysis completed', {
        claimsFound: domAnalysis.claims?.length || 0,
        statementsToVerify: domAnalysis.statements_requiring_verification?.length || 0
      });
    } catch (gptError) {
      logger.error('GPT DOM analysis failed', { error: gptError.message });
      return res.status(502).json({
        error: 'AI Analysis Failed',
        message: 'Failed to analyze page content with AI',
        details: process.env.NODE_ENV !== 'production' ? gptError.message : undefined,
        timestamp: new Date().toISOString()
      });
    }

    // Check if there are claims to verify
    const claimsToVerify = [
      ...(domAnalysis.claims || []),
      ...(domAnalysis.statements_requiring_verification || []).map(s => ({
        claim: s.statement,
        type: 'verification_required',
        verifiability: 'high',
        context: s.reason
      }))
    ].filter(c => c.verifiability !== 'low').slice(0, 5); // Limit to top 5 claims

    if (claimsToVerify.length === 0) {
      // No significant claims found - return early
      return res.json({
        overall_verdict: 'Unverifiable',
        confidence_score: 50,
        summary: domAnalysis.summary,
        message: 'No significant factual claims found to verify',
        page_analysis: domAnalysis,
        claim_verdicts: [],
        misinformation_detected: false,
        suggested_corrections: [],
        supporting_evidence: [],
        processing_time_ms: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    }

    // STEP 2: Send claims to Tavily for fact-checking
    logger.info('Step 2: Gathering evidence from Tavily', { claimCount: claimsToVerify.length });
    
    let allEvidence = [];
    try {
      // Search for evidence for each claim
      const evidencePromises = claimsToVerify.map(async (claim) => {
        try {
          const searchResults = await tavilyService.searchClaim(claim.claim, {
            maxResults: 4
          });
          
          return {
            claim: claim.claim,
            evidence: [
              ...searchResults.directResults,
              ...searchResults.factCheckResults
            ],
            tavilyAnswer: searchResults.answer
          };
        } catch (searchError) {
          logger.warn('Tavily search failed for claim', { 
            claim: claim.claim.substring(0, 50), 
            error: searchError.message 
          });
          return {
            claim: claim.claim,
            evidence: [],
            tavilyAnswer: null,
            error: searchError.message
          };
        }
      });

      const evidenceResults = await Promise.all(evidencePromises);
      allEvidence = evidenceResults;
      
      logger.info('Evidence gathering completed', {
        totalEvidence: evidenceResults.reduce((sum, e) => sum + e.evidence.length, 0)
      });
    } catch (tavilyError) {
      logger.error('Tavily evidence gathering failed', { error: tavilyError.message });
      return res.status(502).json({
        error: 'Evidence Gathering Failed',
        message: 'Failed to gather evidence from search',
        details: process.env.NODE_ENV !== 'production' ? tavilyError.message : undefined,
        timestamp: new Date().toISOString()
      });
    }

    // STEP 3: Send evidence back to GPT for final verdict
    logger.info('Step 3: Generating final verdict with GPT');
    
    let finalVerdict;
    try {
      // Format evidence for GPT
      const evidenceText = allEvidence.map((item, idx) => {
        const evidenceList = item.evidence.map((e, i) => 
          `  [${i + 1}] ${e.title}\n      URL: ${e.url}\n      Snippet: ${e.snippet?.substring(0, 300) || 'N/A'}\n      Reputation: ${e.domainReputationScore}/100`
        ).join('\n');
        
        return `CLAIM ${idx + 1}: "${item.claim}"\nTavily Answer: ${item.tavilyAnswer || 'No direct answer'}\nEvidence:\n${evidenceList || '  No evidence found'}`;
      }).join('\n\n---\n\n');

      const verdictResponse = await openaiService.makeRequest({
        messages: [
          { role: 'system', content: VERDICT_PROMPT },
          {
            role: 'user',
            content: `Original Page Summary: ${domAnalysis.summary}\n\nClaims and Evidence:\n\n${evidenceText}\n\nProvide your final verdict.`
          }
        ],
        temperature: 0.2,
        max_completion_tokens: 3000,
        response_format: { type: 'json_object' }
      });

      finalVerdict = JSON.parse(verdictResponse.choices[0].message.content);
      
      logger.info('Final verdict generated', {
        verdict: finalVerdict.overall_verdict,
        confidence: finalVerdict.confidence_score,
        misinformationDetected: finalVerdict.misinformation_detected
      });
    } catch (verdictError) {
      logger.error('GPT verdict generation failed', { error: verdictError.message });
      return res.status(502).json({
        error: 'Verdict Generation Failed',
        message: 'Failed to generate final verdict',
        details: process.env.NODE_ENV !== 'production' ? verdictError.message : undefined,
        timestamp: new Date().toISOString()
      });
    }

    // STEP 4: Return structured response
    const processingTime = Date.now() - startTime;
    
    const response = {
      // Main verdict
      overall_verdict: finalVerdict.overall_verdict,
      confidence_score: finalVerdict.confidence_score,
      
      // Page analysis
      page_summary: domAnalysis.summary,
      page_metadata: domAnalysis.page_metadata,
      
      // Claim-by-claim verdicts
      claim_verdicts: finalVerdict.claim_verdicts || [],
      
      // Misinformation detection
      misinformation_detected: finalVerdict.misinformation_detected || false,
      suggested_corrections: finalVerdict.suggested_corrections || [],
      
      // Supporting evidence
      supporting_evidence: finalVerdict.supporting_evidence || [],
      
      // Summary and recommendation
      summary: finalVerdict.summary,
      recommendation: finalVerdict.recommendation,
      
      // Metadata
      url: url || null,
      claims_analyzed: claimsToVerify.length,
      evidence_sources: allEvidence.reduce((sum, e) => sum + e.evidence.length, 0),
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString()
    };

    logger.info('Extension analysis completed', {
      url,
      verdict: response.overall_verdict,
      confidence: response.confidence_score,
      processingTime
    });

    res.json(response);
  } catch (error) {
    logger.error('Extension analyze failed', {
      error: error.message,
      stack: error.stack,
      url
    });

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred during analysis',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v1/verify/extension/status
 * Health check for extension
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    version: '2.0.0',
    features: ['dom_analysis', 'claim_extraction', 'fact_checking', 'verdict_generation'],
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/v1/verify/extension/quick
 * Quick verification for shorter text snippets
 * 
 * Request body: { text: string, url?: string }
 * Response: Quick verdict
 */
router.post('/quick', extensionLimiter, async (req, res) => {
  const startTime = Date.now();
  const { text, url } = req.body;

  try {
    if (!text || typeof text !== 'string' || text.length < 10) {
      return res.status(400).json({
        error: 'Invalid Request',
        message: 'text is required and must be at least 10 characters',
        timestamp: new Date().toISOString()
      });
    }

    // Quick GPT analysis
    const quickResponse = await openaiService.makeRequest({
      messages: [
        {
          role: 'system',
          content: 'You are a quick fact-checker. Analyze the given text and provide a brief verdict. Output JSON: { "verdict": "<True|False|Misleading|Unverifiable>", "confidence": <0-100>, "reason": "<brief reason>" }'
        },
        { role: 'user', content: text.substring(0, 2000) }
      ],
      temperature: 0.3,
      max_completion_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(quickResponse.choices[0].message.content);

    res.json({
      verdict: result.verdict,
      confidence_score: result.confidence,
      reason: result.reason,
      url: url || null,
      processing_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Quick verification failed', { error: error.message });
    res.status(500).json({
      error: 'Verification Failed',
      message: 'Unable to verify content',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
