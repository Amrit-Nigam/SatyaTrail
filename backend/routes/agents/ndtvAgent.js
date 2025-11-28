/**
 * NDTV Agent
 * 
 * Fact-checking agent with NDTV's editorial perspective:
 * - Liberal-leaning stance
 * - Strong emphasis on investigative journalism
 * - Critical analysis of government policies
 * - Focus on social issues and human interest
 */

const logger = require('../../utils/logger');
const openaiService = require('../../services/openaiService');

class NDTVAgent {
  constructor() {
    this.name = 'NDTV Agent';
    this.type = 'ndtv';
    
    // NDTV-specific configuration
    this.biasProfile = {
      political: 'liberal-leaning',
      editorial: 'investigative',
      approach: 'policy-critical',
      focus: ['social-issues', 'civil-liberties', 'policy-analysis', 'international']
    };

    // Sources NDTV would typically reference
    this.trustedSources = [
      'ndtv.com',
      'thehindu.com',
      'theguardian.com',
      'bbc.com',
      'nytimes.com',
      'washingtonpost.com',
      'scroll.in',
      'thewire.in'
    ];

    // Academic and research sources
    this.academicSources = [
      'jstor.org',
      'sciencedirect.com',
      'researchgate.net',
      'scholar.google.com',
      '.edu',
      '.ac.in'
    ];
  }

  /**
   * Verify a claim using NDTV's investigative perspective
   * @param {string} claim - The claim to verify
   * @param {Array} evidence - Array of evidence objects
   * @returns {Promise<Object>} Verification report
   */
  async verify(claim, evidence) {
    logger.info('NDTV Agent: Starting verification', { claim: claim.substring(0, 100) });

    // Analyze claim for policy/rights implications
    const policyAnalysis = this.analyzePolicyImplications(claim);

    // Pre-process evidence with NDTV-specific scoring
    const scoredEvidence = this.scoreEvidence(evidence, policyAnalysis);

    // Use OpenAI with NDTV-specific prompt
    const result = await openaiService.agentVerify(this.type, claim, scoredEvidence);

    // Post-process with investigative journalism adjustments
    const adjustedResult = this.applyInvestigativeAdjustments(result, policyAnalysis, evidence);

    logger.info('NDTV Agent: Verification complete', {
      verdict: adjustedResult.verdict,
      credibility: adjustedResult.credibility_score,
      hasPolicyImplications: policyAnalysis.hasPolicyImplications
    });

    return adjustedResult;
  }

  /**
   * Analyze claim for policy and rights implications
   */
  analyzePolicyImplications(claim) {
    const claimLower = claim.toLowerCase();
    
    // Policy-related keywords
    const policyKeywords = [
      'government', 'policy', 'law', 'court', 'supreme court',
      'parliament', 'minister', 'ministry', 'bill', 'act',
      'regulation', 'constitutional', 'rights'
    ];

    // Social issues keywords
    const socialKeywords = [
      'protest', 'arrest', 'detention', 'violence', 'discrimination',
      'caste', 'minority', 'women', 'dalit', 'tribal', 'farmer',
      'student', 'journalist', 'activist'
    ];

    const hasPolicyKeywords = policyKeywords.some(k => claimLower.includes(k));
    const hasSocialKeywords = socialKeywords.some(k => claimLower.includes(k));

    return {
      hasPolicyImplications: hasPolicyKeywords,
      hasSocialImplications: hasSocialKeywords,
      requiresDeepAnalysis: hasPolicyKeywords && hasSocialKeywords,
      sensitivityLevel: this.calculateSensitivity(hasPolicyKeywords, hasSocialKeywords)
    };
  }

  /**
   * Calculate topic sensitivity level
   */
  calculateSensitivity(hasPolicyKeywords, hasSocialKeywords) {
    if (hasPolicyKeywords && hasSocialKeywords) return 'high';
    if (hasPolicyKeywords || hasSocialKeywords) return 'medium';
    return 'low';
  }

  /**
   * Score evidence with investigative journalism perspective
   */
  scoreEvidence(evidence, policyAnalysis) {
    return evidence.map(e => {
      let adjustedScore = e.domainReputationScore || 50;

      const domain = this.extractDomain(e.url);

      // Trusted news sources
      if (this.trustedSources.some(ts => domain.includes(ts))) {
        adjustedScore += 15;
      }

      // Academic sources highly valued for policy claims
      if (policyAnalysis.hasPolicyImplications) {
        if (this.academicSources.some(as => domain.includes(as))) {
          adjustedScore += 25;
        }
      }

      // International sources valued for cross-checking
      const internationalSources = ['bbc.com', 'nytimes.com', 'theguardian.com', 'reuters.com'];
      if (internationalSources.some(is => domain.includes(is))) {
        adjustedScore += 10;
      }

      // Government sources viewed with healthy skepticism for policy claims
      if (policyAnalysis.hasPolicyImplications && (domain.endsWith('.gov.in') || domain.endsWith('.gov'))) {
        // Still valuable but not automatically trusted
        adjustedScore += 5;
      }

      return {
        ...e,
        domainReputationScore: Math.max(0, Math.min(100, adjustedScore))
      };
    });
  }

  /**
   * Apply investigative journalism adjustments
   */
  applyInvestigativeAdjustments(result, policyAnalysis, evidence) {
    // For sensitive topics, require more evidence
    if (policyAnalysis.sensitivityLevel === 'high') {
      // Check if we have diverse sources
      const domains = new Set(evidence.map(e => this.extractDomain(e.url)));
      const uniqueDomainCount = domains.size;

      if (uniqueDomainCount < 3 && result.verdict === 'true') {
        result.confidence = Math.max(result.confidence - 0.2, 0.3);
        result.concerns = result.concerns || [];
        result.concerns.push('Sensitive topic with limited independent verification');
      }

      // Look for investigative/long-form sources
      const hasInvestigative = evidence.some(e => {
        const snippet = (e.snippet || '').toLowerCase();
        return snippet.includes('investigation') || 
               snippet.includes('according to documents') ||
               snippet.includes('sources say');
      });

      if (hasInvestigative) {
        result.key_findings = result.key_findings || [];
        result.key_findings.push('Investigative reporting found on this topic');
      }
    }

    // Add policy analysis context
    if (policyAnalysis.hasPolicyImplications) {
      result.key_findings = result.key_findings || [];
      result.key_findings.push(`Topic involves policy/governance (sensitivity: ${policyAnalysis.sensitivityLevel})`);
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
      trustedSources: this.trustedSources,
      academicSources: this.academicSources
    };
  }
}

// Export singleton instance
module.exports = new NDTVAgent();

