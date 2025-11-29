import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  User,
  Share2,
  ExternalLink,
  CheckCircle,
  GitBranch,
  Loader2
} from 'lucide-react'
import NBCard from '../components/NBCard'
import NBButton from '../components/NBButton'
import VerdictBadge from '../components/VerdictBadge'
import TrailSummaryCard from '../components/TrailSummaryCard'
import SourceReputationBadge from '../components/SourceReputationBadge'
import NewsTile from '../components/NewsTile'
import { articlesService } from '../lib/services/articlesService'
import { nodesService } from '../lib/services/nodesService'
import { sourcesService } from '../lib/services/sourcesService'
import { formatDate, formatDateTime, cn, truncate } from '../lib/utils'

export default function ArticleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [article, setArticle] = useState(null)
  const [source, setSource] = useState(null)
  const [trail, setTrail] = useState(null)
  const [relatedArticles, setRelatedArticles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch article data
  useEffect(() => {
    const fetchArticleData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch article
        const articleData = await articlesService.getById(id)
        if (!articleData) {
          setError('Article not found')
          setIsLoading(false)
          return
        }
        setArticle(articleData)

        // Fetch source
        if (articleData.sourceId) {
          const sourceData = sourcesService.getById(articleData.sourceId)
          setSource(sourceData)
        }

        // Fetch trail
        const trailData = nodesService.getTrailByArticleId(id)
        setTrail(trailData)

        // Fetch related articles
        if (articleData.category) {
          const { articles } = await articlesService.listAll({ 
            category: articleData.category.toLowerCase(), 
            limit: 4 
          })
          const related = articles.filter(a => a.id !== id).slice(0, 3)
          setRelatedArticles(related)
        }
      } catch (err) {
        console.error('Failed to fetch article data:', err)
        setError('Failed to load article. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticleData()
  }, [id])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-nb-ink/50" />
            <span className="ml-3 text-nb-ink/60 italic">Loading article...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !article) {
    return (
      <div className="min-h-screen pt-28 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-transparent border border-nb-ink/30 p-12 text-center rounded-lg">
            <h2 className="font-display text-2xl font-bold mb-4 text-black">Article Not Found</h2>
            <p className="text-nb-ink/70 mb-6 italic">
              {error || "The article you're looking for doesn't exist or has been removed."}
            </p>
            <Link to="/feed">
              <button className="px-6 py-2 border border-nb-ink/30 bg-black text-white hover:bg-black/90 transition-colors uppercase tracking-wide text-sm font-bold rounded-lg">
                Back to Feed
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Newspaper-Style Header */}
        <div className="mb-8 border-b border-nb-ink/20 pb-6">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <span className="inline-block bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider mb-3 rounded">
                ARTICLE DETAIL
              </span>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-nb-ink mb-2">
                {article.headline}
              </h1>
              <p className="text-sm text-nb-ink/70 italic">
                {article.sourceName} • {formatDateTime(article.publishedAt)}
              </p>
            </div>
            <div className="flex-shrink-0 pt-8">
              <VerdictBadge 
                verdict={article.verdict} 
                confidence={article.confidence} 
                showConfidence
                size="lg"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-transparent border border-nb-ink/30 p-6 lg:p-8 rounded-lg">
                {/* Category & Verdict */}
                <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                  {article.category && (
                    <span className="px-3 py-1 bg-red-600 text-white font-bold uppercase tracking-wider text-xs rounded">
                      {article.category}
                    </span>
                  )}
                </div>

                {/* Subheadline */}
                {article.subheadline && (
                  <p className="text-lg text-nb-ink/80 mb-6 italic">
                    {article.subheadline}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-nb-ink/20">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center border border-nb-ink/30">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{article.author || article.sourceName}</p>
                      <p className="text-nb-ink/60 text-xs">{article.sourceName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-nb-ink/60">
                    <Calendar className="w-4 h-4" />
                    {formatDateTime(article.publishedAt)}
                  </div>
                  <button 
                    className="ml-auto p-2 rounded-lg border border-nb-ink/30 hover:bg-nb-ink/5 transition-colors"
                    title="Share (demo)"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Article Body */}
                <div className="mt-6 prose prose-lg max-w-none">
                  {article.body ? (
                    article.body.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-nb-ink/90 leading-relaxed">
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="mb-4 text-nb-ink/80 leading-relaxed italic">
                      No content available for this article.
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-8 pt-6 border-t border-nb-ink/20 flex flex-wrap gap-4">
                  <Link to={`/article/${id}/trail`}>
                    <button className="px-6 py-2 border border-nb-ink/30 bg-black text-white hover:bg-black/90 transition-colors uppercase tracking-wide text-sm font-bold rounded-lg inline-flex items-center gap-2">
                      <GitBranch className="w-4 h-4" />
                      View Full Trail Graph
                    </button>
                  </Link>
                  <Link to={`/verify?articleId=${id}`}>
                    <button className="px-6 py-2 border border-nb-ink/30 bg-white/60 text-nb-ink hover:bg-nb-ink hover:text-white transition-colors uppercase tracking-wide text-sm font-bold rounded-lg inline-flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Open in Verify
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Trail Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <TrailSummaryCard
                originSource={trail?.trailNodes?.[0]?.source?.name || article.sourceName}
                hops={trail?.trailEdges?.length || 0}
                sourcesCount={trail?.trailNodes?.length || 1}
                firstSeenAt={trail?.node?.originPublishedAt || article.publishedAt}
                lastUpdatedAt={trail?.trailNodes?.[trail.trailNodes.length - 1]?.time || article.publishedAt}
                articleId={id}
              />
            </motion.div>

            {/* Source Reputation */}
            {source && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="bg-transparent border border-nb-ink/30 p-6 rounded-lg">
                  <h4 className="font-display font-bold text-lg mb-3 text-black">
                    Source Reputation
                  </h4>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center border border-nb-ink/30">
                      <span className="font-bold text-sm text-black">
                        {source.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-black">{source.name}</p>
                      <p className="text-sm text-nb-ink/60">{source.domain}</p>
                    </div>
                  </div>
                  <SourceReputationBadge 
                    score={source.reputationScore} 
                    label={source.type === 'official' ? 'Official' : source.type === 'fact_checker' ? 'Fact Checker' : 'News'}
                  />
                  <p className="mt-3 text-sm text-nb-ink/70">
                    Based on historical accuracy, corrections record, and verification track record.
                  </p>
                </div>
              </motion.div>
            )}
          </aside>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-12 border-t border-nb-ink/20 pt-8">
            <div className="mb-6">
              <span className="inline-block bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider mb-4 rounded">
                RELATED ARTICLES
              </span>
              <h2 className="font-display text-2xl font-bold text-black">Related Articles</h2>
            </div>
            <div className="flex flex-col md:flex-row">
              {relatedArticles.map((related, index) => (
                <Link
                  key={related.id}
                  to={`/article/${related.id}`}
                  className={cn(
                    "flex-1 p-6 flex flex-col",
                    index !== relatedArticles.length - 1 && "md:border-r border-nb-ink/30"
                  )}
                >
                  {/* Category Header */}
                  {related.category && (
                    <h4 className="font-display font-bold text-base mb-3 text-black" style={{ color: '#8B4513' }}>
                      {related.category}
                    </h4>
                  )}
                  
                  {/* Headline */}
                  <h3 className="font-display font-bold text-lg leading-tight mb-4 text-black">
                    {related.headline}
                  </h3>
                  
                  {/* Body/Snippet */}
                  {related.body && (
                    <p className="text-sm text-nb-ink/90 mb-4 leading-relaxed flex-grow">
                      {truncate(related.body, 120)}
                    </p>
                  )}
                  
                  {/* Author/Source, Verdict and Date */}
                  <div className="mt-auto pt-4 border-t border-nb-ink/20">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-black">
                        {related.sourceName}
                      </p>
                      <VerdictBadge verdict={related.verdict} size="sm" />
                    </div>
                    <p className="text-xs text-nb-ink/70">
                      {formatDate(related.publishedAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

