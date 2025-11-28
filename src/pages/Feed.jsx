import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Frown, ArrowLeft, ArrowRight, Loader2, RefreshCw } from 'lucide-react'
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

  // State
  const [articles, setArticles] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Parse query params
  const query = useMemo(() => ({
    category: searchParams.get('category') || undefined,
    verdict: searchParams.get('verdict') || undefined,
    sourceId: searchParams.get('sourceId') || undefined,
    q: searchParams.get('q') || undefined,
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 12
  }), [searchParams])

  // Fetch articles from backend
  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await articlesService.listAll(query)
        setArticles(result.articles)
        setTotal(result.total)
        setTotalPages(result.totalPages)
      } catch (err) {
        console.error('Failed to fetch articles:', err)
        setError('Failed to load articles. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticles()
  }, [query])

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', String(newPage))
    setSearchParams(newParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    await articlesService.refreshCache()
    const result = await articlesService.listAll(query)
    setArticles(result.articles)
    setTotal(result.total)
    setTotalPages(result.totalPages)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-nb-ink mb-2">
              Verified News Feed
            </h1>
            <p className="text-nb-ink/70">
              Browse verified news and fact-checks from our AI agents
            </p>
          </div>
          <NBButton
            variant="ghost"
            onClick={handleRefresh}
            disabled={isLoading}
            icon={RefreshCw}
          >
            Refresh
          </NBButton>
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <FeedFilterBar showViewToggle={true} />
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-nb-ink/60">
            {isLoading ? 'Loading...' : `Showing ${articles.length} of ${total} verifications`}
          </p>
          {query.q && (
            <p className="text-sm text-nb-ink/60">
              Search results for: <strong>"{query.q}"</strong>
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-nb-ink/50" />
            <span className="ml-3 text-nb-ink/60">Loading verifications...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <NBCard className="text-center py-12">
            <p className="text-nb-red font-medium mb-4">{error}</p>
            <NBButton variant="primary" onClick={handleRefresh}>
              Try Again
            </NBButton>
          </NBCard>
        )}

        {/* Articles */}
        {!isLoading && !error && articles.length > 0 && (
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
                              {article.category || 'Verification'}
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
                  onClick={() => handlePageChange(query.page - 1)}
                  disabled={query.page <= 1}
                  icon={ArrowLeft}
                >
                  Previous
                </NBButton>
                <span className="text-sm text-nb-ink/70">
                  Page {query.page} of {totalPages}
                </span>
                <NBButton
                  variant="ghost"
                  onClick={() => handlePageChange(query.page + 1)}
                  disabled={query.page >= totalPages}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </NBButton>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !error && articles.length === 0 && (
          <NBCard className="text-center py-12">
            <Frown className="w-16 h-16 mx-auto text-nb-ink/30 mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">
              No verifications found
            </h3>
            <p className="text-nb-ink/60 mb-6">
              {total === 0
                ? 'No verifications yet. Submit a claim to get started!'
                : 'Try adjusting your filters or search query'}
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/verify">
                <NBButton variant="primary">
                  Verify Something
                </NBButton>
              </Link>
              {(query.category || query.verdict || query.q) && (
                <NBButton
                  variant="ghost"
                  onClick={() => setSearchParams({})}
                >
                  Clear all filters
                </NBButton>
              )}
            </div>
          </NBCard>
        )}
      </div>
    </div>
  )
}
