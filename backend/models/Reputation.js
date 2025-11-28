/**
 * Reputation Model
 * 
 * Stores and tracks agent reputation scores over time.
 */

const mongoose = require('mongoose');

const ReputationHistorySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  oldScore: { type: Number },
  newScore: { type: Number },
  change: { type: Number },
  reason: { type: String },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { _id: false });

const ReputationSchema = new mongoose.Schema({
  // Agent identification
  agentName: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  agentType: {
    type: String,
    enum: ['toi', 'indiaTimes', 'ndtv', 'generic'],
    required: true
  },

  // Current reputation score (0-100)
  currentScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50,
    required: true
  },

  // Statistics
  stats: {
    totalVerifications: { type: Number, default: 0 },
    correctPredictions: { type: Number, default: 0 },
    incorrectPredictions: { type: Number, default: 0 },
    agreementWithConsensus: { type: Number, default: 0 },
    disagreementWithConsensus: { type: Number, default: 0 },
    avgCredibilityScore: { type: Number, default: 50 },
    avgConfidence: { type: Number, default: 0.5 }
  },

  // Reputation history (last 100 changes)
  history: {
    type: [ReputationHistorySchema],
    default: []
  },

  // Time-based decay tracking
  decay: {
    lastDecayApplied: { type: Date, default: Date.now },
    decayRate: { type: Number, default: 0.01 }, // 1% decay per period
    decayPeriodDays: { type: Number, default: 7 }
  },

  // Metadata
  metadata: {
    firstVerification: { type: Date },
    lastVerification: { type: Date },
    peakScore: { type: Number, default: 50 },
    lowestScore: { type: Number, default: 50 }
  }
}, {
  timestamps: true
});

// Instance methods
ReputationSchema.methods.updateScore = function(change, reason, metadata = {}) {
  const oldScore = this.currentScore;
  this.currentScore = Math.max(0, Math.min(100, this.currentScore + change));
  
  // Update peak/lowest
  if (this.currentScore > this.metadata.peakScore) {
    this.metadata.peakScore = this.currentScore;
  }
  if (this.currentScore < this.metadata.lowestScore) {
    this.metadata.lowestScore = this.currentScore;
  }

  // Add to history (keep last 100)
  this.history.push({
    timestamp: new Date(),
    oldScore,
    newScore: this.currentScore,
    change,
    reason,
    metadata
  });

  if (this.history.length > 100) {
    this.history = this.history.slice(-100);
  }

  this.metadata.lastVerification = new Date();

  return this.save();
};

ReputationSchema.methods.recordVerification = function(agreed, confidence = 0.5) {
  this.stats.totalVerifications += 1;
  
  if (agreed) {
    this.stats.correctPredictions += 1;
    this.stats.agreementWithConsensus += 1;
  } else {
    this.stats.incorrectPredictions += 1;
    this.stats.disagreementWithConsensus += 1;
  }

  // Update rolling averages
  const total = this.stats.totalVerifications;
  this.stats.avgConfidence = ((this.stats.avgConfidence * (total - 1)) + confidence) / total;
};

ReputationSchema.methods.applyDecay = function() {
  const now = new Date();
  const lastDecay = this.decay.lastDecayApplied;
  const daysSinceDecay = (now - lastDecay) / (1000 * 60 * 60 * 24);

  if (daysSinceDecay >= this.decay.decayPeriodDays) {
    const periodsElapsed = Math.floor(daysSinceDecay / this.decay.decayPeriodDays);
    const decayFactor = Math.pow(1 - this.decay.decayRate, periodsElapsed);
    
    // Decay towards neutral (50)
    const deviation = this.currentScore - 50;
    const decayedDeviation = deviation * decayFactor;
    const decayedScore = 50 + decayedDeviation;

    this.updateScore(
      decayedScore - this.currentScore,
      `Time decay (${periodsElapsed} periods)`,
      { periodsElapsed, decayFactor }
    );

    this.decay.lastDecayApplied = now;
  }

  return this;
};

ReputationSchema.methods.getAccuracyRate = function() {
  if (this.stats.totalVerifications === 0) return 0;
  return this.stats.correctPredictions / this.stats.totalVerifications;
};

// Static methods
ReputationSchema.statics.getOrCreate = async function(agentName, agentType) {
  let reputation = await this.findOne({ agentName });
  
  if (!reputation) {
    reputation = new this({
      agentName,
      agentType,
      currentScore: 50,
      metadata: {
        firstVerification: new Date()
      }
    });
    await reputation.save();
  }

  return reputation;
};

ReputationSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find()
    .sort({ currentScore: -1 })
    .limit(limit)
    .select('agentName agentType currentScore stats.totalVerifications stats.correctPredictions');
};

ReputationSchema.statics.getAllReputations = function() {
  return this.find()
    .select('agentName agentType currentScore stats');
};

module.exports = mongoose.model('Reputation', ReputationSchema);

