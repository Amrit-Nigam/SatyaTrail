import { articlesService } from './articlesService'
import { sourcesService } from './sourcesService'

// Deterministic seed data for news nodes
const newsNodes = [
  {
    id: "node_001",
    canonicalClaim: "Government announced a new national urban transport policy for major Indian metros.",
    summary: "Multiple outlets report on a new transport policy with official press release references.",
    primaryArticleId: "art_001",
    articleIds: ["art_001"],
    originSourceId: "src_03",
    originPublishedAt: "2025-11-20T08:30:00.000Z",
    verdict: "likely_true",
    confidence: 0.85,
    agentsSummary: "Official documents and consistent reports from reputable sources."
  },
  {
    id: "node_002",
    canonicalClaim: "A subway tunnel in City X has collapsed causing major casualties.",
    summary: "Claim propagated via social media before being denied by authorities and local media.",
    primaryArticleId: "art_002",
    articleIds: ["art_002"],
    originSourceId: "src_04",
    originPublishedAt: "2025-11-21T17:45:00.000Z",
    verdict: "likely_false",
    confidence: 0.9,
    agentsSummary: "Authorities deny incident; images match older footage from another country."
  },
  {
    id: "node_003",
    canonicalClaim: "HealthMind Technologies raised $50M in Series B funding for AI healthcare diagnostics.",
    summary: "Tech and business outlets report on the funding round with consistent details.",
    primaryArticleId: "art_003",
    articleIds: ["art_003"],
    originSourceId: "src_01",
    originPublishedAt: "2025-11-19T13:00:00.000Z",
    verdict: "likely_true",
    confidence: 0.78,
    agentsSummary: "Multiple credible business sources confirm the funding details."
  },
  {
    id: "node_004",
    canonicalClaim: "Celebrity-endorsed weight loss pill can cause significant weight loss without diet or exercise.",
    summary: "Viral promotional content for unverified supplement contradicted by health authorities.",
    primaryArticleId: "art_004",
    articleIds: ["art_004"],
    originSourceId: "src_04",
    originPublishedAt: "2025-11-22T06:00:00.000Z",
    verdict: "likely_false",
    confidence: 0.85,
    agentsSummary: "No regulatory approval; health experts warn against unverified supplements."
  }
]

// Trail nodes for each news node
const trailNodesMap = {
  "node_001": [
    { id: "tn_001_1", sourceId: "src_03", articleId: null, role: "origin", time: "2025-11-20T08:30:00.000Z" },
    { id: "tn_001_2", sourceId: "src_01", articleId: "art_001", role: "amplifier", time: "2025-11-20T09:00:00.000Z" },
    { id: "tn_001_3", sourceId: "src_02", articleId: null, role: "amplifier", time: "2025-11-20T10:15:00.000Z" },
    { id: "tn_001_4", sourceId: "src_05", articleId: null, role: "commentary", time: "2025-11-20T14:00:00.000Z" }
  ],
  "node_002": [
    { id: "tn_002_1", sourceId: "src_04", articleId: null, role: "origin", time: "2025-11-21T17:45:00.000Z" },
    { id: "tn_002_2", sourceId: "src_02", articleId: "art_002", role: "amplifier", time: "2025-11-21T18:30:00.000Z" },
    { id: "tn_002_3", sourceId: "src_03", articleId: null, role: "debunker", time: "2025-11-21T19:00:00.000Z" },
    { id: "tn_002_4", sourceId: "src_05", articleId: null, role: "debunker", time: "2025-11-21T20:30:00.000Z" },
    { id: "tn_002_5", sourceId: "src_01", articleId: null, role: "commentary", time: "2025-11-21T21:00:00.000Z" }
  ],
  "node_003": [
    { id: "tn_003_1", sourceId: "src_01", articleId: "art_003", role: "origin", time: "2025-11-19T13:00:00.000Z" },
    { id: "tn_003_2", sourceId: "src_02", articleId: null, role: "amplifier", time: "2025-11-19T15:00:00.000Z" },
    { id: "tn_003_3", sourceId: "src_03", articleId: null, role: "commentary", time: "2025-11-19T18:00:00.000Z" }
  ],
  "node_004": [
    { id: "tn_004_1", sourceId: "src_04", articleId: "art_004", role: "origin", time: "2025-11-22T06:00:00.000Z" },
    { id: "tn_004_2", sourceId: "src_02", articleId: null, role: "amplifier", time: "2025-11-22T07:00:00.000Z" },
    { id: "tn_004_3", sourceId: "src_03", articleId: null, role: "debunker", time: "2025-11-22T09:00:00.000Z" },
    { id: "tn_004_4", sourceId: "src_05", articleId: null, role: "debunker", time: "2025-11-22T10:00:00.000Z" }
  ]
}

// Trail edges for each news node
const trailEdgesMap = {
  "node_001": [
    { id: "te_001_1", fromNodeId: "tn_001_1", toNodeId: "tn_001_2", reason: "Official press release referenced" },
    { id: "te_001_2", fromNodeId: "tn_001_2", toNodeId: "tn_001_3", reason: "Story syndicated" },
    { id: "te_001_3", fromNodeId: "tn_001_2", toNodeId: "tn_001_4", reason: "Analysis published" }
  ],
  "node_002": [
    { id: "te_002_1", fromNodeId: "tn_002_1", toNodeId: "tn_002_2", reason: "Viral content reported" },
    { id: "te_002_2", fromNodeId: "tn_002_2", toNodeId: "tn_002_3", reason: "Official denial issued" },
    { id: "te_002_3", fromNodeId: "tn_002_3", toNodeId: "tn_002_4", reason: "Fact-check published" },
    { id: "te_002_4", fromNodeId: "tn_002_4", toNodeId: "tn_002_5", reason: "Summary coverage" }
  ],
  "node_003": [
    { id: "te_003_1", fromNodeId: "tn_003_1", toNodeId: "tn_003_2", reason: "Tech news picked up" },
    { id: "te_003_2", fromNodeId: "tn_003_1", toNodeId: "tn_003_3", reason: "Official acknowledgment" }
  ],
  "node_004": [
    { id: "te_004_1", fromNodeId: "tn_004_1", toNodeId: "tn_004_2", reason: "Viral spread" },
    { id: "te_004_2", fromNodeId: "tn_004_2", toNodeId: "tn_004_3", reason: "Health warning issued" },
    { id: "te_004_3", fromNodeId: "tn_004_3", toNodeId: "tn_004_4", reason: "Detailed fact-check" }
  ]
}

/**
 * List all news nodes with optional filtering
 * @param {Object} query - Filter parameters
 * @param {string} [query.verdict] - Filter by verdict
 * @param {string} [query.category] - Filter by category (matches articles)
 * @returns {Array} - Array of news nodes
 */
const listNodes = (query = {}) => {
  let filtered = [...newsNodes]

  // Apply verdict filter
  if (query.verdict && query.verdict !== 'all') {
    filtered = filtered.filter(n => n.verdict === query.verdict)
  }

  // Sort by origin date (most recent first)
  filtered.sort((a, b) => new Date(b.originPublishedAt) - new Date(a.originPublishedAt))

  return filtered
}

/**
 * Get a single news node by ID
 * @param {string} id - News node ID
 * @returns {Object|null} - News node or null if not found
 */
const getById = (id) => {
  return newsNodes.find(n => n.id === id) || null
}

/**
 * Get news node by article ID
 * @param {string} articleId - Article ID
 * @returns {Object|null} - News node or null if not found
 */
const getByArticleId = (articleId) => {
  return newsNodes.find(n => n.articleIds.includes(articleId)) || null
}

/**
 * Get the full trail for a news node
 * @param {string} nodeId - News node ID
 * @returns {Object|null} - Trail data or null if not found
 */
const getTrail = (nodeId) => {
  const node = getById(nodeId)
  if (!node) return null

  const trailNodes = (trailNodesMap[nodeId] || []).map(tn => {
    const source = sourcesService.getById(tn.sourceId)
    const article = tn.articleId ? articlesService.getById(tn.articleId) : null
    return {
      ...tn,
      source,
      article
    }
  })

  const trailEdges = trailEdgesMap[nodeId] || []

  return {
    node,
    trailNodes,
    trailEdges
  }
}

/**
 * Get trail by article ID
 * @param {string} articleId - Article ID
 * @returns {Object|null} - Trail data or null if not found
 */
const getTrailByArticleId = (articleId) => {
  const article = articlesService.getById(articleId)
  if (!article || !article.newsNodeId) {
    // Create a minimal trail for articles without a news node
    if (article) {
      const source = sourcesService.getById(article.sourceId)
      return {
        node: {
          id: `temp_${articleId}`,
          canonicalClaim: article.headline,
          summary: article.subheadline,
          primaryArticleId: articleId,
          articleIds: [articleId],
          originSourceId: article.sourceId,
          originPublishedAt: article.publishedAt,
          verdict: article.verdict,
          confidence: article.confidence,
          agentsSummary: "No trail analysis available for this article."
        },
        trailNodes: [
          {
            id: `tn_temp_1`,
            sourceId: article.sourceId,
            articleId: articleId,
            role: "origin",
            time: article.publishedAt,
            source,
            article
          }
        ],
        trailEdges: []
      }
    }
    return null
  }

  return getTrail(article.newsNodeId)
}

export const nodesService = {
  listNodes,
  getById,
  getByArticleId,
  getTrail,
  getTrailByArticleId,
  newsNodes
}

