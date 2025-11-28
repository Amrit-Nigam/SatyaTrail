import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  GitBranch,
  Filter,
  Send
} from 'lucide-react'
import NBCard from '../components/NBCard'
import NBButton from '../components/NBButton'
import VerdictBadge from '../components/VerdictBadge'
import TrailGraph from '../components/TrailGraph'
import TimelineStrip from '../components/TimelineStrip'
import SourceReputationBadge from '../components/SourceReputationBadge'
import { articlesService } from '../lib/services/articlesService'
import { nodesService } from '../lib/services/nodesService'
import { sourcesService } from '../lib/services/sourcesService'
import { useUIStore } from '../lib/stores/useUIStore'
import { formatDate, formatTime, getRoleLabel, getRoleColor, cn } from '../lib/utils'

export default function ArticleTrail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { selectedTrailNodeId, setSelectedTrailNodeId, trailFilters, setTrailFilter } = useUIStore()
  const [showFilters, setShowFilters] = useState(false)

  const article = useMemo(() => articlesService.getById(id), [id])
  const trail = useMemo(() => nodesService.getTrailByArticleId(id), [id])

  // Filter trail nodes based on filters
  const filteredTrailNodes = useMemo(() => {
    if (!trail?.trailNodes) return []
    let nodes = [...trail.trailNodes]

    if (trailFilters.showOnlyOrigin) {
      nodes = nodes.filter(n => n.role === 'origin')
    }

    if (trailFilters.hideLowImpact) {
      // In this mock, just filter out commentary
      nodes = nodes.filter(n => n.role !== 'commentary')
    }

    return nodes
  }, [trail, trailFilters])

  const selectedNode = useMemo(() => {
    if (!selectedTrailNodeId || !trail?.trailNodes) return null
    return trail.trailNodes.find(n => n.id === selectedTrailNodeId)
  }, [selectedTrailNodeId, trail])

  if (!article || !trail) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <NBCard className="text-center py-12">
            <h2 className="font-display text-2xl font-bold mb-4">Trail Not Found</h2>
            <p className="text-nb-ink/60 mb-6">
              The article or its trail doesn't exist.
            </p>
            <Link to="/feed">
              <NBButton variant="primary">Back to Feed</NBButton>
            </Link>
          </NBCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/article/${id}`)}
            className="flex items-center gap-2 text-nb-ink/70 hover:text-nb-ink transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to article
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-nb-ink mb-2">
                Trail Graph
              </h1>
              <p className="text-nb-ink/70 line-clamp-1">
                {article.headline}
              </p>
            </div>
            <VerdictBadge 
              verdict={trail.node.verdict} 
              confidence={trail.node.confidence} 
              showConfidence 
              size="lg"
            />
          </div>
        </div>

        {/* Summary Strip */}
        <NBCard className="mb-6 p-4">
          <div className="flex flex-wrap gap-6 items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-nb-accent" />
              <span className="text-sm text-nb-ink/60">Origin:</span>
              <span className="font-medium">
                {trail.trailNodes[0]?.source?.name || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-nb-accent-2" />
              <span className="text-sm text-nb-ink/60">First report:</span>
              <span className="font-medium">
                {formatDate(trail.node.originPublishedAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-nb-warn" />
              <span className="text-sm text-nb-ink/60">Outlets:</span>
              <span className="font-medium">{trail.trailNodes.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-nb-ink/60">Last update:</span>
              <span className="font-medium">
                {formatTime(trail.trailNodes[trail.trailNodes.length - 1]?.time)}
              </span>
            </div>
          </div>
        </NBCard>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Graph Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Graph */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <NBCard className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold text-lg">Source Network</h2>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-nb border-2 border-nb-ink text-sm font-medium transition-colors',
                      showFilters ? 'bg-nb-ink text-white' : 'hover:bg-nb-ink/5'
                    )}
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-4 bg-nb-bg rounded-nb border border-nb-ink/20"
                  >
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trailFilters.showOnlyOrigin}
                          onChange={(e) => setTrailFilter('showOnlyOrigin', e.target.checked)}
                          className="w-4 h-4 rounded border-2 border-nb-ink"
                        />
                        <span className="text-sm">Show only origin</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trailFilters.hideLowImpact}
                          onChange={(e) => setTrailFilter('hideLowImpact', e.target.checked)}
                          className="w-4 h-4 rounded border-2 border-nb-ink"
                        />
                        <span className="text-sm">Hide low-impact nodes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trailFilters.highlightDebunkers}
                          onChange={(e) => setTrailFilter('highlightDebunkers', e.target.checked)}
                          className="w-4 h-4 rounded border-2 border-nb-ink"
                        />
                        <span className="text-sm">Highlight debunkers</span>
                      </label>
                    </div>
                  </motion.div>
                )}

                <TrailGraph
                  nodes={filteredTrailNodes}
                  edges={trail.trailEdges}
                  selectedNodeId={selectedTrailNodeId}
                  onSelectNode={setSelectedTrailNodeId}
                />
              </NBCard>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <NBCard className="p-4">
                <h2 className="font-display font-semibold text-lg mb-4">Timeline</h2>
                <TimelineStrip
                  events={trail.trailNodes}
                  onSelect={setSelectedTrailNodeId}
                  selectedId={selectedTrailNodeId}
                />
              </NBCard>
            </motion.div>

            {/* Send to Verify */}
            <div className="flex justify-center">
              <Link to={`/verify?articleId=${id}`}>
                <NBButton variant="secondary" icon={Send}>
                  Send this trail to Verify
                </NBButton>
              </Link>
            </div>
          </div>

          {/* Sidebar - Node List */}
          <aside className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <NBCard className="sticky top-24">
                <h2 className="font-display font-semibold text-lg mb-4">
                  Sources ({trail.trailNodes.length})
                </h2>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {trail.trailNodes.map((node) => {
                    const isSelected = selectedTrailNodeId === node.id
                    const source = node.source

                    return (
                      <button
                        key={node.id}
                        onClick={() => setSelectedTrailNodeId(isSelected ? null : node.id)}
                        className={cn(
                          'w-full text-left p-3 rounded-nb border-2 transition-all',
                          isSelected
                            ? 'border-nb-ink bg-nb-ink/5 shadow-nb-sm'
                            : 'border-nb-ink/20 hover:border-nb-ink/40 hover:bg-nb-bg'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-3 h-3 rounded-full border-2 border-nb-ink mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: getRoleColor(node.role) }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {source?.name || 'Unknown Source'}
                            </p>
                            <p className="text-xs text-nb-ink/60">
                              {getRoleLabel(node.role)} • {formatTime(node.time)}
                            </p>
                            {source && (
                              <div className="mt-2">
                                <SourceReputationBadge
                                  score={source.reputationScore}
                                  size="sm"
                                  showLabel={false}
                                />
                              </div>
                            )}
                            {node.article && (
                              <Link
                                to={`/article/${node.article.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2 inline-block text-xs text-nb-accent-2 hover:underline"
                              >
                                View article →
                              </Link>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Selected Node Details */}
                {selectedNode && (
                  <div className="mt-4 pt-4 border-t-2 border-nb-ink/10">
                    <h3 className="font-medium mb-2">Selected: {selectedNode.source?.name}</h3>
                    <div className="text-sm space-y-1 text-nb-ink/70">
                      <p><strong>Role:</strong> {getRoleLabel(selectedNode.role)}</p>
                      <p><strong>Time:</strong> {formatDate(selectedNode.time)} at {formatTime(selectedNode.time)}</p>
                      {selectedNode.source && (
                        <>
                          <p><strong>Domain:</strong> {selectedNode.source.domain}</p>
                          <p><strong>Type:</strong> {selectedNode.source.type}</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </NBCard>
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  )
}

