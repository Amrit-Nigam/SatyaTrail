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
  Zap
} from 'lucide-react'
import NBCard from '../components/NBCard'
import NBButton from '../components/NBButton'
import ChatPanel from '../components/ChatPanel'
import ClaimInputForm from '../components/ClaimInputForm'
import VerdictBadge from '../components/VerdictBadge'
import { verificationService, APIError } from '../lib/services/verificationService'
import { nodesService } from '../lib/services/nodesService'
import { useUIStore } from '../lib/stores/useUIStore'
import { cn, timeAgo, truncate } from '../lib/utils'

export default function Verify() {
  const [searchParams] = useSearchParams()
  const { recentVerifications, addVerification } = useUIStore()
  
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [streamingMessageIndex, setStreamingMessageIndex] = useState(0)

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

    try {
      // Call the real backend API
      const result = await verificationService.startSession({
        type: data.inputType,
        value: data.inputValue
      })

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

      addVerification(result.session)
      toast.success('Verification complete!', {
        description: `Verdict: ${result.session.finalVerdict}`
      })
    } catch (err) {
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

  const handleSelectSession = (sessionId) => {
    const sessionData = verificationService.getSession(sessionId)
    if (sessionData) {
      setCurrentSession(sessionData.session)
      setMessages(sessionData.messages)
      setError(null)
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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Live Banner */}
        <div className="mb-6 p-4 bg-nb-green/20 rounded-nb border-2 border-nb-green flex items-center gap-3">
          <Zap className="w-5 h-5 text-nb-green flex-shrink-0" />
          <p className="text-sm">
            <strong>Live AI Verification</strong> — Connected to SatyaTrail backend with multi-agent analysis, 
            Tavily search, and blockchain storage.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
          {/* Sidebar - Recent Verifications */}
          <aside className="lg:col-span-3 flex flex-col">
            <NBCard className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold">Recent</h2>
                <NBButton
                  variant="ghost"
                  size="sm"
                  onClick={handleNewSession}
                >
                  New
                </NBButton>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {recentVerifications.length > 0 ? (
                  recentVerifications.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-nb border-2 transition-all',
                        currentSession?.id === session.id
                          ? 'border-nb-ink bg-nb-ink/5'
                          : 'border-nb-ink/20 hover:border-nb-ink/40'
                      )}
                    >
                      <p className="text-sm font-medium line-clamp-2 mb-1">
                        {truncate(session.inputValue, 60)}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-nb-ink/50 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(session.createdAt)}
                        </span>
                        {session.finalVerdict && (
                          <VerdictBadge verdict={session.finalVerdict} size="sm" />
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-nb-ink/50 text-center py-4">
                    No recent verifications
                  </p>
                )}
              </div>
            </NBCard>
          </aside>

          {/* Main Chat Area */}
          <div className="lg:col-span-9 flex flex-col">
            <NBCard className="flex-1 flex flex-col p-0 overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b-2 border-nb-ink/10 flex items-center justify-between">
                <div>
                  <h1 className="font-display text-xl font-bold">Verify</h1>
                  <p className="text-sm text-nb-ink/60">
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

              {/* Error Banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-4 mt-4 p-4 bg-nb-red/20 rounded-nb border-2 border-nb-red flex items-center gap-3"
                >
                  <WifiOff className="w-5 h-5 text-nb-red flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{error}</p>
                    <p className="text-xs text-nb-ink/60 mt-1">
                      Make sure the backend is running on port 3001
                    </p>
                  </div>
                  <NBButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </NBButton>
                </motion.div>
              )}

              {/* Chat Messages */}
              <ChatPanel messages={messages} isLoading={isLoading} />

              {/* Results Panel - shown after verification */}
              {currentSession && messages.length > 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border-t-2 border-nb-ink/10 bg-nb-bg/50"
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
                        <span className="text-xs text-nb-ink/50 font-mono">
                          🔗 {currentSession.blockchainHash.slice(0, 12)}...
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {linkedNodeId && (
                        <Link to={`/article/${linkedNodeId}/trail`}>
                          <NBButton variant="primary" size="sm" icon={GitBranch}>
                            View Trail
                          </NBButton>
                        </Link>
                      )}
                      <Link to="/explore/graph">
                        <NBButton variant="ghost" size="sm" icon={ExternalLink}>
                          Explore Similar
                        </NBButton>
                      </Link>
                    </div>
                  </div>

                  {/* Source graph info */}
                  {currentSession.sourceGraph && (
                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      <span className="text-xs text-nb-ink/60">Sources analyzed:</span>
                      <span className="text-xs px-2 py-1 bg-nb-cyan/20 rounded-full border border-nb-ink/20 font-mono">
                        {currentSession.sourceGraph.nodes?.length || 0} nodes
                      </span>
                      <span className="text-xs px-2 py-1 bg-nb-yellow/20 rounded-full border border-nb-ink/20 font-mono">
                        {currentSession.sourceGraph.edges?.length || 0} connections
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Input Form */}
              <ClaimInputForm
                defaultText={searchParams.get('claim') || ''}
                onSubmit={handleVerify}
                disabled={isLoading}
              />
            </NBCard>
          </div>
        </div>
      </div>
    </div>
  )
}
