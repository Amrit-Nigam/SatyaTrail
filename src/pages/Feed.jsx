import { useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Frown, ArrowLeft, ArrowRight } from 'lucide-react'
import FeedFilterBar from '../components/FeedFilterBar'
import NewsTile from '../components/NewsTile'
import NBCard from '../components/NBCard'
import NBButton from '../components/NBButton'
import VerdictBadge from '../components/VerdictBadge'
import { articlesService } from '../lib/services/articlesService'
import { useUIStore } from '../lib/stores/useUIStore'
import { cn, timeAgo, truncate } from '../lib/utils'

export default function Feed() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { viewMode } = useUIStore()

  // Parse query params
  const query = useMemo(() => ({
    category: searchParams.get('category') || undefined,
    verdict: searchParams.get('verdict') || undefined,
    sourceId: searchParams.get('sourceId') || undefined,
    q: searchParams.get('q') || undefined,
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 12
  }), [searchParams])

  // Fetch articles
  const { articles, total, page, totalPages } = useMemo(
    () => articlesService.listAll(query),
    [query]
  )

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', String(newPage))
    setSearchParams(newParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-nb-ink mb-2">
            News Feed
          </h1>
          <p className="text-nb-ink/70">
            Browse all news articles with filters and sorting
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <FeedFilterBar showViewToggle={true} />
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-nb-ink/60">
            Showing {articles.length} of {total} articles
          </p>
          {query.q && (
            <p className="text-sm text-nb-ink/60">
              Search results for: <strong>"{query.q}"</strong>
            </p>
          )}
        </div>

        {/* Articles */}
        {articles.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <NewsTile
                      id={article.id}
                      headline={article.headline}
                      sourceName={article.sourceName}
                      publishedAt={article.publishedAt}
                      category={article.category}
                      snippet={article.body}
                      verdict={article.verdict}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {articles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                  >
                    <Link to={`/article/${article.id}`}>
                      <NBCard className="flex flex-col sm:flex-row gap-4 hover:-translate-y-0.5 hover:shadow-nb-sm transition-all cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 bg-nb-accent-2/20 rounded-full border border-nb-ink/20 font-medium">
                              {article.category}
                            </span>
                            <span className="text-xs text-nb-ink/50">
                              {timeAgo(article.publishedAt)}
                            </span>
                          </div>
                          <h3 className="font-display font-semibold text-lg mb-1 line-clamp-1">
                            {article.headline}
                          </h3>
                          <p className="text-sm text-nb-ink/60 line-clamp-2 mb-2">
                            {truncate(article.body, 200)}
                          </p>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-nb-ink/70">{article.sourceName}</span>
                            <VerdictBadge verdict={article.verdict} size="sm" />
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                          <Link
                            to={`/article/${article.id}/trail`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-nb-accent-2 hover:underline font-medium"
                          >
                            View Trail →
                          </Link>
                        </div>
                      </NBCard>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <NBButton
                  variant="ghost"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  icon={ArrowLeft}
                >
                  Previous
                </NBButton>
                <span className="text-sm text-nb-ink/70">
                  Page {page} of {totalPages}
                </span>
                <NBButton
                  variant="ghost"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </NBButton>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <NBCard className="text-center py-12">
            <Frown className="w-16 h-16 mx-auto text-nb-ink/30 mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">
              No articles found
            </h3>
            <p className="text-nb-ink/60 mb-6">
              Try adjusting your filters or search query
            </p>
            <NBButton
              variant="ghost"
              onClick={() => setSearchParams({})}
            >
              Clear all filters
            </NBButton>
          </NBCard>
        )}
      </div>
    </div>
  )
}

