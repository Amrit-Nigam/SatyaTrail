import { apiClient } from '../api/client'
import { sourcesService } from './sourcesService'

// Cache for nodes/trails
let nodesCache = new Map()
let lastFetchTime = null
const CACHE_TTL = 60000 // 1 minute

/**
 * Convert backend source graph node to frontend trail node format
 */
const convertGraphNode = (node, index) => {
  // Determine role based on node properties
  let role = 'commentary'
  if (node.isOriginal || node.type === 'claim' || index === 0) {
    role = 'origin'
  } else if (node.isFactCheck || node.type === 'factcheck') {
    role = 'debunker'
  } else if (node.credibilityScore > 0.7) {
    role = 'amplifier'
  }

  return {
    id: node.id || `node_${index}`,
    sourceId: node.sourceId || node.domain || `source_${index}`,
    articleId: node.url || null,
    role,
    time: node.publishDate || node.timestamp || new Date().toISOString(),
    headline: node.title || node.snippet?.substring(0, 100),
    url: node.url,
    source: {
      id: node.sourceId || node.domain || `source_${index}`,
      name: node.domain || node.sourceName || extractDomain(node.url) || 'Unknown Source',
      type: node.type || 'news',
      reputation: node.domainReputationScore || node.credibilityScore || 0.5
    },
    credibilityScore: node.credibilityScore || node.domainReputationScore || 0.5
  }
}

/**
 * Convert backend source graph edge to frontend trail edge format
 */
const convertGraphEdge = (edge, index) => {
  return {
    id: edge.id || `edge_${index}`,
    fromNodeId: edge.source || edge.from,
    toNodeId: edge.target || edge.to,
    relationType: edge.type || edge.relationType || 'related',
    reason: edge.label || edge.reason || 'Related content'
  }
}

/**
 * Extract domain from URL
 */
const extractDomain = (url) => {
  if (!url) return null
  try {
    const domain = new URL(url).hostname
    return domain.replace('www.', '')
  } catch {
    return null
  }
}

/**
 * Map backend verdict to frontend verdict
 */
const mapVerdict = (verdict) => {
  const map = {
    'true': 'likely_true',
    'false': 'likely_false',
    'mixed': 'mixed',
    'unknown': 'unclear'
  }
  return map[verdict?.toLowerCase()] || 'unclear'
}

/**
 * Get trail data from a verification result
 * @param {string} hash - Graph hash
 * @returns {Promise<Object|null>}
 */
const getTrailByHash = async (hash) => {
  // Check cache
  if (nodesCache.has(hash)) {
    return nodesCache.get(hash)
  }

  try {
    const verification = await apiClient.getVerification(hash)
    if (!verification) return null

    const trail = convertVerificationToTrail(verification, hash)
    nodesCache.set(hash, trail)
    return trail
  } catch (error) {
    console.error('Failed to fetch trail:', error)
    return null
  }
}

/**
 * Convert verification result to trail format
 */
const convertVerificationToTrail = (verification, hash) => {
  const sourceGraph = verification.source_graph || {}
  
  // Convert nodes
  const trailNodes = (sourceGraph.nodes || []).map(convertGraphNode)
  
  // Convert edges
  const trailEdges = (sourceGraph.edges || []).map(convertGraphEdge)

  // Create the news node
  const newsNode = {
    id: hash || sourceGraph.hash || `node_${Date.now()}`,
    canonicalClaim: verification.metadata?.claim || 'Untitled Claim',
    summary: verification.agent_reports?.[0]?.summary || 'Verification completed',
    primaryArticleId: verification.metadata?.url || null,
    articleIds: trailNodes.filter(n => n.url).map(n => n.url),
    originSourceId: trailNodes[0]?.sourceId || 'unknown',
    originPublishedAt: verification.timestamp || new Date().toISOString(),
    verdict: mapVerdict(verification.verdict),
    confidence: verification.accuracy_score || 0.5,
    agentsSummary: verification.agent_reports?.map(r => r.summary).join(' ') || '',
    blockchainHash: verification.blockchain_hash
  }

  return {
    node: newsNode,
    trailNodes,
    trailEdges,
    agentReports: verification.agent_reports || [],
    metadata: verification.metadata
  }
}

/**
 * List all news nodes from recent verifications
 * @param {Object} query - Filter parameters
 * @returns {Promise<Array>}
 */
const listNodes = async (query = {}) => {
  try {
    const data = await apiClient.getRecentVerifications(50)
    let nodes = (data.verifications || []).map((v, i) => ({
      id: v.hash,
      canonicalClaim: v.claim,
      verdict: mapVerdict(v.verdict),
      confidence: v.accuracyScore || 0.5,
      originPublishedAt: v.timestamp,
      summary: v.claim
    }))

    // Apply verdict filter
    if (query.verdict && query.verdict !== 'all') {
      nodes = nodes.filter(n => n.verdict === query.verdict)
    }

    // Sort by date
    nodes.sort((a, b) => new Date(b.originPublishedAt) - new Date(a.originPublishedAt))

    return nodes
  } catch (error) {
    console.error('Failed to list nodes:', error)
    return []
  }
}

/**
 * Get a single news node by ID (hash)
 * @param {string} id - News node ID (graph hash)
 * @returns {Promise<Object|null>}
 */
const getById = async (id) => {
  const trail = await getTrailByHash(id)
  return trail?.node || null
}

/**
 * Get news node by article ID
 * @param {string} articleId - Article ID (URL or hash)
 * @returns {Promise<Object|null>}
 */
const getByArticleId = async (articleId) => {
  // For now, articleId is the hash
  return getById(articleId)
}

/**
 * Get the full trail for a news node
 * @param {string} nodeId - News node ID (hash)
 * @returns {Promise<Object|null>}
 */
const getTrail = async (nodeId) => {
  return getTrailByHash(nodeId)
}

/**
 * Get trail by article ID
 * @param {string} articleId - Article ID
 * @returns {Promise<Object|null>}
 */
const getTrailByArticleId = async (articleId) => {
  return getTrailByHash(articleId)
}

/**
 * Store a trail from a new verification result
 * @param {string} hash - Graph hash
 * @param {Object} verification - Verification result
 */
const storeTrail = (hash, verification) => {
  const trail = convertVerificationToTrail(verification, hash)
  nodesCache.set(hash, trail)
  return trail
}

/**
 * Clear the cache
 */
const clearCache = () => {
  nodesCache.clear()
  lastFetchTime = null
}

// Legacy sync methods for backward compatibility (use cached data)
const listNodesSync = (query = {}) => {
  const nodes = Array.from(nodesCache.values()).map(t => t.node)
  if (query.verdict && query.verdict !== 'all') {
    return nodes.filter(n => n.verdict === query.verdict)
  }
  return nodes
}

const getByIdSync = (id) => {
  return nodesCache.get(id)?.node || null
}

export const nodesService = {
  listNodes,
  getById,
  getByArticleId,
  getTrail,
  getTrailByArticleId,
  getTrailByHash,
  storeTrail,
  clearCache,
  // Legacy sync methods
  listNodesSync,
  getByIdSync,
  // For backward compat
  get newsNodes() {
    return Array.from(nodesCache.values()).map(t => t.node)
  }
}
