import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  GitBranch,
  Shield,
  MessageSquare,
  Eye,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import NBCard from '../components/NBCard'
import NBButton from '../components/NBButton'
import NewsTile from '../components/NewsTile'
import VerdictBadge from '../components/VerdictBadge'
import { articlesService } from '../lib/services/articlesService'
import { cn, truncate, timeAgo } from '../lib/utils'

const steps = [
  {
    number: '01',
    title: 'Ingest',
    description: 'Articles from multiple sources are collected and normalized into our system.'
  },
  {
    number: '02',
    title: 'Build Trail Graph',
    description: 'We trace the story origin and map how it spreads across sources over time.'
  },
  {
    number: '03',
    title: 'Multi-Agent Check',
    description: 'Specialized AI agents cross-reference facts, sources, and official records.'
  },
  {
    number: '04',
    title: 'Veracity Badge',
    description: 'A transparent verdict is assigned with confidence levels and supporting evidence.'
  }
]

const features = [
  {
    icon: GitBranch,
    title: 'Node-based Origin Map',
    description: 'Visualize how a story propagates from its origin through amplifiers, debunkers, and commentators.'
  },
  {
    icon: Shield,
    title: 'Source Reputation',
    description: 'Each source is scored based on historical accuracy, corrections, and verification track record.'
  },
  {
    icon: MessageSquare,
    title: 'Chat-style Claim Checker',
    description: 'Interact with our agentic system like ChatGPT to verify any claim or article.'
  },
  {
    icon: Eye,
    title: 'Full Transparency',
    description: 'Every verdict includes the reasoning chain and links to supporting or contradicting sources.'
  }
]

const faqs = [
  {
    question: 'What is a trail?',
    answer: 'A trail is the path a story takes from its origin source through various outlets. We map this journey showing how information spreads, gets amplified, debunked, or commented on over time.'
  },
  {
    question: 'How is veracity decided?',
    answer: 'Our mock system simulates a multi-agent approach where specialized AI agents check against fact databases, official records, and source credibility. The final verdict combines these signals with confidence levels. (Demo only - no real verification is performed.)'
  },
  {
    question: 'Is this real-time?',
    answer: 'In this demo, all data is pre-seeded and static. A full implementation would continuously ingest new articles and update trails in near real-time.'
  },
  {
    question: 'Can I verify my own claims?',
    answer: 'Yes! Visit the Verify page to paste any text or URL. The demo will simulate the verification process with mock agents and return a sample verdict.'
  }
]

const NEWS_IMAGES = [
  '/news.jpeg',
  '/news2.webp',
  '/news3.avif'
]

const getRandomImage = (id) => {
  if (!id) return NEWS_IMAGES[0]
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % NEWS_IMAGES.length
  return NEWS_IMAGES[index]
}

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null)
  const [trendingArticles, setTrendingArticles] = useState([])
  const [liveExamples, setLiveExamples] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [trending, examples] = await Promise.all([
          articlesService.listTrending(6),
          articlesService.listTrending(3)
        ])
        setTrendingArticles(trending)
        setLiveExamples(examples)
      } catch (error) {
        console.error('Failed to fetch trending articles:', error)
        // Set empty arrays on error to prevent crashes
        setTrendingArticles([])
        setLiveExamples([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div
      className="min-h-screen bg-nb-bg"
      style={{
        backgroundImage: "url('/bg-img.svg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundColor: '#e3cab8'
      }}
    >
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden pt-32">
        {/* Design SVG overlay - black elements */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'url(/design.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'invert(1)'
          }}
        />

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="mb-8">
              <img
                src="/design.svg"
                alt=""
                className="mx-auto h-16 opacity-20 invert"
              />
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-nb-ink leading-[1.1] mb-8 tracking-tight">
              See how a story spreads{' '}
              <span className="italic font-normal">
                before
              </span>{' '}
              you trust it.
            </h1>
            <p className="text-xl sm:text-2xl text-nb-ink/90 mb-12 max-w-2xl mx-auto leading-relaxed font-normal">
              SatyaTrail maps news origins, tracks propagation patterns, and helps you verify claims
              with transparent, source-backed insights.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/feed" data-testid="cta-feed">
                <NBButton variant="primary" size="lg" icon={ArrowRight} className="bg-nb-ink text-nb-bg hover:bg-nb-ink/90 border-nb-ink shadow-none">
                  Browse the News Feed
                </NBButton>
              </Link>
              <Link to="/verify" data-testid="cta-verify">
                <NBButton variant="ghost" size="lg" icon={CheckCircle} className="border-2 border-nb-ink text-nb-ink hover:bg-nb-ink/5">
                  Verify a Claim
                </NBButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Newspaper-Style Main Content */}
      <section className="py-12 px-4 border-t border-b border-nb-ink/20">
        <div className="max-w-7xl mx-auto">
          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Article List */}
            <div className="lg:col-span-3 space-y-6">
              {isLoading ? (
                <div className="text-center py-8 text-nb-ink/70 italic">
                  Loading articles...
                </div>
              ) : trendingArticles.length === 0 ? (
                <div className="text-center py-8 text-nb-ink/70 italic">
                  No articles available yet
                </div>
              ) : (
                trendingArticles.slice(0, 3).map((article, index) => (
                  <div key={article.id} className={cn(index !== 2 && 'border-b border-nb-ink/20 pb-6')}>
                    <Link to={`/article/${article.id}`} className="block group">
                      <h3 className="font-display font-bold text-lg leading-tight mb-2 group-hover:text-nb-ink/70 transition-colors">
                        {article.headline}
                      </h3>
                      <p className="text-sm text-nb-ink/70 mb-3 line-clamp-2">
                        {truncate(article.body, 120)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-nb-ink/60">
                        <span className="font-medium">{article.sourceName}</span>
                        <span>{timeAgo(article.publishedAt)}</span>
                      </div>
                    </Link>
                  </div>
                ))
              )}

              {/* Newsletter Subscription */}
              <div className="mt-8 pt-6 border-t-2 border-nb-ink/30">
                <h4 className="font-display font-bold text-lg mb-3">Subscribe Our Newsletter</h4>
                <form className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 border border-nb-ink/30 bg-white/50 text-sm focus:outline-none focus:border-nb-ink"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-nb-ink text-nb-bg hover:bg-nb-ink/90 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Center Column - Main Story */}
            <div className="lg:col-span-6">
              {isLoading ? (
                <div className="bg-transparent border border-nb-ink/30 p-6 text-center">
                  <p className="text-nb-ink/70 italic">Loading main story...</p>
                </div>
              ) : trendingArticles.length === 0 ? (
                <div className="bg-transparent border border-nb-ink/30 p-6 text-center">
                  <p className="text-nb-ink/70 italic">No stories available yet. Verify a claim to get started!</p>
                </div>
              ) : (
                <div className="bg-transparent border border-nb-ink/30 p-6">
                  <div className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4">
                    MAIN STORY
                  </div>
                  {trendingArticles[0] && (
                    <Link to={`/article/${trendingArticles[0].id}`} className="block group">
                      <div className="mb-4 bg-nb-ink/10 h-64 flex items-center justify-center border border-nb-ink/20 overflow-hidden">
                        <img
                          src={getRandomImage(trendingArticles[0].id)}
                          alt={trendingArticles[0].headline}
                          className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                        />
                      </div>
                      <h2 className="font-display font-bold text-2xl lg:text-3xl leading-tight mb-4 group-hover:text-nb-ink/70 transition-colors">
                        {trendingArticles[0].headline}
                      </h2>
                      <p className="text-base text-nb-ink/80 mb-4 leading-relaxed">
                        {truncate(trendingArticles[0].body, 200)}
                      </p>
                      <div className="flex items-center justify-between text-sm text-nb-ink/60 border-t border-nb-ink/20 pt-4">
                        <div>
                          <span className="font-medium">By {trendingArticles[0].sourceName}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <VerdictBadge verdict={trendingArticles[0].verdict} size="sm" />
                          <span>{timeAgo(trendingArticles[0].publishedAt)}</span>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Trending Topics & More Articles */}
            <div className="lg:col-span-3 space-y-6">
              {/* Trending Topics */}
              <div className="border-b border-nb-ink/20 pb-6">
                <div className="mb-4">
                  <span className="text-red-600 font-bold text-sm uppercase tracking-wider">TRENDING TOPIC</span>
                  <span className="text-nb-ink/60 text-sm ml-2 italic">LATEST UPDATE</span>
                </div>
                <div className="space-y-4">
                  {isLoading ? (
                    <p className="text-xs text-nb-ink/60 italic">Loading...</p>
                  ) : trendingArticles.length === 0 ? (
                    <p className="text-xs text-nb-ink/60 italic">No trending topics yet</p>
                  ) : (
                    trendingArticles.slice(0, 5).map((article, index) => (
                      <Link key={article.id} to={`/article/${article.id}`} className="flex gap-3 group">
                        <span className="text-red-600 font-bold text-lg flex-shrink-0">#{index + 1}</span>
                        <h4 className="font-display font-semibold text-sm leading-tight group-hover:text-nb-ink/70 transition-colors">
                          {article.headline}
                        </h4>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* More Articles with Thumbnails */}
              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-xs text-nb-ink/60 italic">Loading...</p>
                ) : trendingArticles.length > 3 ? (
                  trendingArticles.slice(3, 6).map((article) => (
                    <Link key={article.id} to={`/article/${article.id}`} className="flex gap-3 group">
                      <div className="w-20 h-20 flex-shrink-0 bg-nb-ink/10 border border-nb-ink/20 flex items-center justify-center overflow-hidden">
                        <img
                          src={getRandomImage(article.id)}
                          alt={article.headline}
                          className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-display font-semibold text-sm leading-tight mb-1 group-hover:text-nb-ink/70 transition-colors line-clamp-2">
                          {article.headline}
                        </h4>
                        <p className="text-xs text-nb-ink/60 italic">{timeAgo(article.publishedAt)}</p>
                      </div>
                    </Link>
                  ))
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Newspaper Style */}
      <section className="py-16 px-4 border-t border-b border-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider mb-4">
              HOW IT WORKS
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-black mb-4">
              How SatyaTrail Works
            </h2>
            <p className="text-sm text-black/80 max-w-2xl mx-auto">
              Our four-step process ensures accurate verification and transparent reporting
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="bg-transparent border border-black/30 p-6 text-center rounded-lg"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-black text-white flex items-center justify-center font-display font-bold text-lg rounded-lg">
                  {step.number}
                </div>
                <h3 className="font-display font-bold text-xl mb-3 text-black">{step.title}</h3>
                <p className="text-black/80 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights - Newspaper Style */}
      <section className="py-16 px-4 border-t border-b border-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider mb-4 rounded">
              FEATURES
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-black">
              Feature Highlights
            </h2>
            <p className="text-sm text-black/80 max-w-2xl mx-auto">
              Powerful tools to help you navigate the news landscape with confidence
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-transparent border border-black/30 p-6 flex gap-4 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-lg">
                    <feature.icon className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl mb-2 text-black">{feature.title}</h3>
                  <p className="text-black/80 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Examples - Newspaper Style */}
      <section className="py-16 px-4 border-t border-b border-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider mb-4">
              LIVE EXAMPLES
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-black mb-4">
              Live Examples
            </h2>
            <p className="text-sm text-black/80 max-w-2xl mx-auto">
              See how SatyaTrail evaluates real stories with mock verdicts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-8 text-black/70 italic">
                Loading examples...
              </div>
            ) : liveExamples.length === 0 ? (
              <div className="col-span-full text-center py-8 text-black/70 italic">
                No examples available yet. Verify a claim to see it here!
              </div>
            ) : (
              liveExamples.map((article) => (
                <div key={article.id} className="bg-transparent border border-black/30 p-6 flex flex-col rounded-lg">
                  <h4 className="font-display font-bold text-lg line-clamp-2 leading-tight mb-3 text-black">
                    {article.headline}
                  </h4>
                  <p className="text-xs text-black/70 uppercase tracking-wide mb-4 font-semibold">{article.sourceName}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/20">
                    <VerdictBadge verdict={article.verdict} showConfidence confidence={article.confidence} size="sm" />
                    <Link
                      to={`/article/${article.id}`}
                      className="text-xs font-bold text-black hover:underline uppercase tracking-wide"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section - Newspaper Style */}
      <section className="py-16 px-4 border-t border-black/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider mb-4">
              ANSWERS FOR YOUR QUESTIONS
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-black mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-black/80">
              Find answers to common questions about SatyaTrail
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-black/30 overflow-hidden bg-transparent rounded-lg"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-black/5 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="font-display font-bold text-sm text-black">
                      {faq.question}
                    </span>
                  </div>
                  {openFaq === index ? (
                    <ChevronUp className="h-4 w-4 text-black/60" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-black/60" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5">
                    <div className="pl-9">
                      <p className="text-black/80 text-xs leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Newspaper Style */}
      <section className="py-16 px-4 border-t border-b border-nb-ink/20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-nb-ink rounded-lg p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <img
                src="/design.svg"
                alt="Background Design"
                className="w-full h-full object-cover"
                style={{ filter: 'invert(1)' }}
              />
            </div>
            <div className="relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-center">
                <div className="lg:col-span-3 text-center lg:text-left">
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-nb-bg mb-3">
                    Ready to explore the{' '}
                    <span className="italic font-normal">news trail</span>?
                  </h2>
                  <p className="text-sm text-nb-bg/80 leading-relaxed">
                    Start browsing verified stories or check your own claims with our demo.
                  </p>
                </div>
                <div className="lg:col-span-1 flex justify-center lg:justify-end">
                  <Link to="/feed">
                    <button className="bg-white hover:bg-gray-100 text-nb-ink px-6 lg:px-8 py-3 rounded-full text-sm lg:text-base font-medium transition-colors inline-flex items-center justify-center shadow-lg hover:shadow-xl whitespace-nowrap">
                      Get Started
                      <ArrowRight className="h-4 lg:h-5 w-4 lg:w-5 ml-2" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

