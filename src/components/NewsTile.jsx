import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, ExternalLink } from 'lucide-react'
import NBCard from './NBCard'
import VerdictBadge from './VerdictBadge'
import { cn, timeAgo, truncate } from '../lib/utils'

/**
 * Tile-like card for landing and feed pages
 */
export default function NewsTile({
  id,
  headline,
  sourceName,
  publishedAt,
  category,
  snippet,
  verdict,
  imageUrl,
  onClick,
  className
}) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick(id)
    } else {
      navigate(`/article/${id}`)
    }
  }

  const handleTrailClick = (e) => {
    e.stopPropagation()
    navigate(`/article/${id}/trail`)
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <NBCard
        as="article"
        className={cn(
          'cursor-pointer flex flex-col gap-3 h-full transition-shadow hover:shadow-nb-sm',
          className
        )}
        onClick={handleClick}
        data-testid="news-tile"
      >
        {/* Category and Time */}
        <div className="flex items-center justify-between text-sm">
          <span className="px-2 py-0.5 bg-nb-accent-2/20 text-nb-ink font-medium rounded-full border border-nb-ink/20">
            {category}
          </span>
          <span className="flex items-center gap-1 text-nb-ink/60">
            <Clock className="w-3.5 h-3.5" />
            {timeAgo(publishedAt)}
          </span>
        </div>

        {/* Headline */}
        <h3 className="font-display font-semibold text-lg leading-tight line-clamp-2">
          {headline}
        </h3>

        {/* Snippet */}
        <p className="text-nb-ink/70 text-sm line-clamp-3 flex-grow">
          {truncate(snippet, 150)}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t-2 border-nb-ink/10">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-nb-ink/80">{sourceName}</span>
            <VerdictBadge verdict={verdict} size="sm" />
          </div>
          <button
            onClick={handleTrailClick}
            className="flex items-center gap-1 text-sm text-nb-accent-2 hover:text-nb-ink transition-colors font-medium"
          >
            View Trail
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </NBCard>
    </motion.div>
  )
}

