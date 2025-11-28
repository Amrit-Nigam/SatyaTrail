import { apiClient, APIError } from '../api/client'

// Store for verification sessions (local cache)
let sessions = []
let messageIdCounter = 1

// Generate unique IDs
const generateId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
const generateMessageId = () => `msg_${messageIdCounter++}`

// Demo claims for the dropdown (still useful for quick testing)
const demoClaims = [
  {
    id: "demo_1",
    text: "Government announced a new urban transport policy for major metros."
  },
  {
    id: "demo_2",
    text: "A subway tunnel has collapsed in the city causing casualties."
  },
  {
    id: "demo_3",
    text: "A tech startup raised $50M for AI healthcare diagnostics."
  },
  {
    id: "demo_4",
    text: "A celebrity-endorsed weight loss pill can cause dramatic weight loss without diet."
  }
]

/**
 * Convert backend response to chat messages
 * @param {string} sessionId - Session ID
 * @param {string} inputValue - Original input
 * @param {Object} result - Backend verification result
 * @returns {Array} - Array of chat messages
 */
const convertToMessages = (sessionId, inputValue, result) => {
  const now = new Date()
  const messages = []

  // User message
  messages.push({
    id: generateMessageId(),
    sessionId,
    sender: "user",
    content: inputValue,
    createdAt: now.toISOString()
  })

  // Orchestrator acknowledgment
  messages.push({
    id: generateMessageId(),
    sessionId,
    sender: "orchestrator",
    content: "I've received your claim for verification. Coordinating with our AI agents to analyze this...",
    createdAt: new Date(now.getTime() + 1000).toISOString()
  })

  // Add agent reports as messages
  if (result.agent_reports && result.agent_reports.length > 0) {
    result.agent_reports.forEach((report, index) => {
      messages.push({
        id: generateMessageId(),
        sessionId,
        sender: report.agent_name.toLowerCase().replace(/\s+/g, '_') + '_agent',
        content: `**${report.agent_name}** (Credibility: ${Math.round((report.credibility_score || 0.5) * 100)}%)\n\n${report.summary}\n\n${report.reasoning ? `_Reasoning: ${report.reasoning}_` : ''}`,
        createdAt: new Date(now.getTime() + (index + 2) * 2000).toISOString()
      })
    })
  }

  // Final verdict message
  const verdictLabels = {
    true: "✅ Likely True",
    false: "❌ Likely False",
    mixed: "⚠️ Mixed",
    unknown: "❓ Unknown"
  }

  const verdictLabel = verdictLabels[result.verdict?.toLowerCase()] || verdictLabels.unknown
  const accuracy = Math.round((result.accuracy_score || 0.5) * 100)

  messages.push({
    id: generateMessageId(),
    sessionId,
    sender: "orchestrator",
    content: `**Verification Complete**\n\n**Verdict: ${verdictLabel}**\n**Accuracy Score: ${accuracy}%**\n\n${result.metadata?.claim ? `**Claim analyzed:** ${result.metadata.claim}\n\n` : ''}${result.agent_reports?.length > 0 ? `Based on analysis from ${result.agent_reports.length} specialized agent(s)` : 'Analysis complete'}.${result.blockchain_hash ? `\n\n🔗 _Blockchain hash: ${result.blockchain_hash.slice(0, 16)}..._` : ''}${result.metadata?.remaining_uncertainties ? `\n\n⚠️ _Note: ${result.metadata.remaining_uncertainties}_` : ''}`,
    createdAt: new Date(now.getTime() + (result.agent_reports?.length || 0) * 2000 + 3000).toISOString()
  })

  return messages
}

/**
 * Map backend verdict to frontend verdict format
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
 * Start a new verification session using real backend
 * @param {Object} input - Input data
 * @param {string} input.type - "url" | "text" | "demo"
 * @param {string} input.value - The URL, text, or demo claim ID
 * @returns {Promise<Object>} - { session, messages, result }
 */
const startSession = async (input) => {
  const sessionId = generateId()
  const now = new Date().toISOString()

  let inputValue = input.value
  let isUrl = input.type === 'url'

  // Handle demo claims
  if (input.type === 'demo') {
    const demoClaim = demoClaims.find(d => d.id === input.value)
    if (demoClaim) {
      inputValue = demoClaim.text
      isUrl = false
    }
  }

  // Call the backend API
  const result = await apiClient.verify({
    url: isUrl ? inputValue : undefined,
    text: !isUrl ? inputValue : undefined,
    source: 'frontend'
  })

  // Create session object
  const session = {
    id: sessionId,
    createdAt: now,
    inputType: input.type,
    inputValue,
    linkedNewsNodeId: result.source_graph?.hash || null,
    finalVerdict: mapVerdict(result.verdict),
    finalConfidence: result.accuracy_score || 0.5,
    blockchainHash: result.blockchain_hash,
    sourceGraph: result.source_graph
  }

  // Convert to chat messages
  const messages = convertToMessages(sessionId, inputValue, result)

  // Store in local cache
  sessions.push({ session, messages, result })

  return { session, messages, result }
}

/**
 * Get an existing verification session from cache
 * @param {string} sessionId - Session ID
 * @returns {Object|null} - { session, messages, result } or null if not found
 */
const getSession = (sessionId) => {
  const found = sessions.find(s => s.session.id === sessionId)
  return found || null
}

/**
 * Send a follow-up message in a session
 * For now, this is handled locally since the backend doesn't support chat
 * @param {string} sessionId - Session ID
 * @param {string} content - Message content
 * @returns {Object|null} - Updated { session, messages } or null if session not found
 */
const sendMessage = (sessionId, content) => {
  const sessionData = sessions.find(s => s.session.id === sessionId)
  if (!sessionData) return null

  const now = new Date()

  // Add user message
  sessionData.messages.push({
    id: generateMessageId(),
    sessionId,
    sender: "user",
    content,
    createdAt: now.toISOString()
  })

  // Add orchestrator response
  sessionData.messages.push({
    id: generateMessageId(),
    sessionId,
    sender: "orchestrator",
    content: "Thank you for your follow-up question. Based on our previous analysis, I can provide additional context. Is there a specific aspect of the verification you'd like me to elaborate on?",
    createdAt: new Date(now.getTime() + 1500).toISOString()
  })

  return sessionData
}

/**
 * Get all sessions (for sidebar)
 * @returns {Array} - Array of sessions (without full messages)
 */
const listSessions = () => {
  return sessions.map(s => ({
    ...s.session,
    preview: s.messages[0]?.content?.slice(0, 50) + '...'
  })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/**
 * Get recent verifications from backend
 * @param {number} limit - Number of results
 * @returns {Promise<Array>}
 */
const getRecentVerifications = async (limit = 10) => {
  try {
    const data = await apiClient.getRecentVerifications(limit)
    return data.verifications || []
  } catch (error) {
    console.error('Failed to fetch recent verifications:', error)
    return []
  }
}

/**
 * Get verification by hash from backend
 * @param {string} hash - Graph hash
 * @returns {Promise<Object|null>}
 */
const getVerificationByHash = async (hash) => {
  try {
    return await apiClient.getVerification(hash)
  } catch (error) {
    console.error('Failed to fetch verification:', error)
    return null
  }
}

/**
 * Create a session from an article headline
 * @param {string} headline - Article headline
 * @returns {Promise<Object>} - { session, messages }
 */
const startSessionFromArticle = async (headline) => {
  return startSession({
    type: 'text',
    value: headline
  })
}

/**
 * Clear all local sessions
 */
const clearSessions = () => {
  sessions = []
}

export const verificationService = {
  startSession,
  getSession,
  sendMessage,
  listSessions,
  startSessionFromArticle,
  getRecentVerifications,
  getVerificationByHash,
  clearSessions,
  demoClaims
}

export { APIError }
