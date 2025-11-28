/**
 * SourceGraph Model
 * 
 * MongoDB schema for storing source graphs off-chain.
 * The graph hash is stored on-chain for immutability.
 */

const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  url: { type: String, required: true },
  title: { type: String },
  snippet: { type: String },
  timestamp: { type: Date },
  domainReputation: { type: Number, min: 0, max: 100 },
  role: { 
    type: String, 
    enum: ['origin', 'amplifier', 'modifier', 'debunker', 'unknown'],
    default: 'unknown'
  },
  author: { type: String },
  domain: { type: String }
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  relationship: { 
    type: String, 
    enum: ['cites', 'quotes', 'contradicts', 'amplifies', 'updates'],
    required: true
  },
  timestamp: { type: Date },
  evidence: { type: String },
  aiDetected: { type: Boolean, default: false }
}, { _id: false });

const SourceGraphSchema = new mongoose.Schema({
  // Unique hash of the canonical graph (also stored on-chain)
  hash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // The claim being verified
  claim: {
    type: String,
    required: true
  },

  // Graph structure
  nodes: [NodeSchema],
  edges: [EdgeSchema],

  // Clusters of similar content
  clusters: [[String]],

  // Verification metadata
  metadata: {
    createdAt: { type: Date, default: Date.now },
    sourceCount: { type: Number },
    nodeCount: { type: Number },
    edgeCount: { type: Number },
    clusterCount: { type: Number },
    aiEnhanced: { type: Boolean, default: false }
  },

  // Blockchain reference
  blockchain: {
    provider: { type: String },
    transactionHash: { type: String },
    blockNumber: { type: Number },
    storedAt: { type: Date }
  },

  // Verification result
  verification: {
    verdict: { 
      type: String, 
      enum: ['true', 'false', 'mixed', 'unknown'],
      required: true
    },
    accuracyScore: { type: Number, min: 0, max: 100 },
    confidence: { type: Number, min: 0, max: 1 },
    agentReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AgentReport' }]
  },

  // Request metadata
  request: {
    source: { 
      type: String, 
      enum: ['frontend', 'telegram', 'twitter', 'extension'],
      default: 'frontend'
    },
    originalUrl: { type: String },
    processingTimeMs: { type: Number }
  }
}, {
  timestamps: true
});

// Indexes for common queries
SourceGraphSchema.index({ 'verification.verdict': 1 });
SourceGraphSchema.index({ 'request.source': 1 });
SourceGraphSchema.index({ createdAt: -1 });
SourceGraphSchema.index({ 'blockchain.transactionHash': 1 });

// Instance methods
SourceGraphSchema.methods.getSummary = function() {
  return {
    hash: this.hash,
    claim: this.claim.substring(0, 100),
    verdict: this.verification?.verdict,
    accuracy: this.verification?.accuracyScore,
    nodeCount: this.nodes?.length,
    edgeCount: this.edges?.length,
    blockchainHash: this.blockchain?.transactionHash,
    createdAt: this.createdAt
  };
};

// Static methods
SourceGraphSchema.statics.findByHash = function(hash) {
  return this.findOne({ hash });
};

SourceGraphSchema.statics.findByBlockchainTx = function(txHash) {
  return this.findOne({ 'blockchain.transactionHash': txHash });
};

SourceGraphSchema.statics.getRecentVerifications = function(limit = 10) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('hash claim verification.verdict verification.accuracyScore createdAt');
};

SourceGraphSchema.statics.getStatsBySource = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$request.source',
        count: { $sum: 1 },
        avgAccuracy: { $avg: '$verification.accuracyScore' }
      }
    }
  ]);
};

module.exports = mongoose.model('SourceGraph', SourceGraphSchema);

