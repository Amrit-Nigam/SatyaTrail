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
        console.log('Feed: Fetched articles:', result) // Debug log
        setArticles(result.articles || [])
        setTotal(result.total || 0)
        setTotalPages(result.totalPages || 0)
      } catch (err) {
        console.error('Failed to fetch articles:', err)
        setError('Failed to load articles. Please try again.')
        // Set empty arrays on error to prevent crashes
        setArticles([])
        setTotal(0)
        setTotalPages(0)
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
    setError(null)
    try {
      await articlesService.refreshCache()
      const result = await articlesService.listAll(query)
      console.log('Feed: Refreshed articles:', result) // Debug log
      setArticles(result.articles || [])
      setTotal(result.total || 0)
      setTotalPages(result.totalPages || 0)
    } catch (err) {
      console.error('Failed to refresh articles:', err)
      setError('Failed to refresh articles. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Newspaper-Style Header */}
        <div className="mb-8 border-b border-nb-ink/20 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <span className="inline-block bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider mb-3 rounded">
                NEWS FEED
              </span>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-nb-ink mb-2">
                Latest <span className="italic font-normal">Stories</span>
              </h1>
              <p className="text-sm text-nb-ink/70 italic">
                Browse verified news and fact-checks from our AI agents
              </p>
            </div>
            <div className="flex items-center gap-3">
              {query.q && (
                <div className="text-right">
                  <p className="text-xs text-nb-ink/60 mb-1">Search Results</p>
                  <p className="text-sm font-display font-semibold italic">"{query.q}"</p>
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 border border-nb-ink/30 bg-white/60 text-nb-ink hover:bg-nb-ink hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium uppercase tracking-wide rounded-lg"
              >
                <RefreshCw className={cn("w-4 h-4 inline mr-2", isLoading && "animate-spin")} />
                Refresh
              </button>
            </div>
          </div>
          {/* Filter Bar */}
          <div className="mt-4">
            <FeedFilterBar showViewToggle={true} />
          </div>
          {/* Results Count */}
          <div className="mt-4 flex items-center justify-between text-xs text-nb-ink/60 border-t border-nb-ink/20 pt-3">
            <p>
              {isLoading ? (
                <span className="italic">Loading...</span>
              ) : (
                <>
                  Showing <span className="font-semibold">{articles.length}</span> of <span className="font-semibold">{total}</span> articles
                </>
              )}
            </p>
            <p className="uppercase tracking-wide">Page {query.page} of {totalPages}</p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-nb-ink/50" />
            <span className="ml-3 text-nb-ink/60 italic">Loading articles...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-transparent border border-nb-ink/30 p-12 text-center rounded-lg">
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-2 border border-nb-ink/30 bg-white/60 text-nb-ink hover:bg-nb-ink hover:text-white transition-colors uppercase tracking-wide text-sm font-medium rounded-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Articles - Newspaper Layout */}
        {!isLoading && !error && articles.length > 0 && (
          <>
            {viewMode === 'grid' ? (
              /* Three Column Newspaper Grid */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-3 space-y-6">
                  {articles.slice(0, Math.ceil(articles.length / 3)).map((article, index) => (
                    <div key={article.id} className={cn(index !== Math.ceil(articles.length / 3) - 1 && 'border-b border-nb-ink/20 pb-6')}>
                      <Link to={`/article/${article.id}`} className="block group">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-0.5 bg-red-600 text-white font-bold uppercase tracking-wider rounded">
                            {article.category || 'Verification'}
                          </span>
                          <span className="text-xs text-nb-ink/60 italic">{timeAgo(article.publishedAt)}</span>
                        </div>
                        <h3 className="font-display font-bold text-base leading-tight mb-2 group-hover:text-nb-ink/70 transition-colors">
                          {article.headline}
                        </h3>
                        <p className="text-xs text-nb-ink/70 mb-3 line-clamp-2 leading-relaxed">
                          {truncate(article.body, 120)}
                        </p>
                        <div className="flex items-center justify-between text-xs text-nb-ink/60">
                          <span className="font-medium">{article.sourceName}</span>
                          <VerdictBadge verdict={article.verdict} size="sm" />
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>

                {/* Center Column - Main Stories */}
                <div className="lg:col-span-6 space-y-6">
                  {articles.slice(Math.ceil(articles.length / 3), Math.ceil(articles.length * 2 / 3)).map((article, index) => (
                    <div key={article.id} className={cn('bg-transparent border border-nb-ink/30 p-6 rounded-lg', index === 0 && 'border-2')}>
                      <Link to={`/article/${article.id}`} className="block group">
                        {index === 0 && (
                          <div className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4 rounded">
                            FEATURED
                          </div>
                        )}
                        <div className="mb-4 bg-nb-ink/10 h-48 flex items-center justify-center border border-nb-ink/20 rounded-lg">
                          <span className="text-nb-ink/40 text-xs">Article Image</span>
                        </div>
                        <h2 className={cn(
                          "font-display font-bold leading-tight mb-3 group-hover:text-nb-ink/70 transition-colors",
                          index === 0 ? "text-2xl" : "text-xl"
                        )}>
                          {index === 0 ? (
                            <>
                              {article.headline.split(' ').slice(0, -2).join(' ')}{' '}
                              <span className="italic font-normal">
                                {article.headline.split(' ').slice(-2).join(' ')}
                              </span>
                            </>
                          ) : (
                            article.headline
                          )}
                        </h2>
                        <p className="text-sm text-nb-ink/80 mb-4 leading-relaxed line-clamp-3">
                          {truncate(article.body, index === 0 ? 250 : 150)}
                        </p>
                        <div className="flex items-center justify-between text-xs text-nb-ink/60 border-t border-nb-ink/20 pt-4">
                          <div>
                            <span className="font-medium">By {article.sourceName}</span>
                            <span className="mx-2">•</span>
                            <span className="italic">{timeAgo(article.publishedAt)}</span>
                          </div>
                          <VerdictBadge verdict={article.verdict} size="sm" />
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Trending Section */}
                  <div className="border-b border-nb-ink/20 pb-6">
                    <div className="mb-4">
                      <span className="text-red-600 font-bold text-sm uppercase tracking-wider">TRENDING</span>
                      <span className="text-nb-ink/60 text-xs ml-2 italic">Latest Updates</span>
                    </div>
                    <div className="space-y-4">
                      {articles.slice(Math.ceil(articles.length * 2 / 3)).map((article, index) => (
                        <Link key={article.id} to={`/article/${article.id}`} className="flex gap-3 group">
                          <span className="text-red-600 font-bold text-lg flex-shrink-0">#{index + 1}</span>
                          <h4 className="font-display font-semibold text-sm leading-tight group-hover:text-nb-ink/70 transition-colors">
                            {article.headline}
                          </h4>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* More Articles with Thumbnails */}
                  <div className="space-y-4">
                    {articles.slice(0, 3).map((article) => (
                      <Link key={article.id} to={`/article/${article.id}`} className="flex gap-3 group">
                        <div className="w-20 h-20 flex-shrink-0 bg-nb-ink/10 border border-nb-ink/20 flex items-center justify-center rounded-lg">
                          <span className="text-nb-ink/30 text-xs">IMG</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-display font-semibold text-sm leading-tight mb-1 group-hover:text-nb-ink/70 transition-colors line-clamp-2">
                            {article.headline}
                          </h4>
                          <p className="text-xs text-nb-ink/60 italic">{timeAgo(article.publishedAt)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* List View - Newspaper Style */
              <div className="space-y-4">
                {articles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                  >
                    <Link to={`/article/${article.id}`}>
                      <div className="bg-transparent border border-nb-ink/30 p-6 hover:border-nb-ink/50 transition-all cursor-pointer rounded-lg">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-xs px-2 py-0.5 bg-red-600 text-white font-bold uppercase tracking-wider rounded">
                                {article.category || 'Verification'}
                              </span>
                              <span className="text-xs text-nb-ink/60 italic">
                                {timeAgo(article.publishedAt)}
                              </span>
                            </div>
                            <h3 className="font-display font-bold text-xl mb-2 line-clamp-2 leading-tight">
                              {article.headline}
                            </h3>
                            <p className="text-sm text-nb-ink/70 line-clamp-2 mb-3 leading-relaxed">
                              {truncate(article.body, 200)}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-nb-ink/60 border-t border-nb-ink/20 pt-3">
                              <span className="font-medium">{article.sourceName}</span>
                              <span>•</span>
                              <VerdictBadge verdict={article.verdict} size="sm" />
                            </div>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                            <Link
                              to={`/article/${article.id}/trail`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-nb-ink hover:underline font-medium uppercase tracking-wide"
                            >
                              View Trail →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination - Newspaper Style */}
            {totalPages > 1 && (
              <div className="mt-12 pt-8 border-t border-nb-ink/30 flex items-center justify-center gap-6">
                <button
                  onClick={() => handlePageChange(query.page - 1)}
                  disabled={query.page <= 1}
                  className={cn(
                    "px-4 py-2 border border-nb-ink/30 bg-white/60 text-nb-ink text-sm font-medium transition-colors uppercase tracking-wide rounded-lg",
                    query.page <= 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-nb-ink hover:text-white"
                  )}
                >
                  <ArrowLeft className="w-4 h-4 inline mr-2" />
                  Previous
                </button>
                <span className="text-sm text-nb-ink/70 font-display italic">
                  Page {query.page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(query.page + 1)}
                  disabled={query.page >= totalPages}
                  className={cn(
                    "px-4 py-2 border border-nb-ink/30 bg-white/60 text-nb-ink text-sm font-medium transition-colors uppercase tracking-wide rounded-lg",
                    query.page >= totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-nb-ink hover:text-white"
                  )}
                >
                  Next
                  <ArrowRight className="w-4 h-4 inline ml-2" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State - Newspaper Style */}
        {!isLoading && !error && articles.length === 0 && (
          <div className="bg-transparent border border-nb-ink/30 p-12 text-center rounded-lg">
            <Frown className="w-16 h-16 mx-auto text-nb-ink/30 mb-4" />
            <h3 className="font-display text-2xl font-bold mb-2">
              No articles found
            </h3>
            <p className="text-nb-ink/60 mb-6 italic">
              {total === 0
                ? 'No verifications yet. Submit a claim to get started!'
                : 'Try adjusting your filters or search query'}
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/verify">
                <button className="px-6 py-2 border border-nb-ink/30 bg-nb-ink text-white hover:bg-nb-ink/90 transition-colors uppercase tracking-wide text-sm font-medium rounded-lg">
                  Verify Something
                </button>
              </Link>
              {(query.category || query.verdict || query.q) && (
                <button
                  onClick={() => setSearchParams({})}
                  className="px-6 py-2 border border-nb-ink/30 bg-white/60 text-nb-ink hover:bg-nb-ink hover:text-white transition-colors uppercase tracking-wide text-sm font-medium rounded-lg"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
