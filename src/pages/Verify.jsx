import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  GitBranch,
  Trash2
} from 'lucide-react'
import NBCard from '../components/NBCard'
import NBButton from '../components/NBButton'
import ChatPanel from '../components/ChatPanel'
import ClaimInputForm from '../components/ClaimInputForm'
import VerdictBadge from '../components/VerdictBadge'
import { verificationService } from '../lib/services/verificationService'
import { articlesService } from '../lib/services/articlesService'
import { nodesService } from '../lib/services/nodesService'
import { useUIStore } from '../lib/stores/useUIStore'
import { cn, timeAgo, truncate } from '../lib/utils'

export default function Verify() {
  const [searchParams] = useSearchParams()
  const { recentVerifications, addVerification } = useUIStore()
  
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Check for articleId in URL and auto-start verification
  useEffect(() => {
    const articleId = searchParams.get('articleId')
    if (articleId) {
      const article = articlesService.getById(articleId)
      if (article) {
        handleVerify({
          inputType: 'text',
          inputValue: article.headline
        })
      }
    }
  }, [searchParams])

  const handleVerify = async (data) => {
    setIsLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const result = verificationService.startSession({
      type: data.inputType,
      value: data.inputValue
    })

    setCurrentSession(result.session)
    setMessages([])
    
    // Stream messages with delays for effect
    for (let i = 0; i < result.messages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setMessages(prev => [...prev, result.messages[i]])
    }

    setIsLoading(false)
    addVerification(result.session)
    toast.success('Verification complete')
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
    }
  }

  const handleNewSession = () => {
    setCurrentSession(null)
    setMessages([])
  }

  // Get linked node info if available
  const linkedNode = useMemo(() => {
    if (!currentSession?.linkedNewsNodeId) return null
    return nodesService.getById(currentSession.linkedNewsNodeId)
  }, [currentSession])

  const linkedArticle = useMemo(() => {
    if (!linkedNode) return null
    return articlesService.getById(linkedNode.primaryArticleId)
  }, [linkedNode])

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Demo Banner */}
        <div className="mb-6 p-4 bg-nb-warn/20 rounded-nb border-2 border-nb-warn flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-nb-warn flex-shrink-0" />
          <p className="text-sm">
            <strong>This is a demo</strong> — no real fact checking is performed. 
            All verification responses are simulated for demonstration purposes.
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
                    Chat-style claim verification
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
                    </div>
                    
                    <div className="flex gap-2">
                      {linkedArticle && (
                        <Link to={`/article/${linkedArticle.id}/trail`}>
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

                  {/* Evidence chips */}
                  {linkedNode && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-xs text-nb-ink/60 mr-2">Sources:</span>
                      {linkedNode.articleIds.map((artId) => {
                        const art = articlesService.getById(artId)
                        return art ? (
                          <Link
                            key={artId}
                            to={`/article/${artId}`}
                            className="text-xs px-2 py-1 bg-nb-accent-2/20 rounded-full border border-nb-ink/20 hover:bg-nb-accent-2/40 transition-colors"
                          >
                            {art.sourceName}
                          </Link>
                        ) : null
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Input Form */}
              <ClaimInputForm
                defaultText={searchParams.get('claim') || ''}
                onSubmit={handleVerify}
              />
            </NBCard>
          </div>
        </div>
      </div>
    </div>
  )
}

