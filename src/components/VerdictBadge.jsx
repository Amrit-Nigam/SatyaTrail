import { cn, getVerdictLabel } from '../lib/utils'
import { CheckCircle, XCircle, AlertCircle, HelpCircle, Circle } from 'lucide-react'

const verdictConfig = {
  likely_true: {
    bg: 'bg-nb-ok',
    text: 'text-white',
    icon: CheckCircle
  },
  likely_false: {
    bg: 'bg-nb-error',
    text: 'text-white',
    icon: XCircle
  },
  mixed: {
    bg: 'bg-nb-warn',
    text: 'text-nb-ink',
    icon: AlertCircle
  },
  unclear: {
    bg: 'bg-gray-400',
    text: 'text-white',
    icon: HelpCircle
  },
  unchecked: {
    bg: 'bg-gray-300',
    text: 'text-nb-ink',
    icon: Circle
  }
}

/**
 * Shows veracity verdict as a colored pill
 */
export default function VerdictBadge({ verdict, confidence, showConfidence = false, size = 'md' }) {
  const config = verdictConfig[verdict] || verdictConfig.unchecked
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-full border-2 border-nb-ink',
          config.bg,
          config.text,
          sizeClasses[size]
        )}
        title={confidence ? `Confidence: ${Math.round(confidence * 100)}%` : undefined}
      >
        <Icon className={cn(size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4')} />
        {getVerdictLabel(verdict)}
      </span>
      {showConfidence && confidence !== undefined && (
        <span className="text-sm text-nb-ink/60">
          ({Math.round(confidence * 100)}%)
        </span>
      )}
    </div>
  )
}

