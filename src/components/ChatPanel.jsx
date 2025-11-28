import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Bot, Database, Search, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import VerdictBadge from './VerdictBadge'

const senderConfig = {
  user: {
    icon: User,
    label: 'You',
    bgColor: 'bg-nb-accent-2',
    align: 'right'
  },
  orchestrator: {
    icon: Bot,
    label: 'Trail Orchestrator',
    bgColor: 'bg-nb-accent',
    align: 'left'
  },
  source_agent: {
    icon: Search,
    label: 'Source Agent',
    bgColor: 'bg-nb-warn',
    align: 'left'
  },
  factbase_agent: {
    icon: Database,
    label: 'Factbase Agent',
    bgColor: 'bg-purple-400',
    align: 'left'
  },
  system: {
    icon: AlertCircle,
    label: 'System',
    bgColor: 'bg-gray-400',
    align: 'left'
  }
}

/**
 * ChatGPT-like conversation UI for /verify
 */
export default function ChatPanel({ messages, isLoading }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const renderMessageContent = (content) => {
    // Parse markdown-like formatting
    const parts = content.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        )
      }
      // Handle line breaks
      return part.split('\n').map((line, j) => (
        <span key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </span>
      ))
    })
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      role="log"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => {
          const config = senderConfig[message.sender] || senderConfig.system
          const Icon = config.icon
          const isUser = message.sender === 'user'

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={cn(
                'flex gap-3',
                isUser && 'flex-row-reverse'
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-full border-2 border-nb-ink flex items-center justify-center',
                  config.bgColor
                )}
              >
                <Icon className="w-5 h-5 text-nb-ink" />
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  'max-w-[80%] rounded-nb border-2 border-nb-ink p-4',
                  isUser
                    ? 'bg-nb-accent-2/20'
                    : 'bg-nb-card shadow-nb-sm'
                )}
              >
                {/* Sender Label */}
                <p className="text-xs font-medium text-nb-ink/60 mb-1">
                  {config.label}
                </p>

                {/* Content */}
                <div className="text-nb-ink whitespace-pre-wrap">
                  {renderMessageContent(message.content)}
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Loading Skeleton */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-nb-ink flex items-center justify-center bg-nb-accent">
              <Bot className="w-5 h-5 text-nb-ink" />
            </div>
            <div className="bg-nb-card rounded-nb border-2 border-nb-ink p-4 shadow-nb-sm">
              <p className="text-xs font-medium text-nb-ink/60 mb-1">
                Trail Orchestrator
              </p>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-nb-ink/40 rounded-full"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {messages.length === 0 && !isLoading && (
        <div className="h-full flex flex-col items-center justify-center text-center text-nb-ink/60 py-12">
          <Bot className="w-16 h-16 mb-4 text-nb-ink/30" />
          <h3 className="font-display text-xl font-semibold mb-2">
            Ready to verify
          </h3>
          <p className="max-w-md">
            Enter a claim, paste article text, or select an example below to start the verification process.
          </p>
        </div>
      )}
    </div>
  )
}

