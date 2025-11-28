/**
 * Times of India (TOI) Agent
 * 
 * Fact-checking agent with TOI's editorial perspective:
 * - Mainstream centrist viewpoint
 * - Focus on national interest and development
 * - Strong emphasis on economic angles
 */

const logger = require('../../utils/logger');
const openaiService = require('../../services/openaiService');

class TOIAgent {
  constructor() {
    this.name = 'Times of India Agent';
    this.type = 'toi';
    
    // TOI-specific configuration
    this.biasProfile = {
      political: 'centrist',
      economic: 'pro-business',
      editorial: 'mainstream',
      focus: ['national-interest', 'development', 'economy']
    };

    // Trusted domains from TOI's perspective
    this.trustedDomains = [
      'timesofindia.indiatimes.com',
      'economictimes.indiatimes.com',
      'pib.gov.in',
      'gov.in',
      'rbi.org.in',
      'sebi.gov.in'
    ];
  }

  /**
   * Verify a claim using TOI's editorial perspective
   * @param {string} claim - The claim to verify
   * @param {Array} evidence - Array of evidence objects
   * @returns {Promise<Object>} Verification report
   */
  async verify(claim, evidence) {
    logger.info('TOI Agent: Starting verification', { claim: claim.substring(0, 100) });

    // Pre-process evidence with TOI-specific scoring
    const scoredEvidence = this.scoreEvidence(evidence);

    // Use OpenAI with TOI-specific prompt
    const result = await openaiService.agentVerify(this.type, claim, scoredEvidence);

    // Post-process with TOI-specific adjustments
    const adjustedResult = this.applyBiasAdjustments(result, scoredEvidence);

    logger.info('TOI Agent: Verification complete', {
      verdict: adjustedResult.verdict,
      credibility: adjustedResult.credibility_score
    });

    return adjustedResult;
  }

  /**
   * Score evidence based on TOI's trust hierarchy
   */
  scoreEvidence(evidence) {
    return evidence.map(e => {
      let trustBonus = 0;

      // Check if from trusted domain
      const domain = this.extractDomain(e.url);
      if (this.trustedDomains.some(td => domain.includes(td))) {
        trustBonus += 20;
      }

      // Government sources get highest trust
      if (domain.endsWith('.gov.in') || domain.endsWith('.gov')) {
        trustBonus += 25;
      }

      // Economic/business sources
      if (domain.includes('economic') || domain.includes('business')) {
        trustBonus += 10;
      }

      return {
        ...e,
        domainReputationScore: Math.min(100, (e.domainReputationScore || 50) + trustBonus),
        trustBonus
      };
    });
  }

  /**
   * Apply TOI-specific bias adjustments to the result
   */
  applyBiasAdjustments(result, evidence) {
    // Check for government sources
    const hasGovSource = evidence.some(e => 
      e.url.includes('.gov.in') || e.url.includes('.gov')
    );

    // TOI tends to trust government sources more
    if (hasGovSource && result.verdict === 'unknown') {
      // If government source supports the claim, lean towards true
      const govEvidence = evidence.filter(e => 
        e.url.includes('.gov.in') || e.url.includes('.gov')
      );
      if (govEvidence.length > 0) {
        result.credibility_score = Math.min(100, result.credibility_score + 10);
        result.key_findings = result.key_findings || [];
        result.key_findings.push('Government sources provide corroboration');
      }
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
      trustedDomains: this.trustedDomains
    };
  }
}

// Export singleton instance
module.exports = new TOIAgent();

