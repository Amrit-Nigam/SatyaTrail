/**
 * Graph Service
 * 
 * Builds and manages source graphs for news verification.
 * Handles graph construction, canonicalization, and hashing.
 */

const crypto = require('crypto');
const stringify = require('json-stable-stringify');
const Fuse = require('fuse.js');
const logger = require('../utils/logger');
const openaiService = require('./openaiService');
const tavilyService = require('./tavilyService');

class GraphService {
  constructor() {
    // Fuzzy matching configuration
    this.fuseOptions = {
      keys: ['title', 'snippet', 'content'],
      threshold: 0.4, // Lower = more strict matching
      includeScore: true
    };
  }

  /**
   * Build a source graph from a claim and evidence
   * @param {string} claim - The claim being verified
   * @param {Array} sources - Array of source objects from Tavily
   * @returns {Promise<Object>} Source graph with nodes and edges
   */
  async buildGraph(claim, sources) {
    logger.info('Building source graph', { claim: claim.substring(0, 100), sourceCount: sources.length });

    // Create initial nodes from sources
    const nodes = sources.map((source, index) => ({
      id: `node_${index}`,
      url: source.url,
      title: source.title,
      snippet: source.snippet,
      timestamp: source.publishDate || new Date().toISOString(),
      domainReputation: source.domainReputationScore || 50,
      role: 'unknown', // Will be determined later
      author: source.author || null,
      domain: this.extractDomain(source.url)
    }));

    // Detect duplicates and clusters
    const clusters = this.detectDuplicateClusters(nodes);

    // Determine node roles based on timestamp and content
    this.assignNodeRoles(nodes);

    // Build edges based on relationships
    const edges = await this.buildEdges(nodes, claim);

    // Use AI to enhance graph analysis if we have enough sources
    let aiAnalysis = null;
    if (sources.length >= 3) {
      try {
        aiAnalysis = await openaiService.analyzeSourceGraph(sources);
        
        // Merge AI analysis with our graph
        if (aiAnalysis.origin_node) {
          const originIdx = nodes.findIndex(n => n.url === aiAnalysis.origin_node || n.id === aiAnalysis.origin_node);
          if (originIdx >= 0) {
            nodes[originIdx].role = 'origin';
          }
        }

        // Add AI-detected edges
        if (aiAnalysis.edges) {
          for (const aiEdge of aiAnalysis.edges) {
            const existingEdge = edges.find(e => e.from === aiEdge.from && e.to === aiEdge.to);
            if (!existingEdge) {
              edges.push({
                id: `edge_ai_${edges.length}`,
                from: aiEdge.from,
                to: aiEdge.to,
                relationship: aiEdge.relationship,
                evidence: aiEdge.evidence,
                aiDetected: true
              });
            }
          }
        }
      } catch (error) {
        logger.warn('AI graph analysis failed, using heuristic analysis', { error: error.message });
      }
    }

    const graph = {
      claim,
      nodes,
      edges,
      clusters,
      metadata: {
        createdAt: new Date().toISOString(),
        sourceCount: sources.length,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        clusterCount: clusters.length,
        aiEnhanced: !!aiAnalysis
      }
    };

    // Calculate and attach hash
    graph.hash = this.hashGraph(graph);

    logger.info('Source graph built', {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      clusterCount: clusters.length,
      hash: graph.hash
    });

    return graph;
  }

  /**
   * Detect clusters of duplicate or near-duplicate content
   * @param {Array} nodes - Array of graph nodes
   * @returns {Array} Array of clusters (each cluster is array of node IDs)
   */
  detectDuplicateClusters(nodes) {
    const clusters = [];
    const clustered = new Set();
    const fuse = new Fuse(nodes, this.fuseOptions);

    for (const node of nodes) {
      if (clustered.has(node.id)) continue;

      // Search for similar nodes
      const searchText = `${node.title} ${node.snippet}`;
      const results = fuse.search(searchText);

      // Filter for high similarity matches
      const clusterMembers = results
        .filter(r => r.score < 0.3 && r.item.id !== node.id) // Very similar
        .map(r => r.item.id);

      if (clusterMembers.length > 0) {
        const cluster = [node.id, ...clusterMembers];
        clusters.push(cluster);
        cluster.forEach(id => clustered.add(id));
      }
    }

    return clusters;
  }

  /**
   * Assign roles to nodes based on timestamps and content
   * @param {Array} nodes - Array of graph nodes (mutated in place)
   */
  assignNodeRoles(nodes) {
    if (nodes.length === 0) return;

    // Sort by timestamp
    const sortedByTime = [...nodes].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    // First node is likely origin
    const originNode = sortedByTime[0];
    originNode.role = 'origin';

    // Classify other nodes
    for (const node of nodes) {
      if (node.role === 'origin') continue;

      const content = `${node.title} ${node.snippet}`.toLowerCase();

      // Check for debunker signals
      if (this.hasDebunkerSignals(content)) {
        node.role = 'debunker';
      }
      // Check for fact-check domain
      else if (this.isFactCheckDomain(node.domain)) {
        node.role = 'debunker';
      }
      // Check for amplifier signals
      else if (this.hasAmplifierSignals(content)) {
        node.role = 'amplifier';
      }
      // Default to modifier (adds new info)
      else {
        node.role = 'modifier';
      }
    }
  }

  /**
   * Check if content contains debunker signals
   */
  hasDebunkerSignals(content) {
    const signals = [
      'fact check', 'false claim', 'misleading', 'debunk',
      'not true', 'misinformation', 'fake news', 'hoax',
      'no evidence', 'unverified', 'conspiracy', 'baseless'
    ];
    return signals.some(signal => content.includes(signal));
  }

  /**
   * Check if domain is a fact-checking organization
   */
  isFactCheckDomain(domain) {
    const factCheckers = [
      'snopes.com', 'factcheck.org', 'politifact.com',
      'altnews.in', 'boomlive.in', 'thequint.com',
      'vishvasnews.com', 'factly.in', 'newschecker.in'
    ];
    return factCheckers.some(fc => domain.includes(fc));
  }

  /**
   * Check if content contains amplifier signals
   */
  hasAmplifierSignals(content) {
    const signals = [
      'breaking', 'viral', 'trending', 'shared',
      'reports say', 'according to', 'sources claim'
    ];
    return signals.some(signal => content.includes(signal));
  }

  /**
   * Build edges between nodes based on relationships
   * @param {Array} nodes - Array of graph nodes
   * @param {string} claim - The original claim
   * @returns {Promise<Array>} Array of edges
   */
  async buildEdges(nodes, claim) {
    const edges = [];
    let edgeId = 0;

    // Find origin node
    const originNode = nodes.find(n => n.role === 'origin');
    if (!originNode) return edges;

    // Connect other nodes to origin or each other based on timestamps
    const sortedNodes = [...nodes].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    for (let i = 1; i < sortedNodes.length; i++) {
      const currentNode = sortedNodes[i];
      
      // Find the most recent node before this one
      const previousNode = sortedNodes[i - 1];

      // Determine relationship type
      let relationship = 'amplifies';
      if (currentNode.role === 'debunker') {
        relationship = 'contradicts';
      } else if (this.contentOverlap(currentNode, previousNode) > 0.7) {
        relationship = 'quotes';
      } else if (currentNode.domain === previousNode.domain) {
        relationship = 'updates';
      }

      edges.push({
        id: `edge_${edgeId++}`,
        from: previousNode.id,
        to: currentNode.id,
        relationship,
        timestamp: currentNode.timestamp,
        evidence: `Temporal sequence: ${previousNode.title} -> ${currentNode.title}`
      });

      // If this node is a debunker, also connect to origin
      if (currentNode.role === 'debunker' && previousNode.id !== originNode.id) {
        edges.push({
          id: `edge_${edgeId++}`,
          from: originNode.id,
          to: currentNode.id,
          relationship: 'contradicts',
          timestamp: currentNode.timestamp,
          evidence: 'Debunker addresses original claim'
        });
      }
    }

    return edges;
  }

  /**
   * Calculate content overlap between two nodes
   */
  contentOverlap(node1, node2) {
    const words1 = new Set(`${node1.title} ${node1.snippet}`.toLowerCase().split(/\s+/));
    const words2 = new Set(`${node2.title} ${node2.snippet}`.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Create canonical hash of graph using deterministic JSON serialization
   * @param {Object} graph - Graph object to hash
   * @returns {string} SHA-256 hash of canonical JSON
   */
  hashGraph(graph) {
    // Create a minimal, canonical representation for hashing
    const canonical = {
      claim: graph.claim,
      nodes: graph.nodes.map(n => ({
        id: n.id,
        url: n.url,
        title: n.title,
        role: n.role
      })).sort((a, b) => a.id.localeCompare(b.id)),
      edges: graph.edges.map(e => ({
        from: e.from,
        to: e.to,
        relationship: e.relationship
      })).sort((a, b) => `${a.from}-${a.to}`.localeCompare(`${b.from}-${b.to}`))
    };

    // Use json-stable-stringify for deterministic key ordering
    const canonicalJson = stringify(canonical);
    
    // SHA-256 hash
    const hash = crypto.createHash('sha256').update(canonicalJson).digest('hex');
    
    logger.debug('Graph hashed', { 
      canonicalLength: canonicalJson.length,
      hash 
    });

    return hash;
  }

  /**
   * Serialize graph for storage
   * @param {Object} graph - Graph object
   * @returns {string} JSON string
   */
  serializeGraph(graph) {
    return stringify(graph);
  }

  /**
   * Validate graph structure
   * @param {Object} graph - Graph to validate
   * @returns {Object} Validation result
   */
  validateGraph(graph) {
    const errors = [];

    if (!graph.claim) {
      errors.push('Missing claim');
    }

    if (!Array.isArray(graph.nodes)) {
      errors.push('Nodes must be an array');
    } else {
      const nodeIds = new Set();
      for (const node of graph.nodes) {
        if (!node.id) errors.push(`Node missing ID`);
        if (!node.url) errors.push(`Node ${node.id} missing URL`);
        if (nodeIds.has(node.id)) errors.push(`Duplicate node ID: ${node.id}`);
        nodeIds.add(node.id);
      }

      // Validate edges reference existing nodes
      if (Array.isArray(graph.edges)) {
        for (const edge of graph.edges) {
          if (!nodeIds.has(edge.from)) {
            errors.push(`Edge references non-existent node: ${edge.from}`);
          }
          if (!nodeIds.has(edge.to)) {
            errors.push(`Edge references non-existent node: ${edge.to}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get graph statistics
   * @param {Object} graph - Graph object
   * @returns {Object} Statistics
   */
  getGraphStats(graph) {
    const roleCount = {};
    const domainCount = {};
    const relationshipCount = {};

    for (const node of graph.nodes || []) {
      roleCount[node.role] = (roleCount[node.role] || 0) + 1;
      domainCount[node.domain] = (domainCount[node.domain] || 0) + 1;
    }

    for (const edge of graph.edges || []) {
      relationshipCount[edge.relationship] = (relationshipCount[edge.relationship] || 0) + 1;
    }

    return {
      nodeCount: graph.nodes?.length || 0,
      edgeCount: graph.edges?.length || 0,
      clusterCount: graph.clusters?.length || 0,
      roleDistribution: roleCount,
      domainDistribution: domainCount,
      relationshipDistribution: relationshipCount,
      hasOrigin: graph.nodes?.some(n => n.role === 'origin') || false,
      hasDebunkers: graph.nodes?.some(n => n.role === 'debunker') || false
    };
  }
}

// Export singleton instance
module.exports = new GraphService();

