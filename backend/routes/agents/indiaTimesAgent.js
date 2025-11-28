/**
 * India Times Agent
 * 
 * Fact-checking agent with India Times' digital-first perspective:
 * - Focus on trending and viral content
 * - Digital-native audience
 * - Quick to cover social media controversies
 */

const logger = require('../../utils/logger');
const openaiService = require('../../services/openaiService');

class IndiaTimesAgent {
  constructor() {
    this.name = 'India Times Agent';
    this.type = 'indiaTimes';
    
    // India Times-specific configuration
    this.biasProfile = {
      political: 'varied',
      content: 'digital-first',
      editorial: 'trending-focused',
      focus: ['viral-content', 'social-media', 'technology', 'lifestyle']
    };

    // Social media and tech-focused domains
    this.relevantDomains = [
      'indiatimes.com',
      'techcrunch.com',
      'theverge.com',
      'wired.com',
      'mashable.com'
    ];

    // Social media signals to watch
    this.socialSignals = [
      'viral', 'trending', 'went viral', 'social media',
      'twitter', 'instagram', 'facebook', 'whatsapp forward'
    ];
  }

  /**
   * Verify a claim using India Times' digital perspective
   * @param {string} claim - The claim to verify
   * @param {Array} evidence - Array of evidence objects
   * @returns {Promise<Object>} Verification report
   */
  async verify(claim, evidence) {
    logger.info('India Times Agent: Starting verification', { claim: claim.substring(0, 100) });

    // Analyze for viral/social media patterns
    const viralAnalysis = this.analyzeViralPatterns(claim, evidence);

    // Pre-process evidence with India Times-specific scoring
    const scoredEvidence = this.scoreEvidence(evidence, viralAnalysis);

    // Use OpenAI with India Times-specific prompt
    const result = await openaiService.agentVerify(this.type, claim, scoredEvidence);

    // Post-process with digital media adjustments
    const adjustedResult = this.applyDigitalAdjustments(result, viralAnalysis);

    logger.info('India Times Agent: Verification complete', {
      verdict: adjustedResult.verdict,
      credibility: adjustedResult.credibility_score,
      isViral: viralAnalysis.isViral
    });

    return adjustedResult;
  }

  /**
   * Analyze claim for viral/social media patterns
   */
  analyzeViralPatterns(claim, evidence) {
    const claimLower = claim.toLowerCase();
    
    // Check for social media signals
    const hasSocialSignals = this.socialSignals.some(signal => 
      claimLower.includes(signal)
    );

    // Check for forwarded message patterns
    const forwardPatterns = [
      'forward this', 'share this', 'must read', 'breaking',
      'government has announced', 'did you know'
    ];
    const hasForwardPattern = forwardPatterns.some(p => claimLower.includes(p));

    // Check evidence for social media origins
    const socialMediaEvidence = evidence.filter(e => {
      const domain = this.extractDomain(e.url);
      return ['twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'reddit.com']
        .some(sm => domain.includes(sm));
    });

    return {
      isViral: hasSocialSignals || hasForwardPattern,
      hasSocialSignals,
      hasForwardPattern,
      socialMediaSourceCount: socialMediaEvidence.length,
      riskLevel: this.calculateViralRisk(hasSocialSignals, hasForwardPattern, socialMediaEvidence.length)
    };
  }

  /**
   * Calculate viral misinformation risk
   */
  calculateViralRisk(hasSocialSignals, hasForwardPattern, socialCount) {
    let risk = 0;
    if (hasSocialSignals) risk += 30;
    if (hasForwardPattern) risk += 40;
    risk += socialCount * 10;
    return Math.min(100, risk);
  }

  /**
   * Score evidence with digital media perspective
   */
  scoreEvidence(evidence, viralAnalysis) {
    return evidence.map(e => {
      let adjustedScore = e.domainReputationScore || 50;

      const domain = this.extractDomain(e.url);

      // Tech/digital media sources are valued
      if (this.relevantDomains.some(rd => domain.includes(rd))) {
        adjustedScore += 10;
      }

      // Social media origins are noted but scored lower for credibility
      if (['twitter.com', 'x.com', 'facebook.com'].some(sm => domain.includes(sm))) {
        adjustedScore -= 20;
      }

      // Fact-checkers get bonus when dealing with viral content
      if (viralAnalysis.isViral) {
        const factCheckers = ['snopes.com', 'altnews.in', 'boomlive.in', 'factcheck.org'];
        if (factCheckers.some(fc => domain.includes(fc))) {
          adjustedScore += 25;
        }
      }

      return {
        ...e,
        domainReputationScore: Math.max(0, Math.min(100, adjustedScore))
      };
    });
  }

  /**
   * Apply digital media specific adjustments
   */
  applyDigitalAdjustments(result, viralAnalysis) {
    // If content appears viral and no solid debunking found
    if (viralAnalysis.isViral && viralAnalysis.riskLevel > 50) {
      // Be more skeptical
      if (result.verdict === 'true') {
        result.credibility_score = Math.max(result.credibility_score - 15, 40);
        result.concerns = result.concerns || [];
        result.concerns.push('Content shows viral/forwarded message patterns - exercise caution');
      }
    }

    // Add viral analysis to findings
    if (viralAnalysis.isViral) {
      result.key_findings = result.key_findings || [];
      result.key_findings.push(`Viral content pattern detected (risk level: ${viralAnalysis.riskLevel}%)`);
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
      relevantDomains: this.relevantDomains,
      socialSignals: this.socialSignals
    };
  }
}

// Export singleton instance
module.exports = new IndiaTimesAgent();

