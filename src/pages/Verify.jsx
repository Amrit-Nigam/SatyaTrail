import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  GitBranch,
  Loader2,
  WifiOff,
  Zap,
  Search,
  Database,
  CheckCircle2,
  Sparkles,
  FileText
} from 'lucide-react'
import NBCard from '../components/NBCard'
import NBButton from '../components/NBButton'
import ChatPanel from '../components/ChatPanel'
import ClaimInputForm from '../components/ClaimInputForm'
import VerdictBadge from '../components/VerdictBadge'
import { verificationService, APIError } from '../lib/services/verificationService'
import { nodesService } from '../lib/services/nodesService'
import { cn, timeAgo, truncate } from '../lib/utils'

// Helper function to map verdict
const mapVerdict = (verdict) => {
  const map = {
    'true': 'likely_true',
    'false': 'likely_false',
    'mixed': 'mixed',
    'unknown': 'unclear'
  }
  return map[verdict?.toLowerCase()] || 'unclear'
}

// Helper function to convert verification result to messages
const convertToMessages = (sessionId, inputValue, result) => {
  const now = new Date()
  const messages = []
  let messageIdCounter = 1
  const generateMessageId = () => `msg_${messageIdCounter++}`

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
    content: `**Verification Complete**\n\n**Verdict: ${verdictLabel}**\n**Accuracy Score: ${accuracy}%**\n\n${result.metadata?.claim ? `**Claim analyzed:** ${result.metadata.claim}\n\n` : ''}${result.agent_reports?.length > 0 ? `Based on analysis from ${result.agent_reports.length} specialized agent(s)` : 'Analysis complete'}.${result.blockchain_hash ? `\n\n🔗 [Blockchain hash: ${result.blockchain_hash.slice(0, 16)}...](https://sepolia.etherscan.io/tx/${result.blockchain_hash})` : ''}${result.metadata?.remaining_uncertainties ? `\n\n⚠️ _Note: ${result.metadata.remaining_uncertainties}_` : ''}`,
    createdAt: new Date(now.getTime() + (result.agent_reports?.length || 0) * 2000 + 3000).toISOString()
  })

  return messages
}

export default function Verify() {
  const [searchParams] = useSearchParams()
  
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [streamingMessageIndex, setStreamingMessageIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])
  const [recentVerifications, setRecentVerifications] = useState([])
  const [isLoadingRecent, setIsLoadingRecent] = useState(false)

  // Loading steps with different colors and messages
  const loadingSteps = [
    { 
      icon: FileText, 
      message: 'Analyzing claim...', 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      icon: Search, 
      message: 'Searching sources...', 
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    { 
      icon: Database, 
      message: 'Checking fact database...', 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    { 
      icon: Sparkles, 
      message: 'AI agents analyzing...', 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    { 
      icon: CheckCircle2, 
      message: 'Finalizing verdict...', 
      color: 'text-black',
      bgColor: 'bg-white',
      borderColor: 'border-black/30'
    }
  ]

  // Fetch recent verifications from API
  useEffect(() => {
    const fetchRecentVerifications = async () => {
      setIsLoadingRecent(true)
      try {
        const verifications = await verificationService.getRecentVerifications(50)
        setRecentVerifications(verifications)
      } catch (err) {
        console.error('Failed to fetch recent verifications:', err)
        setRecentVerifications([])
      } finally {
        setIsLoadingRecent(false)
      }
    }

    fetchRecentVerifications()
  }, [])

  // Check for articleId in URL and auto-start verification
  useEffect(() => {
    const articleId = searchParams.get('articleId')
    const claim = searchParams.get('claim')
    
    if (articleId || claim) {
      handleVerify({
        inputType: claim ? 'text' : 'url',
        inputValue: claim || articleId
      })
    }
  }, [searchParams])

  const handleVerify = async (data) => {
    setIsLoading(true)
    setError(null)
    setMessages([])
    setStreamingMessageIndex(0)
    setCompletedSteps([])

    // Progress through steps sequentially with even spacing
    const stepDuration = 3000 // 3 seconds per step
    const stepTimeouts = []

    for (let i = 0; i < loadingSteps.length; i++) {
      const timeout = setTimeout(() => {
        setCompletedSteps(prev => [...prev, i])
      }, i * stepDuration)
      stepTimeouts.push(timeout)
    }

    try {
      // Call the real backend API
      const result = await verificationService.startSession({
        type: data.inputType,
        value: data.inputValue
      })

      // Clear all timeouts
      stepTimeouts.forEach(timeout => clearTimeout(timeout))
      setCompletedSteps([...Array(loadingSteps.length).keys()]) // Mark all as complete

      setCurrentSession(result.session)
      
      // Stream messages with delays for effect
      for (let i = 0; i < result.messages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600))
        setMessages(prev => [...prev, result.messages[i]])
        setStreamingMessageIndex(i + 1)
      }

      // Store trail data if we have a source graph
      if (result.result?.source_graph?.hash) {
        nodesService.storeTrail(result.result.source_graph.hash, result.result)
      }

      // Refresh recent verifications list
      const verifications = await verificationService.getRecentVerifications(50)
      setRecentVerifications(verifications)

      toast.success('Verification complete!', {
        description: `Verdict: ${result.session.finalVerdict}`
      })
    } catch (err) {
      // Clear all timeouts
      stepTimeouts.forEach(timeout => clearTimeout(timeout))
      console.error('Verification failed:', err)
      
      let errorMessage = 'Verification failed. Please try again.'
      
      if (err instanceof APIError) {
        if (err.status === 0) {
          errorMessage = 'Cannot connect to server. Please ensure the backend is running.'
        } else if (err.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.'
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      toast.error('Verification failed', {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
      setCompletedSteps([])
    }
  }

  const handleSendFollowUp = async (content) => {
    if (!currentSession) return

    setIsLoading(true)
    const result = verificationService.sendMessage(currentSession.id, content)
    
    if (result) {
      setMessages(result.messages)
    }
    
    setIsLoading(false)
  }

  const handleSelectSession = async (hash) => {
    try {
      const fullVerification = await verificationService.getVerificationByHash(hash)
      if (fullVerification) {
        const claim = fullVerification.metadata?.claim || fullVerification.claim || 'Untitled Claim'
        const verdict = fullVerification.verdict || 'unknown'
        const createdAt = fullVerification.timestamp || new Date().toISOString()
        
        // Convert to session format
        const session = {
          id: hash,
          createdAt: createdAt,
          inputType: fullVerification.metadata?.url ? 'url' : 'text',
          inputValue: claim,
          linkedNewsNodeId: hash,
          finalVerdict: mapVerdict(verdict),
          finalConfidence: fullVerification.accuracy_score || 0.5,
          blockchainHash: fullVerification.blockchain_hash,
          sourceGraph: fullVerification.source_graph
        }
        
        // Convert to messages
        const messages = convertToMessages(hash, claim, fullVerification)
        
        setCurrentSession(session)
        setMessages(messages)
        setError(null)
      }
    } catch (err) {
      console.error('Failed to load verification:', err)
      setError('Failed to load verification details')
    }
  }

  const handleNewSession = () => {
    setCurrentSession(null)
    setMessages([])
    setError(null)
  }

  // Get linked node info if available
  const linkedNodeId = currentSession?.linkedNewsNodeId || currentSession?.sourceGraph?.hash

  return (
    <div className="h-screen pt-28 pb-8 flex flex-col overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 flex-1 flex flex-col min-h-0">
        {/* Newspaper-Style Header */}
        <div className="mb-6 border-b border-nb-ink/20 pb-4 flex-shrink-0">
          <span className="inline-block bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider mb-3 rounded">
            VERIFY CLAIM
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-nb-ink mb-2">
            AI Verification System
          </h1>
          <p className="text-sm text-nb-ink/70 italic">
            Multi-agent analysis with Tavily search and blockchain storage
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          {/* Sidebar - Recent Verifications */}
          <aside className="lg:col-span-3 flex flex-col min-h-0">
            <div className="bg-transparent border border-nb-ink/30 flex-1 flex flex-col p-4 rounded-lg overflow-hidden min-h-0">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="font-display font-bold text-lg text-black">Recent</h2>
                <button
                  onClick={handleNewSession}
                  className="px-3 py-1 border border-nb-ink/30 rounded-lg text-sm font-bold hover:bg-black hover:text-white transition-colors"
                >
                  New
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 min-h-0 scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent">
                {isLoadingRecent ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-black/40 mb-2" />
                    <p className="text-xs text-nb-ink/60 italic">Loading...</p>
                  </div>
                ) : recentVerifications.length > 0 ? (
                  recentVerifications.map((verification) => {
                    const hash = verification.hash || verification.id
                    const claim = verification.claim || verification.metadata?.claim || 'Untitled Claim'
                    const verdict = verification.verdict || verification.verification?.verdict || 'unknown'
                    const createdAt = verification.createdAt || verification.timestamp || verification.request?.timestamp
                    
                    return (
                      <button
                        key={hash}
                        onClick={() => handleSelectSession(hash)}
                        className={cn(
                          'w-full text-left p-3 rounded-lg border transition-all',
                          currentSession?.id === hash
                            ? 'border-black bg-black/5'
                            : 'border-nb-ink/30 hover:border-nb-ink/50 hover:bg-white/60'
                        )}
                      >
                        <p className="text-sm font-display font-semibold line-clamp-2 mb-1 text-black">
                          {truncate(claim, 60)}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-nb-ink/70 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {createdAt ? timeAgo(createdAt) : 'Unknown'}
                          </span>
                          {verdict && (
                            <VerdictBadge verdict={mapVerdict(verdict)} size="sm" />
                          )}
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <p className="text-sm text-nb-ink/60 text-center py-4 italic">
                    No recent verifications
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* Main Chat Area */}
          <div className="lg:col-span-9 flex flex-col min-h-0">
            <div className="bg-transparent border border-nb-ink/30 flex-1 flex flex-col rounded-lg overflow-hidden min-h-0">
              {/* Chat Header */}
              <div className="p-4 border-b border-nb-ink/20 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="font-display text-xl font-bold text-black">Verification</h2>
                  <p className="text-sm text-nb-ink/70 italic">
                    AI-powered claim verification
                  </p>
                </div>
                {currentSession && (
                  <VerdictBadge
                    verdict={currentSession.finalVerdict || 'unclear'}
                    confidence={currentSession.finalConfidence}
                    showConfidence
                  />
                )}
              </div>

              {/* Loading Steps Timeline */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-4 mt-4 py-4"
                >
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute top-8 left-0 right-0 h-0.5 bg-black/20 rounded-full" />
                    
                    {/* Steps */}
                    <div className="relative flex justify-between">
                      {loadingSteps.map((step, index) => {
                        const Icon = step.icon
                        const isCompleted = completedSteps.includes(index)
                        const isCurrent = !isCompleted && index === completedSteps.length
                        
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col items-center flex-1"
                          >
                            {/* Icon */}
                            <div className={cn(
                              "relative z-10 flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all",
                              isCompleted 
                                ? `${step.bgColor} ${step.borderColor}` 
                                : isCurrent
                                ? `${step.bgColor} ${step.borderColor}`
                                : "bg-white border-black/20"
                            )}>
                              {isCompleted ? (
                                <CheckCircle2 className={cn("w-5 h-5", step.color)} />
                              ) : (
                                <Icon className={cn(
                                  "w-5 h-5",
                                  isCurrent ? step.color : "text-gray-400"
                                )} />
                              )}
                            </div>
                            
                            {/* Label */}
                            <p className={cn(
                              "text-xs font-bold mt-2 text-center max-w-[100px]",
                              isCompleted || isCurrent
                                ? step.color
                                : "text-gray-400"
                            )}>
                              {step.message}
                            </p>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error Banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-4 mt-4 p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3"
                >
                  <WifiOff className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">{error}</p>
                    <p className="text-xs text-red-700 mt-1">
                      Make sure the backend is running on port 3001
                    </p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="px-3 py-1 border border-red-300 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}

              {/* Chat Messages */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <ChatPanel messages={messages} isLoading={isLoading && messages.length === 0} />
              </div>

              {/* Results Panel - shown after verification */}
              {currentSession && messages.length > 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border-t border-nb-ink/20 bg-white/60 flex-shrink-0"
                >
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <VerdictBadge
                        verdict={currentSession.finalVerdict || 'unclear'}
                        confidence={currentSession.finalConfidence}
                        showConfidence
                        size="lg"
                      />
                      {currentSession.blockchainHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${currentSession.blockchainHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-nb-ink/70 font-mono hover:text-black hover:underline inline-flex items-center gap-1"
                        >
                          🔗 {currentSession.blockchainHash.slice(0, 12)}...
                        </a>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {linkedNodeId && (
                        <Link to={`/article/${linkedNodeId}/trail`}>
                          <button className="px-4 py-2 border border-nb-ink/30 bg-black text-white hover:bg-black/90 transition-colors uppercase tracking-wide text-sm font-bold rounded-lg inline-flex items-center gap-2">
                            <GitBranch className="w-4 h-4" />
                            View Trail
                          </button>
                        </Link>
                      )}
                      <Link to="/explore/graph">
                        <button className="px-4 py-2 border border-nb-ink/30 bg-white/60 text-nb-ink hover:bg-black hover:text-white transition-colors uppercase tracking-wide text-sm font-bold rounded-lg inline-flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Explore Similar
                        </button>
                      </Link>
                    </div>
                  </div>

                  {/* Source graph info */}
                  {currentSession.sourceGraph && (
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      <span className="text-xs text-nb-ink/70 font-semibold">Sources analyzed:</span>
                      <span className="text-xs px-2 py-1 bg-white border border-nb-ink/30 rounded font-mono text-black">
                        {currentSession.sourceGraph.nodes?.length || 0} nodes
                      </span>
                      <span className="text-xs px-2 py-1 bg-white border border-nb-ink/30 rounded font-mono text-black">
                        {currentSession.sourceGraph.edges?.length || 0} connections
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Input Form */}
              <div className="flex-shrink-0">
                <ClaimInputForm
                  defaultText={searchParams.get('claim') || ''}
                  onSubmit={handleVerify}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
