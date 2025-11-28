import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as Tabs from '@radix-ui/react-tabs'
import {
  List,
  Network,
  Filter,
  ExternalLink,
  GitBranch,
  Users,
  Calendar
} from 'lucide-react'
import NBCard from '../components/NBCard'
import NBButton from '../components/NBButton'
import VerdictBadge from '../components/VerdictBadge'
import FeedFilterBar from '../components/FeedFilterBar'
import { nodesService } from '../lib/services/nodesService'
import { articlesService } from '../lib/services/articlesService'
import { sourcesService } from '../lib/services/sourcesService'
import { useUIStore } from '../lib/stores/useUIStore'
import { cn, formatDate, getVerdictLabel, getRoleColor } from '../lib/utils'

export default function ExploreGraph() {
  const [searchParams] = useSearchParams()
  const { explorerTab, setExplorerTab } = useUIStore()
  const [hoveredCluster, setHoveredCluster] = useState(null)

  // Parse query params
  const query = useMemo(() => ({
    verdict: searchParams.get('verdict') || undefined,
    category: searchParams.get('category') || undefined
  }), [searchParams])

  // Get news nodes
  const newsNodes = useMemo(() => nodesService.listNodes(query), [query])

  // For network view, create cluster positions
  const clusters = useMemo(() => {
    return newsNodes.map((node, index) => {
      const article = articlesService.getById(node.primaryArticleId)
      const angle = (index / newsNodes.length) * 2 * Math.PI
      const radius = 150
      return {
        ...node,
        article,
        x: 250 + Math.cos(angle) * radius,
        y: 200 + Math.sin(angle) * radius,
        size: 40 + node.articleIds.length * 10
      }
    })
  }, [newsNodes])

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-nb-ink mb-2">
            Graph Explorer
          </h1>
          <p className="text-nb-ink/70">
            Browse news nodes and their networks
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <FeedFilterBar showViewToggle={false} />
        </div>

        {/* Tabs */}
        <Tabs.Root value={explorerTab} onValueChange={setExplorerTab}>
          <Tabs.List className="flex gap-2 mb-6">
            <Tabs.Trigger
              value="list"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-nb border-2 border-nb-ink font-medium transition-all',
                explorerTab === 'list'
                  ? 'bg-nb-ink text-white shadow-nb-sm'
                  : 'bg-nb-card hover:bg-nb-ink/5'
              )}
            >
              <List className="w-4 h-4" />
              List View
            </Tabs.Trigger>
            <Tabs.Trigger
              value="network"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-nb border-2 border-nb-ink font-medium transition-all',
                explorerTab === 'network'
                  ? 'bg-nb-ink text-white shadow-nb-sm'
                  : 'bg-nb-card hover:bg-nb-ink/5'
              )}
            >
              <Network className="w-4 h-4" />
              Network View
            </Tabs.Trigger>
          </Tabs.List>

          {/* List View */}
          <Tabs.Content value="list">
            <NBCard className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-nb-bg border-b-2 border-nb-ink">
                      <th className="text-left p-4 font-display font-semibold">Claim</th>
                      <th className="text-left p-4 font-display font-semibold">Headline</th>
                      <th className="text-center p-4 font-display font-semibold">Sources</th>
                      <th className="text-left p-4 font-display font-semibold">Origin</th>
                      <th className="text-center p-4 font-display font-semibold">Verdict</th>
                      <th className="text-center p-4 font-display font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newsNodes.map((node, index) => {
                      const article = articlesService.getById(node.primaryArticleId)
                      const origin = sourcesService.getById(node.originSourceId)

                      return (
                        <motion.tr
                          key={node.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="border-b border-nb-ink/10 hover:bg-nb-bg/50 transition-colors"
                        >
                          <td className="p-4 max-w-xs">
                            <p className="text-sm line-clamp-2">
                              {node.canonicalClaim}
                            </p>
                          </td>
                          <td className="p-4 max-w-xs">
                            <p className="font-medium line-clamp-1">
                              {article?.headline || 'N/A'}
                            </p>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-nb-accent/20 rounded-full font-bold text-sm">
                              {node.articleIds.length}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm">{origin?.name || 'Unknown'}</span>
                          </td>
                          <td className="p-4 text-center">
                            <VerdictBadge verdict={node.verdict} size="sm" />
                          </td>
                          <td className="p-4 text-center">
                            <Link to={`/article/${node.primaryArticleId}/trail`}>
                              <NBButton variant="ghost" size="sm">
                                <ExternalLink className="w-4 h-4" />
                                Open Trail
                              </NBButton>
                            </Link>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {newsNodes.length === 0 && (
                <div className="p-8 text-center text-nb-ink/60">
                  <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No news nodes found matching your filters</p>
                </div>
              )}
            </NBCard>
          </Tabs.Content>

          {/* Network View */}
          <Tabs.Content value="network">
            <NBCard className="p-4">
              <div className="relative h-[500px] bg-nb-bg rounded-nb border-2 border-nb-ink overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 500 400">
                  {/* Center node */}
                  <circle
                    cx="250"
                    cy="200"
                    r="30"
                    fill="#6EE7B7"
                    stroke="#111"
                    strokeWidth="3"
                  />
                  <text
                    x="250"
                    y="205"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="#111"
                  >
                    News
                  </text>

                  {/* Clusters */}
                  {clusters.map((cluster) => {
                    const isHovered = hoveredCluster === cluster.id

                    return (
                      <g key={cluster.id}>
                        {/* Connection line */}
                        <line
                          x1="250"
                          y1="200"
                          x2={cluster.x}
                          y2={cluster.y}
                          stroke="#111"
                          strokeWidth="2"
                          strokeDasharray="4"
                          opacity={0.2}
                        />

                        {/* Cluster bubble */}
                        <Link to={`/article/${cluster.primaryArticleId}/trail`}>
                          <g
                            onMouseEnter={() => setHoveredCluster(cluster.id)}
                            onMouseLeave={() => setHoveredCluster(null)}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle
                              cx={cluster.x}
                              cy={cluster.y}
                              r={isHovered ? cluster.size + 5 : cluster.size}
                              fill={
                                cluster.verdict === 'likely_true' ? '#10B981' :
                                cluster.verdict === 'likely_false' ? '#EF4444' :
                                cluster.verdict === 'mixed' ? '#F59E0B' :
                                '#9CA3AF'
                              }
                              stroke="#111"
                              strokeWidth={isHovered ? 3 : 2}
                              opacity={0.8}
                            />
                            <text
                              x={cluster.x}
                              y={cluster.y - 5}
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="600"
                              fill="#111"
                            >
                              {cluster.articleIds.length}
                            </text>
                            <text
                              x={cluster.x}
                              y={cluster.y + 8}
                              textAnchor="middle"
                              fontSize="8"
                              fill="#111"
                              opacity={0.7}
                            >
                              sources
                            </text>
                          </g>
                        </Link>
                      </g>
                    )
                  })}
                </svg>

                {/* Tooltip */}
                {hoveredCluster && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-4 left-4 right-4 p-4 bg-nb-card rounded-nb border-2 border-nb-ink shadow-nb"
                  >
                    {(() => {
                      const cluster = clusters.find(c => c.id === hoveredCluster)
                      if (!cluster) return null

                      return (
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <h4 className="font-display font-semibold mb-1 line-clamp-1">
                              {cluster.article?.headline || 'Unknown'}
                            </h4>
                            <p className="text-sm text-nb-ink/70 line-clamp-2 mb-2">
                              {cluster.canonicalClaim}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {cluster.articleIds.length} sources
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(cluster.originPublishedAt)}
                              </span>
                            </div>
                          </div>
                          <VerdictBadge verdict={cluster.verdict} size="sm" />
                        </div>
                      )
                    })()}
                  </motion.div>
                )}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-4 justify-center flex-wrap">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-nb-ok border border-nb-ink" />
                  <span>Likely True</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-nb-error border border-nb-ink" />
                  <span>Likely False</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-nb-warn border border-nb-ink" />
                  <span>Mixed</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-gray-400 border border-nb-ink" />
                  <span>Unclear</span>
                </div>
              </div>

              <p className="text-center text-sm text-nb-ink/60 mt-4">
                Click on a cluster to view its trail. Bubble size indicates number of sources.
              </p>
            </NBCard>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  )
}

