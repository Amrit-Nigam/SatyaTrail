/**
 * Extension Controller
 * 
 * Handles verification requests from browser extension.
 * Optimized for quick responses with compact format.
 */

const logger = require('../utils/logger');
const orchestrator = require('../routes/agents/orchestrator');
const SourceGraph = require('../models/SourceGraph');
const { isValidNewsUrl } = require('../utils/validators');

class ExtensionController {
  /**
   * Handle extension verification request
   * POST /api/v1/verify/extension
   */
  async verify(req, res) {
    const startTime = Date.now();
    const { url, text, testMode } = req.body;

    logger.verification('Extension request received', {
      url,
      hasText: !!text,
      testMode,
      ip: req.ip
    });

    try {
      // Validate URL if provided
      if (url && !isValidNewsUrl(url)) {
        return res.status(400).json({
          error: 'Invalid URL',
          message: 'The provided URL is not a valid news URL',
          timestamp: new Date().toISOString()
        });
      }

      // Use quick verification (single agent)
      let result;
      try {
        result = await orchestrator.verifyQuick({
          url,
          text,
          source: 'extension',
          testMode
        });
      } catch (verifyError) {
        logger.error('Orchestrator verifyQuick failed', {
          error: verifyError.message,
          stack: verifyError.stack,
          url
        });
        throw verifyError;
      }

      // Ensure we have required fields
      if (!result || !result.verdict) {
        throw new Error('Invalid verification result from orchestrator');
      }

      const processingTime = Date.now() - startTime;
      const isTestMode = testMode || result.metadata?.test_mode;
      let graphHash = result.source_graph?.hash || this.generateQuickHash(url, text);

      // Skip database operations in test mode
      if (!isTestMode) {
        const sourceGraph = new SourceGraph({
          hash: graphHash,
          claim: result.metadata?.claim || text?.substring(0, 200) || url,
          nodes: result.source_graph?.nodes || [],
          edges: result.source_graph?.edges || [],
          verification: {
            verdict: result.verdict,
            accuracyScore: result.accuracy_score || 0.5,
            confidence: result.confidence || 0.5
          },
          request: {
            source: 'extension',
            originalUrl: url,
            processingTimeMs: processingTime
          }
        });

        try {
          await sourceGraph.save();
        } catch (saveError) {
          // Log but don't fail - we can still return the result
          logger.warn('Failed to save extension verification to database', {
            error: saveError.message
          });
        }
      }

      logger.verification('Extension completed', {
        verdict: result.verdict,
        processingTime,
        testMode: isTestMode
      });

      // Return compact response for extension
      res.json({
        verdict: result.verdict,
        accuracy_score: result.accuracy_score,
        summary: result.summary,
        detail_url: `${process.env.BASE_URL || ''}/api/v1/verify/${graphHash}`,
        timestamp: new Date().toISOString(),
        processing_time_ms: processingTime
      });
    } catch (error) {
      logger.error('Extension verification failed', {
        error: error.message,
        url
      });

      res.status(500).json({
        error: 'Verification Failed',
        message: 'Unable to verify content',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Quick status check for extension
   * GET /api/v1/verify/extension/status
   */
  async status(req, res) {
    res.json({
      status: 'operational',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if a URL has been verified before
   * GET /api/v1/verify/extension/check
   */
  async checkUrl(req, res) {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: 'Missing URL',
        message: 'URL parameter is required'
      });
    }

    try {
      // Look for existing verification with this URL
      const existing = await SourceGraph.findOne({
        'request.originalUrl': url
      }).sort({ createdAt: -1 });

      if (existing) {
        res.json({
          found: true,
          verdict: existing.verification.verdict,
          accuracy_score: existing.verification.accuracyScore,
          verified_at: existing.createdAt.toISOString(),
          detail_url: `/api/v1/verify/${existing.hash}`
        });
      } else {
        res.json({
          found: false,
          message: 'No verification found for this URL'
        });
      }
    } catch (error) {
      logger.error('URL check failed', { url, error: error.message });
      res.status(500).json({
        error: 'Check Failed',
        message: 'Unable to check URL'
      });
    }
  }

  /**
   * Generate a quick hash for extension requests
   */
  generateQuickHash(url, text) {
    const crypto = require('crypto');
    const content = url || text || Date.now().toString();
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}

module.exports = new ExtensionController();

