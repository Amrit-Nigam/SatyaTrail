/**
 * @typedef {Object} Article
 * @property {string} id
 * @property {string} headline
 * @property {string} subheadline
 * @property {string} sourceId
 * @property {string} sourceName
 * @property {string} author
 * @property {string} publishedAt - ISO date string
 * @property {string} category
 * @property {string} body
 * @property {string} imageUrl
 * @property {string|null} newsNodeId
 * @property {"likely_true"|"likely_false"|"mixed"|"unclear"|"unchecked"} verdict
 * @property {number} confidence - 0 to 1
 */

/**
 * @typedef {Object} NewsNode
 * @property {string} id
 * @property {string} canonicalClaim
 * @property {string} summary
 * @property {string} primaryArticleId
 * @property {string[]} articleIds
 * @property {string} originSourceId
 * @property {string} originPublishedAt - ISO date string
 * @property {"likely_true"|"likely_false"|"mixed"|"unclear"|"unchecked"} verdict
 * @property {number} confidence - 0 to 1
 * @property {string} agentsSummary
 */

/**
 * @typedef {Object} Source
 * @property {string} id
 * @property {string} name
 * @property {string} domain
 * @property {number} reputationScore - 0 to 100
 * @property {"news"|"fact_checker"|"social"|"official"} type
 */

/**
 * @typedef {Object} TrailNode
 * @property {string} id
 * @property {string} sourceId
 * @property {string|null} articleId
 * @property {"origin"|"amplifier"|"debunker"|"commentary"} role
 * @property {string} time - ISO date string
 */

/**
 * @typedef {Object} TrailEdge
 * @property {string} id
 * @property {string} fromNodeId
 * @property {string} toNodeId
 * @property {string} reason
 */

/**
 * @typedef {Object} VerificationSession
 * @property {string} id
 * @property {string} createdAt - ISO date string
 * @property {"url"|"text"|"demo"} inputType
 * @property {string} inputValue
 * @property {string|null} linkedNewsNodeId
 * @property {Article["verdict"]|null} finalVerdict
 * @property {number|null} finalConfidence
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} sessionId
 * @property {"user"|"orchestrator"|"source_agent"|"factbase_agent"|"system"} sender
 * @property {string} content
 * @property {string} createdAt - ISO date string
 */

export {}

