const express = require('express');
const Reputation = require('../models/Reputation');
const reputationSystem = require('../utils/reputationSystem');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Normalize a credibility score that might be 0-1 or 0-100 into 0-100.
 */
function normalizeCredScore(score) {
  if (score == null || Number.isNaN(score)) return 50;
  const num = Number(score);
  if (num <= 1) return Math.round(num * 100);
  return Math.round(Math.min(100, Math.max(0, num)));
}

/**
 * Map a Reputation document to a clean leaderboard item.
 */
function mapReputationToLeaderboardItem(rep, index = 0) {
  const total = rep.stats?.totalVerifications || 0;
  const correct = rep.stats?.correctPredictions || 0;
  const avgCredRaw = rep.stats?.avgCredibilityScore ?? 50;

  const accuracy =
    total > 0 ? Math.round((correct / total) * 100) : 0;

  return {
    rank: index + 1,
    agentName: rep.agentName,
    agentType: rep.agentType || 'generic',
    reputationScore: normalizeCredScore(rep.currentScore),
    accuracyRate: accuracy,
    totalVerifications: total,
    avgCredibilityScore: normalizeCredScore(avgCredRaw),
  };
}

/**
 * Add a few well-known outlets as mock agents if they don't exist yet.
 * This makes the leaderboard demo more interesting when the DB is empty.
 */
function getMockAgents(existingNames = new Set()) {
  const mocks = [
    {
      agentName: 'The Hindu',
      agentType: 'generic',
      reputationScore: 88,
      accuracyRate: 92,
      totalVerifications: 12,
      avgCredibilityScore: 90,
    },
    {
      agentName: 'Hindustan Times',
      agentType: 'generic',
      reputationScore: 82,
      accuracyRate: 88,
      totalVerifications: 9,
      avgCredibilityScore: 84,
    },
    {
      agentName: 'The Indian Express',
      agentType: 'generic',
      reputationScore: 76,
      accuracyRate: 81,
      totalVerifications: 7,
      avgCredibilityScore: 79,
    },
  ];

  return mocks.filter((m) => !existingNames.has(m.agentName));
}

// GET /api/v1/reputation/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const reps = await Reputation.getLeaderboard(limit);

    const mapped = reps.map((rep, idx) =>
      mapReputationToLeaderboardItem(rep, idx)
    );

    const existingNames = new Set(mapped.map((m) => m.agentName));
    const mocks = getMockAgents(existingNames);

    const full = [...mapped, ...mocks].sort(
      (a, b) => b.reputationScore - a.reputationScore
    );

    const withRanks = full.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    res.json({
      agents: withRanks,
      count: withRanks.length,
    });
  } catch (error) {
    logger.error('Failed to get reputation leaderboard', {
      error: error.message,
    });
    res.status(500).json({
      error: 'Failed to get leaderboard',
      message: error.message,
    });
  }
});

// GET /api/v1/reputation/all
router.get('/all', async (req, res) => {
  try {
    const reps = await Reputation.getAllReputations();
    res.json({
      agents: reps.map((rep) => ({
        agentName: rep.agentName,
        agentType: rep.agentType,
        reputationScore: normalizeCredScore(rep.currentScore),
        stats: rep.stats,
      })),
    });
  } catch (error) {
    logger.error('Failed to get all reputations', {
      error: error.message,
    });
    res.status(500).json({
      error: 'Failed to get reputations',
      message: error.message,
    });
  }
});

// GET /api/v1/reputation/:agentName
router.get('/:agentName', async (req, res) => {
  try {
    const agentName = decodeURIComponent(req.params.agentName);
    const insight = await reputationSystem.getReputationInsight(agentName);
    res.json(insight);
  } catch (error) {
    logger.error('Failed to get reputation insight', {
      agentName: req.params.agentName,
      error: error.message,
    });
    res.status(500).json({
      error: 'Failed to get reputation insight',
      message: error.message,
    });
  }
});

module.exports = router;


