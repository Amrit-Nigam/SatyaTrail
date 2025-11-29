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
    // Enhanced markdown-like formatting
    let html = content
    
    // Escape HTML first to prevent XSS
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    
    // Code blocks ```code``` - handle before inline code (multiline)
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-black/5 p-3 rounded border border-black/20 my-2 font-mono text-xs overflow-x-auto whitespace-pre-wrap"><code>$1</code></pre>')
    
    // Inline code `code` - handle after code blocks
    html = html.replace(/`([^`\n]+)`/g, '<code class="bg-black/5 px-1.5 py-0.5 rounded border border-black/20 font-mono text-xs">$1</code>')
    
    // Bold text **text** - handle after code to avoid conflicts
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>')
    
    // Italic text _text_ (using underscore to avoid conflicts with bold)
    html = html.replace(/_([^_]+)_/g, '<em class="italic">$1</em>')
    
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-black underline hover:text-black/70 font-medium">$1</a>')
    
    // Handle sections like "Reasoning:" or "_Reasoning:_"
    html = html.replace(/^_?([A-Z][^:]+):_?\s*$/gm, '<div class="font-display font-bold mt-3 mb-1 uppercase tracking-wide text-xs">$1</div>')
    
    // Handle Source [1], Source [2] etc.
    html = html.replace(/Source\s+\[(\d+)\]/g, '<span class="font-semibold">Source [$1]</span>')
    
    // Handle numbered lists (1. item) - must be on new line
    html = html.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="ml-4 mb-1">$1. $2</div>')
    
    // Handle bullet points (- item)
    html = html.replace(/^-\s+(.+)$/gm, '<div class="ml-4 mb-1">• $1</div>')
    
    // Line breaks - convert double newlines to paragraphs
    const lines = html.split('\n')
    const processedLines = []
    let currentParagraph = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // If line is empty, end current paragraph
      if (!line) {
        if (currentParagraph.length > 0) {
          processedLines.push(`<p class="mb-2 leading-relaxed">${currentParagraph.join(' ')}</p>`)
          currentParagraph = []
        }
        continue
      }
      
      // If line starts with HTML tag, it's already formatted
      if (line.startsWith('<')) {
        if (currentParagraph.length > 0) {
          processedLines.push(`<p class="mb-2 leading-relaxed">${currentParagraph.join(' ')}</p>`)
          currentParagraph = []
        }
        processedLines.push(line)
        continue
      }
      
      // Add to current paragraph
      currentParagraph.push(line)
    }
    
    // Add remaining paragraph
    if (currentParagraph.length > 0) {
      processedLines.push(`<p class="mb-2 leading-relaxed">${currentParagraph.join(' ')}</p>`)
    }
    
    html = processedLines.join('')
    
    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 pr-2 scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent"
      role="log"
      aria-live="polite"
      style={{ maxHeight: '100%' }}
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
                  'flex-shrink-0 w-8 h-8 rounded-full border border-black/30 flex items-center justify-center',
                  isUser ? 'bg-black' : 'bg-white'
                )}
              >
                <Icon className={cn("w-4 h-4", isUser ? 'text-white' : 'text-black')} />
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  'max-w-[75%] rounded-lg px-4 py-2',
                  isUser
                    ? 'bg-black text-white'
                    : 'bg-white/60 border border-black/30 text-black'
                )}
              >
                {/* Sender Label */}
                <p className={cn(
                  "text-xs font-display font-bold mb-1.5 uppercase tracking-wide",
                  isUser ? 'text-white/80' : 'text-black/70'
                )}>
                  {config.label}
                </p>

                {/* Content */}
                <div className={cn(
                  "text-sm leading-relaxed",
                  isUser ? 'text-white' : 'text-black'
                )}>
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
            <div className="flex-shrink-0 w-8 h-8 rounded-full border border-black/30 flex items-center justify-center bg-white">
              <Bot className="w-4 h-4 text-black" />
            </div>
            <div className="bg-white/60 border border-black/30 rounded-lg px-4 py-2">
              <p className="text-xs font-display font-bold text-black/70 mb-1.5 uppercase tracking-wide">
                Trail Orchestrator
              </p>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-black/40 rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.2,
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
        <div className="h-full flex flex-col items-center justify-center text-center text-black/60 py-12">
          <Bot className="w-16 h-16 mb-4 text-black/20" />
          <h3 className="font-display text-xl font-bold mb-2 text-black">
            Ready to verify
          </h3>
          <p className="max-w-md text-sm italic">
            Enter a claim, paste article text, or select an example below to start the verification process.
          </p>
        </div>
      )}
    </div>
  )
}

