/**
 * Generic Verification Agent
 * 
 * Neutral, evidence-based fact-checking without ideological bias.
 * Used as baseline and for extension quick verification.
 */

const logger = require('../../utils/logger');
const openaiService = require('../../services/openaiService');
const tavilyService = require('../../services/tavilyService');

class GenericAgent {
  constructor() {
    this.name = 'Generic Verification Agent';
    this.type = 'generic';
    
    // Neutral configuration
    this.biasProfile = {
      political: 'neutral',
      editorial: 'evidence-based',
      approach: 'scientific-method',
      focus: ['primary-sources', 'cross-verification', 'factual-accuracy']
    };

    // Fact-checking organizations
    this.factCheckers = [
      'snopes.com',
      'factcheck.org',
      'politifact.com',
      'altnews.in',
      'boomlive.in',
      'vishvasnews.com',
      'factly.in',
      'thequint.com/news/webqoof'
    ];

    // Primary source domains
    this.primarySources = [
      'reuters.com',
      'apnews.com',
      'afp.com',
      'who.int',
      'un.org',
      '.gov',
      '.gov.in'
    ];
  }

  /**
   * Verify a claim using neutral, evidence-based approach
   * @param {string} claim - The claim to verify
   * @param {Array} evidence - Array of evidence objects
   * @returns {Promise<Object>} Verification report
   */
  async verify(claim, evidence) {
    logger.info('Generic Agent: Starting verification', { claim: claim.substring(0, 100) });

    // Check for existing fact-checks
    const factCheckAnalysis = this.analyzeFactChecks(evidence);

    // Score evidence with neutral methodology
    const scoredEvidence = this.scoreEvidence(evidence);

    // Use OpenAI with generic prompt
    const result = await openaiService.agentVerify(this.type, claim, scoredEvidence);

    // Apply neutral adjustments
    const adjustedResult = this.applyNeutralAdjustments(result, factCheckAnalysis, scoredEvidence);

    logger.info('Generic Agent: Verification complete', {
      verdict: adjustedResult.verdict,
      credibility: adjustedResult.credibility_score,
      hasFactCheck: factCheckAnalysis.hasFactCheck
    });

    return adjustedResult;
  }

  /**
   * Analyze evidence for fact-checker findings
   */
  analyzeFactChecks(evidence) {
    const factCheckEvidence = evidence.filter(e => {
      const domain = this.extractDomain(e.url);
      return this.factCheckers.some(fc => domain.includes(fc));
    });

    // Analyze fact-check verdicts from snippets
    const verdictKeywords = {
      false: ['false', 'fake', 'misleading', 'misinformation', 'hoax', 'debunked'],
      true: ['true', 'correct', 'accurate', 'verified', 'confirmed'],
      mixed: ['partly true', 'partially', 'mixed', 'context', 'misleading']
    };

    let factCheckVerdict = null;
    for (const fc of factCheckEvidence) {
      const snippet = (fc.snippet || '').toLowerCase();
      
      for (const [verdict, keywords] of Object.entries(verdictKeywords)) {
        if (keywords.some(k => snippet.includes(k))) {
          factCheckVerdict = verdict;
          break;
        }
      }
      if (factCheckVerdict) break;
    }

    return {
      hasFactCheck: factCheckEvidence.length > 0,
      factCheckCount: factCheckEvidence.length,
      factCheckVerdict,
      factCheckSources: factCheckEvidence.map(e => this.extractDomain(e.url))
    };
  }

  /**
   * Score evidence with neutral methodology
   */
  scoreEvidence(evidence) {
    return evidence.map(e => {
      let score = e.domainReputationScore || 50;

      const domain = this.extractDomain(e.url);

      // Fact-checkers get highest score
      if (this.factCheckers.some(fc => domain.includes(fc))) {
        score = 95;
      }
      // Primary/wire services
      else if (this.primarySources.some(ps => domain.includes(ps))) {
        score = Math.max(score, 85);
      }
      // Government domains (official records)
      else if (domain.endsWith('.gov') || domain.endsWith('.gov.in')) {
        score = Math.max(score, 80);
      }
      // Educational/research
      else if (domain.endsWith('.edu') || domain.endsWith('.ac.in')) {
        score = Math.max(score, 75);
      }

      // Penalize social media
      if (['twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'tiktok.com'].some(sm => domain.includes(sm))) {
        score = Math.min(score, 30);
      }

      return {
        ...e,
        domainReputationScore: score
      };
    });
  }

  /**
   * Apply neutral adjustments based on evidence quality
   */
  applyNeutralAdjustments(result, factCheckAnalysis, evidence) {
    // If fact-checkers have already verified
    if (factCheckAnalysis.hasFactCheck && factCheckAnalysis.factCheckVerdict) {
      const fcVerdict = factCheckAnalysis.factCheckVerdict;
      
      // Strong agreement with fact-checkers
      if (fcVerdict === 'false' && result.verdict !== 'false') {
        result.verdict = 'false';
        result.credibility_score = Math.min(result.credibility_score, 30);
        result.concerns = result.concerns || [];
        result.concerns.push(`Fact-checkers (${factCheckAnalysis.factCheckSources.join(', ')}) have rated this claim as false`);
      } else if (fcVerdict === 'true' && result.verdict !== 'true') {
        result.credibility_score = Math.max(result.credibility_score, 70);
      }

      result.key_findings = result.key_findings || [];
      result.key_findings.push(`Fact-check available: ${factCheckAnalysis.factCheckVerdict} (${factCheckAnalysis.factCheckCount} source(s))`);
    }

    // Calculate evidence quality score
    const avgReputation = evidence.reduce((sum, e) => sum + e.domainReputationScore, 0) / evidence.length;
    
    // Adjust confidence based on evidence quality
    if (avgReputation < 50) {
      result.confidence = Math.max(result.confidence - 0.2, 0.3);
      result.concerns = result.concerns || [];
      result.concerns.push('Low average source quality - verification uncertain');
    }

    // Check source diversity
    const domains = new Set(evidence.map(e => this.extractDomain(e.url)));
    if (domains.size < 2) {
      result.confidence = Math.max(result.confidence - 0.15, 0.3);
      result.concerns = result.concerns || [];
      result.concerns.push('Limited source diversity');
    }

    // Primary source verification
    const hasPrimarySource = evidence.some(e => {
      const domain = this.extractDomain(e.url);
      return this.primarySources.some(ps => domain.includes(ps));
    });

    if (hasPrimarySource) {
      result.key_findings = result.key_findings || [];
      result.key_findings.push('Primary/wire service source found');
      result.credibility_score = Math.min(100, result.credibility_score + 5);
    }

    // Ensure agent name is correct
    result.agent_name = this.name;

    return result;
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  /**
   * Get agent metadata
   */
  getMetadata() {
    return {
      name: this.name,
      type: this.type,
      biasProfile: this.biasProfile,
      factCheckers: this.factCheckers,
      primarySources: this.primarySources
    };
  }
}

// Export singleton instance
module.exports = new GenericAgent();

