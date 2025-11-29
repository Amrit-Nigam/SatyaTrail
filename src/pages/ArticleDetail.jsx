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
import { formatDate, formatDateTime } from '../lib/utils'

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
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <NBCard className="text-center py-12">
            <h2 className="font-display text-2xl font-bold mb-4">Article Not Found</h2>
            <p className="text-nb-ink/60 mb-6">
              {error || "The article you're looking for doesn't exist or has been removed."}
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
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-nb-ink/60 flex-wrap">
          <Link to="/" className="hover:text-nb-ink transition-colors">Home</Link>
          <span>→</span>
          <Link to="/feed" className="hover:text-nb-ink transition-colors">Feed</Link>
          {article.category && (
            <>
              <span>→</span>
              <Link 
                to={`/feed?category=${article.category.toLowerCase()}`}
                className="hover:text-nb-ink transition-colors"
              >
                {article.category}
              </Link>
            </>
          )}
          <span>→</span>
          <span className="text-nb-ink font-medium truncate max-w-xs">
            {article.headline}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <NBCard className="p-6 lg:p-8">
                {/* Category & Verdict */}
                <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                  {article.category && (
                    <span className="px-3 py-1 bg-nb-accent-2/20 rounded-full border border-nb-ink/20 font-medium text-sm">
                      {article.category}
                    </span>
                  )}
                  <VerdictBadge 
                    verdict={article.verdict} 
                    confidence={article.confidence} 
                    showConfidence
                  />
                </div>

                {/* Headline */}
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-nb-ink mb-3 leading-tight">
                  {article.headline}
                </h1>

                {/* Subheadline */}
                <p className="text-lg text-nb-ink/70 mb-6">
                  {article.subheadline}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 pb-6 border-b-2 border-nb-ink/10">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 bg-nb-accent/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">{article.author}</p>
                      <p className="text-nb-ink/60">{article.sourceName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-nb-ink/60">
                    <Calendar className="w-4 h-4" />
                    {formatDateTime(article.publishedAt)}
                  </div>
                  <button 
                    className="ml-auto p-2 rounded-nb border-2 border-nb-ink hover:bg-nb-ink/5 transition-colors"
                    title="Share (demo)"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Article Body */}
                <div className="mt-6 prose prose-lg max-w-none">
                  {article.body ? (
                    article.body.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-nb-ink/80 leading-relaxed">
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
                <div className="mt-8 pt-6 border-t-2 border-nb-ink/10 flex flex-wrap gap-4">
                  <Link to={`/article/${id}/trail`}>
                    <NBButton variant="primary" icon={GitBranch} data-testid="cta-open-graph">
                      View Full Trail Graph
                    </NBButton>
                  </Link>
                  <Link to={`/verify?articleId=${id}`}>
                    <NBButton variant="secondary" icon={CheckCircle}>
                      Open in Verify
                    </NBButton>
                  </Link>
                </div>
              </NBCard>
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
                <NBCard>
                  <h4 className="font-display font-semibold text-lg mb-3">
                    Source Reputation
                  </h4>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-nb-accent-2/20 rounded-full flex items-center justify-center border-2 border-nb-ink">
                      <span className="font-bold text-sm">
                        {source.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{source.name}</p>
                      <p className="text-sm text-nb-ink/60">{source.domain}</p>
                    </div>
                  </div>
                  <SourceReputationBadge 
                    score={source.reputationScore} 
                    label={source.type === 'official' ? 'Official' : source.type === 'fact_checker' ? 'Fact Checker' : 'News'}
                  />
                  <p className="mt-3 text-sm text-nb-ink/60">
                    Based on historical accuracy, corrections record, and verification track record.
                  </p>
                </NBCard>
              </motion.div>
            )}
          </aside>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((related, index) => (
                <motion.div
                  key={related.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                >
                  <NewsTile
                    id={related.id}
                    headline={related.headline}
                    sourceName={related.sourceName}
                    publishedAt={related.publishedAt}
                    category={related.category}
                    snippet={related.body}
                    verdict={related.verdict}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

