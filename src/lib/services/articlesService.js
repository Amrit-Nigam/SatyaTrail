import { apiClient } from '../api/client'

/**
 * Articles Service
 * Fetches articles from recent verifications and provides article data
 */

// Cache for articles from verifications
let articlesCache = []
let lastFetchTime = null
const CACHE_TTL = 60000 // 1 minute cache

// Generate a unique ID for local articles
const generateId = () => `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

/**
 * Convert verification to article format
 */
const verificationToArticle = (verification, index) => {
  const verdictMap = {
    'true': 'likely_true',
    'false': 'likely_false',
    'mixed': 'mixed',
    'unknown': 'unclear'
  }

  return {
    id: verification.hash || generateId(),
    headline: verification.claim || 'Untitled Verification',
    sourceName: verification.source || 'SatyaTrail Verification',
    sourceId: 'satyatrail',
    publishedAt: verification.timestamp || new Date().toISOString(),
    category: 'Verification',
    body: verification.claim || '',
    verdict: verdictMap[verification.verdict?.toLowerCase()] || 'unclear',
    confidence: verification.accuracyScore || 0.5,
    nodeId: verification.hash,
    isVerification: true
  }
}

/**
 * Fetch articles from recent verifications
 */
const fetchFromBackend = async () => {
  try {
    const data = await apiClient.getRecentVerifications(50)
    if (data.verifications) {
      articlesCache = data.verifications.map(verificationToArticle)
      lastFetchTime = Date.now()
    }
  } catch (error) {
    console.error('Failed to fetch articles from backend:', error)
    // Keep existing cache on error
  }
}

/**
 * Check if cache is stale
 */
const isCacheStale = () => {
  return !lastFetchTime || (Date.now() - lastFetchTime > CACHE_TTL)
}

/**
 * Get all articles with optional filtering and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - { articles, total, page, totalPages }
 */
const listAll = async (options = {}) => {
  // Refresh cache if stale
  if (isCacheStale()) {
    await fetchFromBackend()
  }

  let filtered = [...articlesCache]
  const {
    category,
    verdict,
    sourceId,
    q,
    page = 1,
    limit = 12
  } = options

  // Apply filters
  if (category && category !== 'all') {
    filtered = filtered.filter(a => 
      a.category?.toLowerCase() === category.toLowerCase()
    )
  }

  if (verdict && verdict !== 'all') {
    filtered = filtered.filter(a => a.verdict === verdict)
  }

  if (sourceId) {
    filtered = filtered.filter(a => a.sourceId === sourceId)
  }

  if (q) {
    const query = q.toLowerCase()
    filtered = filtered.filter(a =>
      a.headline?.toLowerCase().includes(query) ||
      a.body?.toLowerCase().includes(query) ||
      a.sourceName?.toLowerCase().includes(query)
    )
  }

  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

  // Pagination
  const total = filtered.length
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const articles = filtered.slice(startIndex, startIndex + limit)

  return {
    articles,
    total,
    page,
    totalPages
  }
}

/**
 * Get article by ID
 * @param {string} id - Article ID (can be verification hash)
 * @returns {Promise<Object|null>}
 */
const getById = async (id) => {
  // Check cache first
  const cached = articlesCache.find(a => a.id === id)
  if (cached) return cached

  // Try to fetch from backend by hash
  try {
    const verification = await apiClient.getVerification(id)
    if (verification) {
      const article = verificationToArticle(verification, 0)
      // Add to cache
      articlesCache.push(article)
      return article
    }
  } catch (error) {
    console.error('Failed to fetch article by ID:', error)
  }

  return null
}

/**
 * Get related articles (articles with similar category or source)
 * @param {string} articleId - Article ID
 * @param {number} limit - Max results
 * @returns {Promise<Array>}
 */
const getRelated = async (articleId, limit = 4) => {
  const article = await getById(articleId)
  if (!article) return []

  // Ensure cache is fresh
  if (isCacheStale()) {
    await fetchFromBackend()
  }

  return articlesCache
    .filter(a => 
      a.id !== articleId && 
      (a.category === article.category || a.sourceId === article.sourceId)
    )
    .slice(0, limit)
}

/**
 * Search articles
 * @param {string} query - Search query
 * @param {number} limit - Max results
 * @returns {Promise<Array>}
 */
const search = async (query, limit = 10) => {
  if (!query) return []

  // Ensure cache is fresh
  if (isCacheStale()) {
    await fetchFromBackend()
  }

  const q = query.toLowerCase()
  return articlesCache
    .filter(a =>
      a.headline?.toLowerCase().includes(q) ||
      a.body?.toLowerCase().includes(q) ||
      a.sourceName?.toLowerCase().includes(q)
    )
    .slice(0, limit)
}

/**
 * Get unique categories from cached articles
 * @returns {Array<string>}
 */
const getCategories = () => {
  const categories = new Set(articlesCache.map(a => a.category).filter(Boolean))
  return ['all', ...Array.from(categories)]
}

/**
 * Get unique sources from cached articles
 * @returns {Array<Object>}
 */
const getSources = () => {
  const sourcesMap = new Map()
  articlesCache.forEach(a => {
    if (a.sourceId && !sourcesMap.has(a.sourceId)) {
      sourcesMap.set(a.sourceId, {
        id: a.sourceId,
        name: a.sourceName
      })
    }
  })
  return Array.from(sourcesMap.values())
}

/**
 * Get trending articles (most recent articles)
 * @param {number} limit - Number of articles to return
 * @returns {Promise<Array>}
 */
const listTrending = async (limit = 6) => {
  // Ensure cache is fresh
  if (isCacheStale()) {
    await fetchFromBackend()
  }

  // Return most recent articles (sorted by date, newest first)
  return articlesCache
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, limit)
}

/**
 * Force refresh the cache
 */
const refreshCache = async () => {
  lastFetchTime = null
  await fetchFromBackend()
}

/**
 * Add article to local cache (useful for newly created verifications)
 */
const addToCache = (article) => {
  if (!articlesCache.find(a => a.id === article.id)) {
    articlesCache.unshift(article)
  }
}

export const articlesService = {
  listAll,
  getById,
  getRelated,
  search,
  listTrending,
  getCategories,
  getSources,
  refreshCache,
  addToCache,
  verificationToArticle
}
