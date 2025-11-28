/**
 * Seed Data Script for SatyaTrail Backend
 * 
 * Populates MongoDB with sample news verification data.
 * Run with: node scripts/seed-data.js
 * 
 * Options:
 *   --clear    Clear existing data before seeding
 *   --count=N  Number of verifications to create (default: 20)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

const SourceGraph = require('../models/SourceGraph');
const AgentReport = require('../models/AgentReport');
const Reputation = require('../models/Reputation');

// Parse command line arguments
const args = process.argv.slice(2);
const shouldClear = args.includes('--clear');
const countArg = args.find(arg => arg.startsWith('--count='));
const count = countArg ? parseInt(countArg.split('=')[1]) : 20;

// Sample news claims for seeding
const SAMPLE_CLAIMS = [
  {
    claim: "India's GDP growth rate reached 7.2% in the last quarter, according to official government data.",
    verdict: 'true',
    accuracyScore: 85,
    sources: [
      { domain: 'economictimes.indiatimes.com', title: 'India GDP Growth Hits 7.2%', role: 'origin' },
      { domain: 'reuters.com', title: 'India Economy Grows 7.2%', role: 'amplifier' },
      { domain: 'thehindu.com', title: 'Strong GDP Growth Reported', role: 'modifier' }
    ]
  },
  {
    claim: "A viral social media post claims that a new COVID-19 variant is spreading rapidly in India.",
    verdict: 'false',
    accuracyScore: 92,
    sources: [
      { domain: 'twitter.com', title: 'Viral Post About New Variant', role: 'origin' },
      { domain: 'altnews.in', title: 'Fact Check: False Claim About COVID Variant', role: 'debunker' },
      { domain: 'boomlive.in', title: 'Misinformation Alert: COVID Variant Claim', role: 'debunker' }
    ]
  },
  {
    claim: "The Indian government announced new policies for renewable energy investment.",
    verdict: 'true',
    accuracyScore: 88,
    sources: [
      { domain: 'pib.gov.in', title: 'Government Announces Renewable Energy Policy', role: 'origin' },
      { domain: 'ndtv.com', title: 'New Renewable Energy Investment Policy', role: 'amplifier' },
      { domain: 'timesofindia.indiatimes.com', title: 'Govt Unveils Green Energy Plan', role: 'modifier' }
    ]
  },
  {
    claim: "A celebrity was arrested for tax evasion, according to unverified sources.",
    verdict: 'mixed',
    accuracyScore: 65,
    sources: [
      { domain: 'indiatoday.in', title: 'Celebrity Tax Case Under Investigation', role: 'origin' },
      { domain: 'news18.com', title: 'Tax Evasion Claims Surface', role: 'amplifier' },
      { domain: 'thequint.com', title: 'Fact Check: Celebrity Arrest Claims Unverified', role: 'debunker' }
    ]
  },
  {
    claim: "Scientists discovered a new species in the Western Ghats.",
    verdict: 'true',
    accuracyScore: 90,
    sources: [
      { domain: 'thehindu.com', title: 'New Species Discovered in Western Ghats', role: 'origin' },
      { domain: 'bbc.com', title: 'Rare Species Found in India', role: 'amplifier' },
      { domain: 'ndtv.com', title: 'Biodiversity Discovery in Western Ghats', role: 'modifier' }
    ]
  },
  {
    claim: "A viral WhatsApp message claims that a new law will ban all social media platforms.",
    verdict: 'false',
    accuracyScore: 95,
    sources: [
      { domain: 'whatsapp.com', title: 'Viral Message About Social Media Ban', role: 'origin' },
      { domain: 'factcheck.org', title: 'False: No Social Media Ban Law', role: 'debunker' },
      { domain: 'vishvasnews.com', title: 'Misinformation: Social Media Ban Claim Debunked', role: 'debunker' }
    ]
  },
  {
    claim: "The Reserve Bank of India announced changes to interest rates.",
    verdict: 'true',
    accuracyScore: 87,
    sources: [
      { domain: 'rbi.org.in', title: 'RBI Monetary Policy Update', role: 'origin' },
      { domain: 'livemint.com', title: 'RBI Changes Interest Rates', role: 'amplifier' },
      { domain: 'moneycontrol.com', title: 'Central Bank Rate Decision', role: 'modifier' }
    ]
  },
  {
    claim: "A viral video shows alleged election fraud during recent polls.",
    verdict: 'mixed',
    accuracyScore: 70,
    sources: [
      { domain: 'youtube.com', title: 'Viral Video About Election Fraud', role: 'origin' },
      { domain: 'altnews.in', title: 'Fact Check: Election Video Needs Context', role: 'debunker' },
      { domain: 'theprint.in', title: 'Election Video Under Investigation', role: 'modifier' }
    ]
  },
  {
    claim: "India successfully launched a new satellite into orbit.",
    verdict: 'true',
    accuracyScore: 93,
    sources: [
      { domain: 'isro.gov.in', title: 'ISRO Satellite Launch Successful', role: 'origin' },
      { domain: 'reuters.com', title: 'India Launches New Satellite', role: 'amplifier' },
      { domain: 'timesofindia.indiatimes.com', title: 'ISRO Mission Success', role: 'modifier' }
    ]
  },
  {
    claim: "A viral post claims that a new medicine can cure all diseases.",
    verdict: 'false',
    accuracyScore: 98,
    sources: [
      { domain: 'facebook.com', title: 'Viral Post About Miracle Cure', role: 'origin' },
      { domain: 'snopes.com', title: 'False: No Universal Cure Exists', role: 'debunker' },
      { domain: 'factly.in', title: 'Medical Misinformation Alert', role: 'debunker' }
    ]
  }
];

// Agent configurations
const AGENTS = [
  { name: 'Times of India Agent', type: 'toi' },
  { name: 'NDTV Agent', type: 'ndtv' },
  { name: 'India Times Agent', type: 'indiaTimes' },
  { name: 'Generic Verification Agent', type: 'generic' }
];

// Request sources
const SOURCES = ['frontend', 'telegram', 'twitter', 'extension'];

/**
 * Generate a deterministic hash from content
 */
function generateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generate a mock blockchain transaction hash
 */
function generateBlockchainHash() {
  return '0x' + crypto.randomBytes(20).toString('hex');
}

/**
 * Create nodes from sources
 */
function createNodes(sources, baseTime) {
  return sources.map((source, index) => {
    const timestamp = new Date(baseTime.getTime() + index * 60000); // 1 min apart
    return {
      id: `node_${index}`,
      url: `https://${source.domain}/article-${index}`,
      title: source.title,
      snippet: `This article discusses ${source.title.toLowerCase()}. It provides detailed information about the topic.`,
      timestamp: timestamp,
      domainReputation: source.domain.includes('gov') ? 95 :
                        source.domain.includes('edu') ? 85 :
                        ['reuters.com', 'bbc.com', 'thehindu.com'].some(d => source.domain.includes(d)) ? 90 :
                        ['twitter.com', 'facebook.com', 'whatsapp.com'].some(d => source.domain.includes(d)) ? 30 :
                        ['altnews.in', 'boomlive.in', 'factcheck.org'].some(d => source.domain.includes(d)) ? 95 : 70,
      role: source.role,
      author: `Author ${index + 1}`,
      domain: source.domain
    };
  });
}

/**
 * Create edges between nodes
 */
function createEdges(nodes) {
  const edges = [];
  const originNode = nodes.find(n => n.role === 'origin') || nodes[0];
  
  for (let i = 1; i < nodes.length; i++) {
    const fromNode = nodes[i - 1];
    const toNode = nodes[i];
    
    let relationship = 'amplifies';
    if (toNode.role === 'debunker') {
      relationship = 'contradicts';
    } else if (toNode.role === 'modifier') {
      relationship = 'quotes';
    }
    
    edges.push({
      id: `edge_${i - 1}`,
      from: fromNode.id,
      to: toNode.id,
      relationship: relationship,
      timestamp: toNode.timestamp,
      evidence: `Temporal sequence: ${fromNode.title} -> ${toNode.title}`,
      aiDetected: false
    });
    
    // If debunker, also connect to origin
    if (toNode.role === 'debunker' && fromNode.id !== originNode.id) {
      edges.push({
        id: `edge_origin_${i}`,
        from: originNode.id,
        to: toNode.id,
        relationship: 'contradicts',
        timestamp: toNode.timestamp,
        evidence: 'Debunker addresses original claim',
        aiDetected: true
      });
    }
  }
  
  return edges;
}

/**
 * Generate agent reports
 */
function generateAgentReports(claim, verdict, agents) {
  return agents.map(agent => {
    // Agents may agree or disagree with final verdict
    const agrees = Math.random() > 0.2; // 80% agreement rate
    const agentVerdict = agrees ? verdict : 
                         ['true', 'false', 'mixed', 'unknown'].find(v => v !== verdict) || 'unknown';
    
    const credibilityScore = 60 + Math.floor(Math.random() * 35);
    const confidence = 0.5 + Math.random() * 0.4;
    
    return {
      agentName: agent.name,
      agentType: agent.type,
      credibilityScore,
      confidence,
      verdict: agentVerdict,
      summary: `${agent.name} analysis: The claim "${claim.substring(0, 50)}..." appears to be ${agentVerdict === 'true' ? 'accurate' : agentVerdict === 'false' ? 'inaccurate' : 'partially accurate'}.`,
      detailedReasoning: `After thorough analysis of available evidence, ${agent.name} determined that this claim is ${agentVerdict}. Multiple sources were cross-referenced and verified.`,
      evidenceLinks: [
        `https://example.com/evidence1`,
        `https://example.com/evidence2`,
        `https://example.com/evidence3`
      ],
      keyFindings: [
        'Primary sources verified',
        'Multiple independent confirmations found',
        'Expert opinions consulted'
      ],
      concerns: agentVerdict === 'unknown' ? ['Limited evidence available'] : [],
      agreedWithFinal: agrees
    };
  });
}

/**
 * Clear existing data
 */
async function clearData() {
  console.log('🗑️  Clearing existing data...');
  await SourceGraph.deleteMany({});
  await AgentReport.deleteMany({});
  await Reputation.deleteMany({});
  console.log('✅ Data cleared');
}

/**
 * Seed reputation data
 */
async function seedReputations() {
  console.log('👥 Seeding agent reputations...');
  
  for (const agent of AGENTS) {
    const reputation = await Reputation.getOrCreate(agent.name, agent.type);
    
    // Set initial reputation scores
    const scores = {
      'toi': 75,
      'ndtv': 78,
      'indiaTimes': 72,
      'generic': 80
    };
    
    reputation.currentScore = scores[agent.type] || 70;
    reputation.stats.totalVerifications = Math.floor(Math.random() * 50) + 20;
    reputation.stats.correctPredictions = Math.floor(reputation.stats.totalVerifications * 0.75);
    reputation.stats.incorrectPredictions = reputation.stats.totalVerifications - reputation.stats.correctPredictions;
    reputation.stats.agreementWithConsensus = Math.floor(reputation.stats.totalVerifications * 0.80);
    reputation.stats.disagreementWithConsensus = reputation.stats.totalVerifications - reputation.stats.agreementWithConsensus;
    reputation.stats.avgCredibilityScore = 70 + Math.floor(Math.random() * 20);
    reputation.stats.avgConfidence = 0.6 + Math.random() * 0.3;
    reputation.metadata.firstVerification = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    reputation.metadata.lastVerification = new Date();
    reputation.metadata.peakScore = reputation.currentScore + 5;
    reputation.metadata.lowestScore = reputation.currentScore - 5;
    
    await reputation.save();
  }
  
  console.log(`✅ Seeded ${AGENTS.length} agent reputations`);
}

/**
 * Seed verification data
 */
async function seedVerifications() {
  console.log(`📰 Seeding ${count} verifications...`);
  
  const verifications = [];
  const baseTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  
  for (let i = 0; i < count; i++) {
    const template = SAMPLE_CLAIMS[i % SAMPLE_CLAIMS.length];
    const claim = template.claim;
    const verdict = template.verdict;
    const accuracyScore = template.accuracyScore;
    
    // Create nodes and edges
    const nodes = createNodes(template.sources, new Date(baseTime.getTime() + i * 60 * 60 * 1000));
    const edges = createEdges(nodes);
    
    // Generate unique hash (include index and timestamp for uniqueness)
    const hash = generateHash(claim + JSON.stringify(nodes.map(n => n.id).sort()) + i + Date.now() + Math.random());
    
    // Create source graph
    const sourceGraph = new SourceGraph({
      hash,
      claim,
      nodes,
      edges,
      clusters: [],
      metadata: {
        createdAt: new Date(baseTime.getTime() + i * 60 * 60 * 1000),
        sourceCount: template.sources.length,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        clusterCount: 0,
        aiEnhanced: true
      },
      blockchain: {
        provider: 'polygon',
        transactionHash: generateBlockchainHash(),
        blockNumber: 1000000 + i,
        storedAt: new Date(baseTime.getTime() + i * 60 * 60 * 1000)
      },
      verification: {
        verdict,
        accuracyScore,
        confidence: 0.7 + Math.random() * 0.25
      },
      request: {
        source: SOURCES[i % SOURCES.length],
        originalUrl: nodes[0].url,
        processingTimeMs: 1500 + Math.floor(Math.random() * 2000)
      }
    });
    
    await sourceGraph.save();
    
    // Create agent reports
    const agentReportsData = generateAgentReports(claim, verdict, AGENTS);
    const agentReports = [];
    
    for (const reportData of agentReportsData) {
      const agentReport = new AgentReport({
        sourceGraphId: sourceGraph._id,
        ...reportData
      });
      await agentReport.save();
      agentReports.push(agentReport._id);
    }
    
    // Update source graph with agent report references
    sourceGraph.verification.agentReports = agentReports;
    await sourceGraph.save();
    
    verifications.push(sourceGraph);
    
    if ((i + 1) % 5 === 0) {
      console.log(`  ✓ Created ${i + 1}/${count} verifications`);
    }
  }
  
  console.log(`✅ Seeded ${verifications.length} verifications with ${verifications.length * AGENTS.length} agent reports`);
  return verifications;
}

/**
 * Main seed function
 */
async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Connect to database
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    await mongoose.connect(process.env.DATABASE_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB\n');
    
    // Clear data if requested
    if (shouldClear) {
      await clearData();
      console.log('');
    }
    
    // Seed data
    await seedReputations();
    console.log('');
    await seedVerifications();
    
    console.log('\n✨ Seeding completed successfully!');
    
    // Print summary
    const graphCount = await SourceGraph.countDocuments();
    const reportCount = await AgentReport.countDocuments();
    const reputationCount = await Reputation.countDocuments();
    
    console.log('\n📊 Database Summary:');
    console.log(`   Source Graphs: ${graphCount}`);
    console.log(`   Agent Reports: ${reportCount}`);
    console.log(`   Reputations: ${reputationCount}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run seed
seed();

