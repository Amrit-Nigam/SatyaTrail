import { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  GitBranch,
  Filter,
  Send,
  Loader2,
  Link as LinkIcon
} from 'lucide-react'
import NBCard from '../components/NBCard'
import NBButton from '../components/NBButton'
import VerdictBadge from '../components/VerdictBadge'
import TrailGraph from '../components/TrailGraph'
import TimelineStrip from '../components/TimelineStrip'
import SourceReputationBadge from '../components/SourceReputationBadge'
import { articlesService } from '../lib/services/articlesService'
import { nodesService } from '../lib/services/nodesService'
import { useUIStore } from '../lib/stores/useUIStore'
import { formatDate, formatTime, getRoleLabel, getRoleColor, cn } from '../lib/utils'

export default function ArticleTrail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { selectedTrailNodeId, setSelectedTrailNodeId, trailFilters, setTrailFilter } = useUIStore()
  
  const [showFilters, setShowFilters] = useState(false)
  const [article, setArticle] = useState(null)
  const [trail, setTrail] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch article and trail data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch article
        const articleData = await articlesService.getById(id)
        setArticle(articleData)

        // Fetch trail
        const trailData = await nodesService.getTrailByHash(id)
        setTrail(trailData)

        if (!articleData && !trailData) {
          setError('Trail not found')
        }
      } catch (err) {
        console.error('Failed to fetch trail:', err)
        setError('Failed to load trail data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Filter trail nodes based on filters
  const filteredTrailNodes = useMemo(() => {
    if (!trail?.trailNodes) return []
    let nodes = [...trail.trailNodes]

    if (trailFilters.showOnlyOrigin) {
      nodes = nodes.filter(n => n.role === 'origin')
    }

    if (trailFilters.hideLowImpact) {
      nodes = nodes.filter(n => n.role !== 'commentary')
    }

    return nodes
  }, [trail, trailFilters])

  const selectedNode = useMemo(() => {
    if (!selectedTrailNodeId || !trail?.trailNodes) return null
    return trail.trailNodes.find(n => n.id === selectedTrailNodeId)
  }, [selectedTrailNodeId, trail])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-nb-ink/50" />
          <span className="ml-3 text-nb-ink/60">Loading trail data...</span>
        </div>
      </div>
    )
  }

  // Error or not found state
  if (error || (!article && !trail)) {
    return (
      <div className="min-h-screen pt-28 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-transparent border border-nb-ink/30 text-center py-12 rounded-lg">
            <h2 className="font-display text-2xl font-bold mb-4 text-black">Trail Not Found</h2>
            <p className="text-nb-ink/70 mb-6 italic">
              {error || "The verification trail doesn't exist or hasn't been generated yet."}
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/feed">
                <button className="px-6 py-2 border border-nb-ink/30 bg-black text-white hover:bg-black/90 transition-colors uppercase tracking-wide text-sm font-bold rounded-lg">
                  Browse Feed
                </button>
              </Link>
              <Link to="/verify">
                <button className="px-6 py-2 border border-nb-ink/30 bg-white/60 text-nb-ink hover:bg-black hover:text-white transition-colors uppercase tracking-wide text-sm font-bold rounded-lg">
                  Verify Something
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const displayTitle = article?.headline || trail?.node?.canonicalClaim || 'Verification Trail'
  const displayVerdict = trail?.node?.verdict || article?.verdict || 'unclear'
  const displayConfidence = trail?.node?.confidence || article?.confidence || 0.5

  return (
    <div className="min-h-screen pt-28 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Newspaper-Style Header */}
        <div className="mb-8 border-b border-nb-ink/20 pb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-nb-ink/70 hover:text-nb-ink transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Go back</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <span className="inline-block bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider mb-3 rounded">
                TRAIL GRAPH
              </span>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-nb-ink mb-2">
                Source Network
              </h1>
              <p className="text-sm text-nb-ink/70 italic line-clamp-2">
                {displayTitle}
              </p>
            </div>
            <VerdictBadge 
              verdict={displayVerdict} 
              confidence={displayConfidence} 
              showConfidence 
              size="lg"
            />
          </div>
        </div>

        {/* Summary Strip */}
        <div className="bg-transparent border border-nb-ink/30 mb-6 p-4 rounded-lg">
          <div className="flex flex-wrap gap-6 items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-black" />
              <span className="text-sm text-nb-ink/70">Sources:</span>
              <span className="font-semibold text-black">
                {trail?.trailNodes?.length || 0} analyzed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-black" />
              <span className="text-sm text-nb-ink/70">Verified:</span>
              <span className="font-semibold text-black">
                {formatDate(trail?.node?.originPublishedAt || new Date().toISOString())}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-black" />
              <span className="text-sm text-nb-ink/70">Agents:</span>
              <span className="font-semibold text-black">{trail?.agentReports?.length || 0}</span>
            </div>
            {trail?.node?.blockchainHash && (
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-black" />
                <span className="text-sm text-nb-ink/70">On-chain:</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${trail.node.blockchainHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold font-mono text-xs text-black hover:underline"
                >
                  {trail.node.blockchainHash.slice(0, 10)}...
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Graph Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Graph */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-transparent border border-nb-ink/30 p-4 rounded-lg overflow-visible">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-lg text-black">Source Network</h2>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg border border-nb-ink/30 text-sm font-bold transition-colors',
                      showFilters ? 'bg-black text-white' : 'bg-white/60 hover:bg-black hover:text-white'
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
                    className="mb-4 p-4 bg-white/60 rounded-lg border border-nb-ink/20"
                  >
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trailFilters.showOnlyOrigin}
                          onChange={(e) => setTrailFilter('showOnlyOrigin', e.target.checked)}
                          className="w-4 h-4 rounded border border-nb-ink/30"
                        />
                        <span className="text-sm font-medium">Show only origin</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trailFilters.hideLowImpact}
                          onChange={(e) => setTrailFilter('hideLowImpact', e.target.checked)}
                          className="w-4 h-4 rounded border border-nb-ink/30"
                        />
                        <span className="text-sm font-medium">Hide low-impact nodes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trailFilters.highlightDebunkers}
                          onChange={(e) => setTrailFilter('highlightDebunkers', e.target.checked)}
                          className="w-4 h-4 rounded border border-nb-ink/30"
                        />
                        <span className="text-sm font-medium">Highlight debunkers</span>
                      </label>
                    </div>
                  </motion.div>
                )}

                <div className="overflow-visible pt-2">
                  <TrailGraph
                    nodes={filteredTrailNodes}
                    edges={trail?.trailEdges || []}
                    selectedNodeId={selectedTrailNodeId}
                    onSelectNode={setSelectedTrailNodeId}
                  />
                </div>
              </div>
            </motion.div>

            {/* Timeline */}
            {trail?.trailNodes?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="bg-transparent border border-nb-ink/30 p-4 rounded-lg">
                  <h2 className="font-display font-bold text-lg mb-4 text-black">Timeline</h2>
                  <TimelineStrip
                    events={trail.trailNodes}
                    onSelect={setSelectedTrailNodeId}
                    selectedId={selectedTrailNodeId}
                  />
                </div>
              </motion.div>
            )}

            {/* Agent Reports */}
            {trail?.agentReports?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="bg-transparent border border-nb-ink/30 p-4 rounded-lg">
                  <h2 className="font-display font-bold text-lg mb-4 text-black">Agent Reports</h2>
                  <div className="space-y-4">
                    {trail.agentReports.map((report, index) => (
                      <div
                        key={index}
                        className="p-4 bg-white/60 rounded-lg border border-nb-ink/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-black">{report.agent_name}</h3>
                          <span className="text-sm font-mono bg-black/10 px-2 py-0.5 rounded text-black">
                            {Math.round((report.credibility_score || 0.5) * 100)}% credibility
                          </span>
                        </div>
                        <p className="text-sm text-nb-ink/80">{report.summary}</p>
                        {report.evidence_links?.length > 0 && report.agent_name?.toLowerCase().includes('generic') && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {report.evidence_links.slice(0, 3).map((link, i) => (
                              <a
                                key={i}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-black hover:underline font-medium"
                              >
                                Source {i + 1} →
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Send to Verify */}
            <div className="flex justify-center">
              <Link to={`/verify?claim=${encodeURIComponent(displayTitle)}`}>
                <button className="px-6 py-2 border border-nb-ink/30 bg-white/60 text-nb-ink hover:bg-black hover:text-white transition-colors uppercase tracking-wide text-sm font-bold rounded-lg inline-flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Re-verify this claim
                </button>
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
              <div className="bg-transparent border border-nb-ink/30 sticky top-24 p-4 rounded-lg">
                <h2 className="font-display font-bold text-lg mb-4 text-black">
                  Sources ({trail?.trailNodes?.length || 0})
                </h2>

                {trail?.trailNodes?.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {trail.trailNodes.map((node) => {
                      const isSelected = selectedTrailNodeId === node.id
                      const source = node.source

                      return (
                        <button
                          key={node.id}
                          onClick={() => setSelectedTrailNodeId(isSelected ? null : node.id)}
                          className={cn(
                            'w-full text-left p-3 rounded-lg border transition-all',
                            isSelected
                              ? 'border-black bg-black/5'
                              : 'border-nb-ink/30 hover:border-nb-ink/50 hover:bg-white/60'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-3 h-3 rounded-full border border-nb-ink/30 mt-1.5 flex-shrink-0"
                              style={{ backgroundColor: getRoleColor(node.role) }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold truncate text-black">
                                    {source?.name || 'Unknown Source'}
                                  </p>
                                  <p className="text-xs text-nb-ink/70">
                                    {getRoleLabel(node.role)} • {formatTime(node.time)}
                                  </p>
                                </div>
                                {source?.reputation !== undefined && (
                                  <div className="flex-shrink-0">
                                    <SourceReputationBadge
                                      score={Math.round(source.reputation)}
                                      size="sm"
                                      showLabel={false}
                                    />
                                  </div>
                                )}
                              </div>
                              {node.url && (
                                <a
                                  href={node.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-2 inline-block text-xs text-black hover:underline font-medium"
                                >
                                  View source →
                                </a>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-nb-ink/60 text-center py-4 italic">
                    No sources analyzed yet
                  </p>
                )}

                {/* Selected Node Details */}
                {selectedNode && (
                  <div className="mt-4 pt-4 border-t border-nb-ink/20">
                    <h3 className="font-semibold mb-2 text-black">Selected: {selectedNode.source?.name}</h3>
                    <div className="text-sm space-y-1 text-nb-ink/80">
                      <p><strong>Role:</strong> {getRoleLabel(selectedNode.role)}</p>
                      <p><strong>Time:</strong> {formatDate(selectedNode.time)} at {formatTime(selectedNode.time)}</p>
                      {selectedNode.source && (
                        <>
                          {selectedNode.source.type && (
                            <p><strong>Type:</strong> {selectedNode.source.type}</p>
                          )}
                          {selectedNode.credibilityScore !== undefined && (
                            <p><strong>Credibility:</strong> {
                              selectedNode.credibilityScore > 1 
                                ? Math.round(selectedNode.credibilityScore) 
                                : Math.round(selectedNode.credibilityScore * 100)
                            }%</p>
                          )}
                          {selectedNode.source?.reputation !== undefined && (
                            <p><strong>Reputation:</strong> {Math.round(selectedNode.source.reputation)}%</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  )
}
