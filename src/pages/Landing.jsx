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
import { cn } from '../lib/utils'

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-nb-accent rounded-full" />
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-nb-accent-2 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-nb-warn rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-nb-ink leading-tight mb-6">
              See how a story spreads{' '}
              <span className="text-nb-accent underline decoration-4 decoration-nb-ink underline-offset-4">
                before
              </span>{' '}
              you trust it.
            </h1>
            <p className="text-lg sm:text-xl text-nb-ink/70 mb-8 max-w-2xl mx-auto">
              SatyaTrail maps news origins, tracks propagation patterns, and helps you verify claims
              with transparent, source-backed insights.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/feed" data-testid="cta-feed">
                <NBButton variant="primary" size="lg" icon={ArrowRight}>
                  Browse the News Feed
                </NBButton>
              </Link>
              <Link to="/verify" data-testid="cta-verify">
                <NBButton variant="secondary" size="lg" icon={CheckCircle}>
                  Verify a Claim
                </NBButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trending News Grid */}
      <section className="py-16 px-4 bg-nb-card border-y-2 border-nb-ink">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-nb-ink">
              Trending Stories
            </h2>
            <Link
              to="/feed"
              className="flex items-center gap-2 text-nb-ink/70 hover:text-nb-ink transition-colors font-medium"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-8 text-nb-ink/70">
                Loading trending stories...
              </div>
            ) : trendingArticles.length === 0 ? (
              <div className="col-span-full text-center py-8 text-nb-ink/70">
                No trending stories available yet. Verify a claim to get started!
              </div>
            ) : (
              trendingArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
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
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-nb-ink text-center mb-12">
            How SatyaTrail Works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <NBCard className="h-full text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-nb-accent rounded-nb border-2 border-nb-ink flex items-center justify-center font-display font-bold text-lg">
                    {step.number}
                  </div>
                  <h3 className="font-display font-semibold text-xl mb-2">{step.title}</h3>
                  <p className="text-nb-ink/70 text-sm">{step.description}</p>
                </NBCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-16 px-4 bg-nb-ink text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-12">
            Feature Highlights
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="flex gap-4 p-6 bg-white/10 rounded-nb border-2 border-white/20"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-nb-accent rounded-nb border-2 border-white flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-nb-ink" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg mb-1">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Examples Strip */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-nb-ink text-center mb-4">
            Live Examples
          </h2>
          <p className="text-center text-nb-ink/70 mb-8 max-w-xl mx-auto">
            See how SatyaTrail evaluates real stories with mock verdicts
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-8 text-nb-ink/70">
                Loading examples...
              </div>
            ) : liveExamples.length === 0 ? (
              <div className="col-span-full text-center py-8 text-nb-ink/70">
                No examples available yet. Verify a claim to see it here!
              </div>
            ) : (
              liveExamples.map((article) => (
                <NBCard key={article.id} className="flex flex-col gap-3">
                  <h4 className="font-display font-semibold line-clamp-2">
                    {article.headline}
                  </h4>
                  <p className="text-sm text-nb-ink/60">{article.sourceName}</p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-nb-ink/10">
                    <VerdictBadge verdict={article.verdict} showConfidence confidence={article.confidence} size="sm" />
                    <Link
                      to={`/article/${article.id}`}
                      className="text-sm font-medium text-nb-accent-2 hover:underline"
                    >
                      View →
                    </Link>
                  </div>
                </NBCard>
              ))
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-nb-card border-t-2 border-nb-ink">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-nb-ink text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <NBCard
                key={index}
                className={cn(
                  'cursor-pointer transition-shadow',
                  openFaq === index && 'shadow-nb-sm'
                )}
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-display font-semibold text-lg">{faq.question}</h3>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 flex-shrink-0" />
                  )}
                </div>
                {openFaq === index && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 text-nb-ink/70 border-t border-nb-ink/10 pt-4"
                  >
                    {faq.answer}
                  </motion.p>
                )}
              </NBCard>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-nb-accent border-t-2 border-nb-ink">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-nb-ink mb-4">
            Ready to explore the news trail?
          </h2>
          <p className="text-nb-ink/70 mb-8">
            Start browsing verified stories or check your own claims with our demo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/feed">
              <NBButton variant="primary" size="lg" className="bg-nb-ink text-white hover:bg-nb-ink/90">
                Browse Feed
              </NBButton>
            </Link>
            <Link to="/verify">
              <NBButton variant="ghost" size="lg" className="border-nb-ink text-nb-ink">
                Try Verify
              </NBButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

