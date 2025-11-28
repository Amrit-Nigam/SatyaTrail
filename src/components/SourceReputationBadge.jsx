import { cn } from '../lib/utils'
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'

/**
 * Display mock reputation score for a source
 */
export default function SourceReputationBadge({ score, label, showLabel = true, size = 'md' }) {
  let Icon, colorClass, bgClass

  if (score >= 80) {
    Icon = ShieldCheck
    colorClass = 'text-nb-ok'
    bgClass = 'bg-nb-ok/10'
  } else if (score >= 60) {
    Icon = Shield
    colorClass = 'text-nb-accent-2'
    bgClass = 'bg-nb-accent-2/10'
  } else if (score >= 40) {
    Icon = ShieldAlert
    colorClass = 'text-nb-warn'
    bgClass = 'bg-nb-warn/10'
  } else {
    Icon = ShieldX
    colorClass = 'text-nb-error'
    bgClass = 'bg-nb-error/10'
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border-2 border-nb-ink font-medium',
        bgClass,
        colorClass,
        sizeClasses[size]
      )}
      title={`Reputation Score: ${score}/100`}
    >
      <Icon className={iconSizes[size]} />
      <span>{score}</span>
      {showLabel && label && (
        <span className="text-nb-ink/70">• {label}</span>
      )}
    </div>
  )
}

