import { Link } from 'react-router-dom'
import { GitBranch, Users, Clock, Calendar, ArrowRight } from 'lucide-react'
import NBCard from './NBCard'
import { formatDate, formatTime } from '../lib/utils'

/**
 * Small summary card for a NewsNode trail
 */
export default function TrailSummaryCard({
  originSource,
  hops,
  sourcesCount,
  firstSeenAt,
  lastUpdatedAt,
  articleId,
  showViewButton = true
}) {
  return (
    <NBCard className="p-4">
      <h4 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
        <GitBranch className="w-5 h-5 text-nb-accent" />
        Trail Snapshot
      </h4>

      <div className="space-y-3">
        {/* Origin Source */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-nb-accent/20 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-nb-ink" />
          </div>
          <div>
            <p className="text-sm text-nb-ink/60">Origin Source</p>
            <p className="font-medium">{originSource || 'Unknown'}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-nb-bg rounded-lg p-2 text-center border border-nb-ink/10">
            <p className="text-2xl font-display font-bold text-nb-ink">{hops || 0}</p>
            <p className="text-xs text-nb-ink/60">Hops</p>
          </div>
          <div className="bg-nb-bg rounded-lg p-2 text-center border border-nb-ink/10">
            <p className="text-2xl font-display font-bold text-nb-ink">{sourcesCount || 0}</p>
            <p className="text-xs text-nb-ink/60">Sources</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-2 pt-2 border-t border-nb-ink/10">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-nb-ink/40" />
            <span className="text-nb-ink/60">First seen:</span>
            <span className="font-medium">{firstSeenAt ? formatDate(firstSeenAt) : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-nb-ink/40" />
            <span className="text-nb-ink/60">Last update:</span>
            <span className="font-medium">
              {lastUpdatedAt ? `${formatDate(lastUpdatedAt)} at ${formatTime(lastUpdatedAt)}` : 'N/A'}
            </span>
          </div>
        </div>

        {/* View Trail Button */}
        {showViewButton && articleId && (
          <Link
            to={`/article/${articleId}/trail`}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-nb-accent text-nb-ink font-medium rounded-nb border-2 border-nb-ink shadow-nb-sm hover:-translate-y-0.5 active:translate-y-0 transition-all"
            data-testid="cta-open-graph"
          >
            View Full Trail Graph
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </NBCard>
  )
}

