// Deterministic seed data for sources
const sources = [
  {
    id: "src_01",
    name: "City Herald",
    domain: "cityherald.example",
    reputationScore: 82,
    type: "news"
  },
  {
    id: "src_02",
    name: "MetroBuzz",
    domain: "metrobuzz.example",
    reputationScore: 55,
    type: "news"
  },
  {
    id: "src_03",
    name: "Press Bureau",
    domain: "pressbureau.example",
    reputationScore: 95,
    type: "official"
  },
  {
    id: "src_04",
    name: "ViralClipsChannel",
    domain: "viralclips.example",
    reputationScore: 35,
    type: "social"
  },
  {
    id: "src_05",
    name: "FactWatch India",
    domain: "factwatch.example",
    reputationScore: 90,
    type: "fact_checker"
  }
]

/**
 * Get all sources
 * @returns {Array} - Array of all sources
 */
const listAll = () => {
  return [...sources]
}

/**
 * Get a single source by ID
 * @param {string} id - Source ID
 * @returns {Object|null} - Source or null if not found
 */
const getById = (id) => {
  return sources.find(s => s.id === id) || null
}

/**
 * Get reputation score for a source
 * @param {string} id - Source ID
 * @returns {number} - Reputation score (0-100) or 0 if not found
 */
const getReputation = (id) => {
  const source = sources.find(s => s.id === id)
  return source ? source.reputationScore : 0
}

export const sourcesService = {
  listAll,
  getById,
  getReputation,
  sources
}

