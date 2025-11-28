/**
 * Verify Controller
 * 
 * Handles news verification requests from all sources.
 */

const logger = require('../utils/logger');
const orchestrator = require('../routes/agents/orchestrator');
const SourceGraph = require('../models/SourceGraph');
const AgentReport = require('../models/AgentReport');
const { isValidNewsUrl } = require('../utils/validators');

class VerifyController {
  /**
   * Handle verification request
   * POST /api/v1/verify
   */
  async verify(req, res) {
    const startTime = Date.now();
    const { url, text, source = 'frontend' } = req.body;

    logger.verification('Request received', {
      url,
      hasText: !!text,
      source,
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

      // Run verification through orchestrator
      const result = await orchestrator.verify({
        url,
        text,
        source
      });

      // Save to database
      const sourceGraph = new SourceGraph({
        hash: result.source_graph.hash,
        claim: result.metadata.claim,
        nodes: result.source_graph.nodes,
        edges: result.source_graph.edges,
        clusters: [],
        metadata: {
          sourceCount: result.metadata.evidence_count,
          nodeCount: result.source_graph.nodes.length,
          edgeCount: result.source_graph.edges.length,
          aiEnhanced: true
        },
        blockchain: {
          provider: 'polygon',
          transactionHash: result.blockchain_hash
        },
        verification: {
          verdict: result.verdict,
          accuracyScore: result.accuracy_score,
          confidence: result.metadata?.confidence
        },
        request: {
          source,
          originalUrl: url,
          processingTimeMs: Date.now() - startTime
        }
      });

      await sourceGraph.save();

      // Save agent reports
      for (const report of result.agent_reports) {
        const agentReport = new AgentReport({
          sourceGraphId: sourceGraph._id,
          agentName: report.agent_name,
          agentType: this.getAgentType(report.agent_name),
          credibilityScore: report.credibility_score,
          confidence: report.confidence || 0.5,
          verdict: this.normalizeVerdict(report.verdict),
          summary: report.summary,
          detailedReasoning: report.reasoning,
          evidenceLinks: report.evidence_links,
          agreedWithFinal: report.verdict === result.verdict
        });
        await agentReport.save();
      }

      logger.verification('Completed', {
        verdict: result.verdict,
        accuracy: result.accuracy_score,
        processingTime: Date.now() - startTime
      });

      // Return response in required format
      res.json({
        verdict: result.verdict,
        accuracy_score: result.accuracy_score,
        agent_reports: result.agent_reports,
        source_graph: result.source_graph,
        blockchain_hash: result.blockchain_hash,
        timestamp: result.timestamp,
        metadata: result.metadata
      });
    } catch (error) {
      logger.error('Verification failed', {
        error: error.message,
        stack: error.stack,
        url,
        source
      });

      res.status(500).json({
        error: 'Verification Failed',
        message: process.env.NODE_ENV === 'production'
          ? 'An error occurred during verification'
          : error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get verification by hash
   * GET /api/v1/verify/:hash
   */
  async getByHash(req, res) {
    const { hash } = req.params;

    try {
      const sourceGraph = await SourceGraph.findByHash(hash);

      if (!sourceGraph) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Verification not found for this hash',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        verdict: sourceGraph.verification.verdict,
        accuracy_score: sourceGraph.verification.accuracyScore,
        source_graph: {
          nodes: sourceGraph.nodes,
          edges: sourceGraph.edges,
          hash: sourceGraph.hash
        },
        blockchain_hash: sourceGraph.blockchain?.transactionHash,
        timestamp: sourceGraph.createdAt.toISOString(),
        metadata: {
          claim: sourceGraph.claim,
          source: sourceGraph.request.source,
          processingTimeMs: sourceGraph.request.processingTimeMs
        }
      });
    } catch (error) {
      logger.error('Failed to get verification', { hash, error: error.message });
      res.status(500).json({
        error: 'Internal Error',
        message: 'Failed to retrieve verification',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get recent verifications
   * GET /api/v1/verify/recent
   */
  async getRecent(req, res) {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    try {
      const verifications = await SourceGraph.getRecentVerifications(limit);
      
      res.json({
        verifications: verifications.map(v => v.getSummary()),
        count: verifications.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to get recent verifications', { error: error.message });
      res.status(500).json({
        error: 'Internal Error',
        message: 'Failed to retrieve recent verifications',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get verification statistics
   * GET /api/v1/verify/stats
   */
  async getStats(req, res) {
    try {
      const statsBySource = await SourceGraph.getStatsBySource();
      
      res.json({
        bySource: statsBySource,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to get stats', { error: error.message });
      res.status(500).json({
        error: 'Internal Error',
        message: 'Failed to retrieve statistics',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get agent type from name
   */
  getAgentType(agentName) {
    const nameLower = agentName.toLowerCase();
    if (nameLower.includes('toi') || nameLower.includes('times of india')) return 'toi';
    if (nameLower.includes('indiatimes') || nameLower.includes('india times')) return 'indiaTimes';
    if (nameLower.includes('ndtv')) return 'ndtv';
    return 'generic';
  }

  /**
   * Normalize verdict string
   */
  normalizeVerdict(verdict) {
    const normalized = verdict?.toLowerCase();
    if (['true', 'false', 'mixed', 'unknown'].includes(normalized)) {
      return normalized;
    }
    return 'unknown';
  }
}

module.exports = new VerifyController();

