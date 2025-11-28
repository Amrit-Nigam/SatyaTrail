/**
 * Reputation System
 * 
 * Manages agent reputation scores using an ELO-inspired algorithm.
 * Reputation decays over time and grows based on agreement with ground evidence.
 * 
 * REPUTATION FORMULA:
 * 
 * new_score = old_score + K * (actual - expected) * confidence_weight
 * 
 * Where:
 * - K = 32 (base adjustment factor)
 * - actual = 1 if agreed with final verdict, 0 if disagreed
 * - expected = old_score / 100 (probability agent is correct)
 * - confidence_weight = agent's confidence (0-1)
 * 
 * Time decay:
 * - Scores decay towards 50 (neutral) over time
 * - Decay rate: 1% per week of inactivity
 */

const logger = require('./logger');
const Reputation = require('../models/Reputation');

// Configuration
const CONFIG = {
  K_FACTOR: 32, // Base adjustment factor
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  NEUTRAL_SCORE: 50,
  DECAY_RATE: 0.01, // 1% decay per period
  DECAY_PERIOD_DAYS: 7,
  
  // Bonus/penalty multipliers
  HIGH_CONFIDENCE_BONUS: 1.5, // Bonus for high confidence correct predictions
  LOW_CONFIDENCE_PENALTY: 0.5, // Reduced penalty for low confidence wrong predictions
  CONSECUTIVE_BONUS: 1.2, // Bonus for consecutive correct predictions
  
  // Confidence thresholds
  HIGH_CONFIDENCE_THRESHOLD: 0.8,
  LOW_CONFIDENCE_THRESHOLD: 0.3
};

class ReputationSystem {
  constructor() {
    this.cache = new Map(); // In-memory cache for performance
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get current reputation score for an agent
   * @param {string} agentName - Name of the agent
   * @returns {Promise<number>} Reputation score (0-100)
   */
  async getReputation(agentName) {
    // Check cache
    const cached = this.cache.get(agentName);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.score;
    }

    try {
      const reputation = await Reputation.findOne({ agentName });
      
      if (!reputation) {
        // New agent starts at neutral
        const newRep = await this.initializeAgent(agentName);
        return newRep.currentScore;
      }

      // Apply time decay if needed
      await reputation.applyDecay();
      
      // Update cache
      this.cache.set(agentName, {
        score: reputation.currentScore,
        timestamp: Date.now()
      });

      return reputation.currentScore;
    } catch (error) {
      logger.error('Failed to get reputation', { agentName, error: error.message });
      return CONFIG.NEUTRAL_SCORE; // Default to neutral on error
    }
  }

  /**
   * Initialize a new agent with neutral reputation
   * @param {string} agentName - Name of the agent
   * @returns {Promise<Object>} New reputation record
   */
  async initializeAgent(agentName) {
    // Determine agent type from name
    const agentType = this.inferAgentType(agentName);

    const reputation = new Reputation({
      agentName,
      agentType,
      currentScore: CONFIG.NEUTRAL_SCORE,
      metadata: {
        firstVerification: new Date()
      }
    });

    await reputation.save();
    
    logger.info('Initialized new agent reputation', { agentName, agentType });
    
    return reputation;
  }

  /**
   * Infer agent type from name
   */
  inferAgentType(agentName) {
    const nameLower = agentName.toLowerCase();
    if (nameLower.includes('toi') || nameLower.includes('times of india')) return 'toi';
    if (nameLower.includes('indiatimes') || nameLower.includes('india times')) return 'indiaTimes';
    if (nameLower.includes('ndtv')) return 'ndtv';
    return 'generic';
  }

  /**
   * Update agent reputation after a verification
   * @param {string} agentName - Name of the agent
   * @param {boolean} agreed - Did agent agree with final verdict
   * @param {number} confidence - Agent's confidence (0-1)
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Updated reputation
   */
  async updateReputation(agentName, agreed, confidence = 0.5, metadata = {}) {
    try {
      let reputation = await Reputation.findOne({ agentName });
      
      if (!reputation) {
        reputation = await this.initializeAgent(agentName);
      }

      const oldScore = reputation.currentScore;
      
      // Calculate expected outcome based on current reputation
      const expected = oldScore / 100;
      
      // Actual outcome (1 for correct, 0 for wrong)
      const actual = agreed ? 1 : 0;
      
      // Calculate base adjustment
      let adjustment = CONFIG.K_FACTOR * (actual - expected);
      
      // Apply confidence weight
      let confidenceWeight = confidence;
      
      // Bonus for high confidence correct predictions
      if (agreed && confidence >= CONFIG.HIGH_CONFIDENCE_THRESHOLD) {
        confidenceWeight *= CONFIG.HIGH_CONFIDENCE_BONUS;
      }
      
      // Reduced penalty for low confidence wrong predictions
      if (!agreed && confidence <= CONFIG.LOW_CONFIDENCE_THRESHOLD) {
        confidenceWeight *= CONFIG.LOW_CONFIDENCE_PENALTY;
      }
      
      adjustment *= confidenceWeight;
      
      // Apply the adjustment
      const newScore = Math.max(
        CONFIG.MIN_SCORE,
        Math.min(CONFIG.MAX_SCORE, oldScore + adjustment)
      );
      
      // Update reputation record
      await reputation.updateScore(
        newScore - oldScore,
        agreed ? 'Agreed with final verdict' : 'Disagreed with final verdict',
        {
          agreed,
          confidence,
          adjustment,
          ...metadata
        }
      );

      reputation.recordVerification(agreed, confidence);
      await reputation.save();
      
      // Clear cache
      this.cache.delete(agentName);
      
      logger.info('Updated agent reputation', {
        agentName,
        oldScore,
        newScore,
        adjustment,
        agreed,
        confidence
      });

      return {
        agentName,
        oldScore,
        newScore,
        change: newScore - oldScore,
        agreed
      };
    } catch (error) {
      logger.error('Failed to update reputation', { agentName, error: error.message });
      throw error;
    }
  }

  /**
   * Get all agent reputations
   * @returns {Promise<Object>} Map of agent names to scores
   */
  async getAllReputations() {
    try {
      const reputations = await Reputation.getAllReputations();
      const result = {};
      
      for (const rep of reputations) {
        result[rep.agentName] = {
          score: rep.currentScore,
          stats: rep.stats
        };
      }
      
      return result;
    } catch (error) {
      logger.error('Failed to get all reputations', { error: error.message });
      return {};
    }
  }

  /**
   * Get reputation leaderboard
   * @param {number} limit - Number of agents to return
   * @returns {Promise<Array>} Sorted list of agents
   */
  async getLeaderboard(limit = 10) {
    try {
      return await Reputation.getLeaderboard(limit);
    } catch (error) {
      logger.error('Failed to get leaderboard', { error: error.message });
      return [];
    }
  }

  /**
   * Calculate weighted score for aggregation
   * @param {number} credibilityScore - Agent's credibility score for this verification
   * @param {number} reputation - Agent's reputation
   * @returns {number} Weighted score
   */
  calculateWeightedScore(credibilityScore, reputation) {
    // Weight is based on reputation (0.5 to 1.5 multiplier)
    const weight = 0.5 + (reputation / 100);
    return credibilityScore * weight;
  }

  /**
   * Get reputation insight for an agent
   * @param {string} agentName - Agent name
   * @returns {Promise<Object>} Detailed reputation info
   */
  async getReputationInsight(agentName) {
    try {
      const reputation = await Reputation.findOne({ agentName });
      
      if (!reputation) {
        return {
          agentName,
          exists: false,
          currentScore: CONFIG.NEUTRAL_SCORE
        };
      }

      return {
        agentName,
        exists: true,
        currentScore: reputation.currentScore,
        stats: reputation.stats,
        accuracyRate: reputation.getAccuracyRate(),
        peakScore: reputation.metadata.peakScore,
        lowestScore: reputation.metadata.lowestScore,
        recentHistory: reputation.history.slice(-10)
      };
    } catch (error) {
      logger.error('Failed to get reputation insight', { agentName, error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ReputationSystem();

