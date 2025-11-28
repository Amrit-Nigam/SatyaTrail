import { nodesService } from './nodesService'
import { articlesService } from './articlesService'

// Store for verification sessions
let sessions = []
let messageIdCounter = 1

// Generate a unique ID
const generateId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
const generateMessageId = () => `msg_${messageIdCounter++}`

// Demo claims for the dropdown
const demoClaims = [
  {
    id: "demo_1",
    text: "Government announced a new urban transport policy for major metros.",
    linkedNodeId: "node_001"
  },
  {
    id: "demo_2",
    text: "A subway tunnel has collapsed in the city causing casualties.",
    linkedNodeId: "node_002"
  },
  {
    id: "demo_3",
    text: "A tech startup raised $50M for AI healthcare diagnostics.",
    linkedNodeId: "node_003"
  },
  {
    id: "demo_4",
    text: "A celebrity-endorsed weight loss pill can cause dramatic weight loss without diet.",
    linkedNodeId: "node_004"
  }
]

/**
 * Create mock chat messages for a verification session
 * @param {string} sessionId - Session ID
 * @param {string} inputValue - The claim or URL being verified
 * @param {Object|null} linkedNode - Linked news node if found
 * @returns {Array} - Array of chat messages
 */
const createMockMessages = (sessionId, inputValue, linkedNode) => {
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
    content: "I've received your claim for verification. Let me coordinate with our specialized agents to analyze this.",
    createdAt: new Date(now.getTime() + 1000).toISOString()
  })

  // Source agent analysis
  messages.push({
    id: generateMessageId(),
    sessionId,
    sender: "source_agent",
    content: linkedNode 
      ? `I've identified ${linkedNode.articleIds.length} article(s) related to this claim. The primary source is "${articlesService.getById(linkedNode.primaryArticleId)?.sourceName || 'Unknown'}". Analyzing source reputation and propagation patterns...`
      : "Searching our database for related articles and sources. Analyzing content patterns and source credibility...",
    createdAt: new Date(now.getTime() + 3000).toISOString()
  })

  // Factbase agent analysis
  messages.push({
    id: generateMessageId(),
    sessionId,
    sender: "factbase_agent",
    content: linkedNode
      ? `Cross-referencing with fact-check databases and official records. Found ${linkedNode.articleIds.length > 1 ? 'multiple corroborating sources' : 'relevant data points'}. ${linkedNode.agentsSummary}`
      : "Checking claim against known fact-check databases and verified information sources. Running semantic similarity analysis...",
    createdAt: new Date(now.getTime() + 5000).toISOString()
  })

  // Orchestrator summary
  const verdict = linkedNode?.verdict || 'unclear'
  const confidence = linkedNode?.confidence || 0.4
  const verdictLabels = {
    likely_true: "Likely True",
    likely_false: "Likely False",
    mixed: "Mixed",
    unclear: "Unclear",
    unchecked: "Unchecked"
  }

  messages.push({
    id: generateMessageId(),
    sessionId,
    sender: "orchestrator",
    content: `**Verification Complete**\n\n**Verdict: ${verdictLabels[verdict]}** (Confidence: ${Math.round(confidence * 100)}%)\n\n${linkedNode 
      ? `Based on our analysis of ${linkedNode.articleIds.length} related article(s) and cross-referencing with fact-check databases, this claim has been assessed as **${verdictLabels[verdict]}**.\n\n${linkedNode.summary}\n\nYou can view the full trail graph to see how this story propagated across sources.`
      : `This claim could not be definitively linked to our tracked news events. The verification is based on general pattern analysis and may require manual review.\n\nWe recommend checking official sources and established fact-checking organizations for more information.`
    }`,
    createdAt: new Date(now.getTime() + 7000).toISOString()
  })

  return messages
}

/**
 * Start a new verification session
 * @param {Object} input - Input data
 * @param {string} input.type - "url" | "text" | "demo"
 * @param {string} input.value - The URL, text, or demo claim ID
 * @returns {Object} - { session, messages }
 */
const startSession = (input) => {
  const sessionId = generateId()
  const now = new Date().toISOString()

  let inputValue = input.value
  let linkedNode = null

  // Handle demo claims
  if (input.type === 'demo') {
    const demoClaim = demoClaims.find(d => d.id === input.value)
    if (demoClaim) {
      inputValue = demoClaim.text
      linkedNode = nodesService.getById(demoClaim.linkedNodeId)
    }
  } else {
    // Try to find a matching node by searching claims
    const matchingNode = nodesService.newsNodes.find(n => 
      inputValue.toLowerCase().includes(n.canonicalClaim.toLowerCase().slice(0, 30)) ||
      n.canonicalClaim.toLowerCase().includes(inputValue.toLowerCase().slice(0, 30))
    )
    if (matchingNode) {
      linkedNode = matchingNode
    }
  }

  const session = {
    id: sessionId,
    createdAt: now,
    inputType: input.type,
    inputValue,
    linkedNewsNodeId: linkedNode?.id || null,
    finalVerdict: linkedNode?.verdict || 'unclear',
    finalConfidence: linkedNode?.confidence || 0.4
  }

  const messages = createMockMessages(sessionId, inputValue, linkedNode)

  sessions.push({ session, messages })

  return { session, messages }
}

/**
 * Get an existing verification session
 * @param {string} sessionId - Session ID
 * @returns {Object|null} - { session, messages } or null if not found
 */
const getSession = (sessionId) => {
  const found = sessions.find(s => s.session.id === sessionId)
  return found || null
}

/**
 * Send a follow-up message in a session
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
    content: "Thank you for your follow-up. Our verification system is demo-only at this time, but in a full implementation, I would coordinate additional analysis based on your query. Is there anything specific about the trail or sources you'd like to explore?",
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
 * Create a session from an article ID
 * @param {string} articleId - Article ID
 * @returns {Object} - { session, messages }
 */
const startSessionFromArticle = (articleId) => {
  const article = articlesService.getById(articleId)
  if (!article) {
    return startSession({ type: 'text', value: 'Unknown article' })
  }

  const node = nodesService.getByArticleId(articleId)
  
  return startSession({
    type: 'demo',
    value: node ? demoClaims.find(d => d.linkedNodeId === node.id)?.id || article.headline : article.headline
  })
}

export const verificationService = {
  startSession,
  getSession,
  sendMessage,
  listSessions,
  startSessionFromArticle,
  demoClaims
}

