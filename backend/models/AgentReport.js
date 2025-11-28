/**
 * AgentReport Model
 * 
 * Stores individual agent verification reports.
 */

const mongoose = require('mongoose');

const AgentReportSchema = new mongoose.Schema({
  // Reference to the source graph
  sourceGraphId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SourceGraph',
    index: true
  },

  // Agent identification
  agentName: {
    type: String,
    required: true,
    index: true
  },

  agentType: {
    type: String,
    enum: ['toi', 'indiaTimes', 'ndtv', 'generic'],
    required: true
  },

  // Verification results
  credibilityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },

  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },

  verdict: {
    type: String,
    enum: ['true', 'false', 'mixed', 'unknown'],
    required: true
  },

  // Analysis content
  summary: {
    type: String,
    required: true
  },

  detailedReasoning: {
    type: String
  },

  // Evidence used
  evidenceLinks: [{
    type: String
  }],

  keyFindings: [{
    type: String
  }],

  concerns: [{
    type: String
  }],

  // Agent metadata at time of verification
  agentMetadata: {
    biasProfile: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    reputation: {
      type: Number,
      min: 0,
      max: 100
    }
  },

  // Processing information
  processing: {
    startTime: { type: Date },
    endTime: { type: Date },
    durationMs: { type: Number },
    error: { type: String }
  },

  // Agreement with final verdict
  agreedWithFinal: {
    type: Boolean
  }
}, {
  timestamps: true
});

// Indexes
AgentReportSchema.index({ agentType: 1, createdAt: -1 });
AgentReportSchema.index({ verdict: 1 });

// Instance methods
AgentReportSchema.methods.getCompactReport = function() {
  return {
    agent_name: this.agentName,
    credibility_score: this.credibilityScore,
    summary: this.summary,
    evidence_links: this.evidenceLinks,
    reasoning: this.detailedReasoning
  };
};

// Static methods
AgentReportSchema.statics.getAgentStats = function(agentType) {
  return this.aggregate([
    { $match: { agentType } },
    {
      $group: {
        _id: '$agentType',
        totalReports: { $sum: 1 },
        avgCredibility: { $avg: '$credibilityScore' },
        avgConfidence: { $avg: '$confidence' },
        trueCount: { $sum: { $cond: [{ $eq: ['$verdict', 'true'] }, 1, 0] } },
        falseCount: { $sum: { $cond: [{ $eq: ['$verdict', 'false'] }, 1, 0] } },
        mixedCount: { $sum: { $cond: [{ $eq: ['$verdict', 'mixed'] }, 1, 0] } },
        unknownCount: { $sum: { $cond: [{ $eq: ['$verdict', 'unknown'] }, 1, 0] } },
        agreementRate: { 
          $avg: { $cond: [{ $eq: ['$agreedWithFinal', true] }, 1, 0] }
        }
      }
    }
  ]);
};

AgentReportSchema.statics.getRecentByAgent = function(agentType, limit = 10) {
  return this.find({ agentType })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('agentName verdict credibilityScore summary createdAt');
};

module.exports = mongoose.model('AgentReport', AgentReportSchema);

