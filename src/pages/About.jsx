import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Download,
  Network,
  Bot,
  Shield,
  Anchor,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle,
  GitBranch
} from 'lucide-react'
import NBCard from '../components/NBCard'
import NBButton from '../components/NBButton'
import VerdictBadge from '../components/VerdictBadge'

const pipelineSteps = [
  {
    icon: Download,
    title: 'Ingestion',
    description: 'Articles from multiple news sources, social media, and official channels are continuously collected and normalized into a unified format.',
    details: 'Our ingestion pipeline processes content from RSS feeds, APIs, and web scraping. Each article is tagged with metadata including source reputation, publication time, and content fingerprints.'
  },
  {
    icon: Network,
    title: 'Clustering',
    description: 'Related articles about the same event or claim are grouped into NewsNodes using semantic similarity and entity extraction.',
    details: 'Natural language processing identifies key entities, claims, and relationships. Articles covering the same story are clustered together, creating a comprehensive view of how information spreads.'
  },
  {
    icon: Bot,
    title: 'Agent Reasoning',
    description: 'Specialized AI agents analyze each cluster: Source Agent checks credibility, Factbase Agent cross-references claims, and Orchestrator synthesizes findings.',
    details: 'Multiple agents work in parallel, each with expertise in different aspects of verification. Their findings are aggregated and weighted based on confidence levels.'
  },
  {
    icon: Shield,
    title: 'Reputation',
    description: 'Each source is scored based on historical accuracy, correction frequency, editorial standards, and track record.',
    details: 'Reputation scores are dynamically updated based on new information. Sources that consistently publish accurate information build higher scores, while those with corrections or retractions see adjustments.'
  },
  {
    icon: Anchor,
    title: 'Trail Anchoring',
    description: 'The verification trail is recorded, creating an immutable record of how conclusions were reached.',
    details: 'In a full implementation, this would use blockchain technology to ensure transparency and prevent tampering. Currently this is simulated for demonstration purposes.'
  }
]

const verdictExplanations = [
  {
    verdict: 'likely_true',
    title: 'Likely True',
    description: 'High confidence that the claim is accurate based on multiple corroborating sources, official records, and expert consensus.'
  },
  {
    verdict: 'likely_false',
    title: 'Likely False',
    description: 'High confidence that the claim is inaccurate or misleading. Contradicted by official sources, debunked by fact-checkers, or based on fabricated evidence.'
  },
  {
    verdict: 'mixed',
    title: 'Mixed',
    description: 'The claim contains elements of truth but is partially inaccurate, misleading, or lacks important context.'
  },
  {
    verdict: 'unclear',
    title: 'Unclear',
    description: 'Insufficient evidence to make a determination. May require more time, additional sources, or expert review.'
  },
  {
    verdict: 'unchecked',
    title: 'Unchecked',
    description: 'The claim has not yet been processed by our verification system.'
  }
]

const faqs = [
  {
    question: 'How does the verification process work?',
    answer: 'Our system uses a multi-agent approach where specialized AI agents analyze different aspects of a claim. The Source Agent evaluates credibility, the Factbase Agent cross-references with known facts, and the Orchestrator synthesizes findings into a final verdict with confidence levels.'
  },
  {
    question: 'What is a NewsNode?',
    answer: 'A NewsNode represents a cluster of articles and content about the same news event or claim. It tracks the canonical claim, all related articles, the origin source, and the verification status.'
  },
  {
    question: 'How are reputation scores calculated?',
    answer: 'Reputation scores (0-100) are based on historical accuracy, correction frequency, editorial transparency, and track record. Official sources and established fact-checkers typically have higher scores.'
  },
  {
    question: 'What is a trail?',
    answer: 'A trail maps how a story propagates from its origin through various outlets. It shows the sequence of publications, identifies amplifiers, debunkers, and commentary, and provides a visual timeline of the information spread.'
  },
  {
    question: 'Is this system real-time?',
    answer: 'In this demo, all data is pre-seeded and static. A production implementation would continuously ingest new articles, update trails, and refine verdicts as new information becomes available.'
  },
  {
    question: 'Can I verify my own claims?',
    answer: 'Yes! Visit the Verify page to paste any text or URL. The demo will simulate the verification process and return a sample verdict based on pattern matching with our seeded data.'
  }
]

export default function About() {
  const [expandedStep, setExpandedStep] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl font-bold text-nb-ink mb-4">
            About SatyaTrail
          </h1>
          <p className="text-lg text-nb-ink/70 max-w-2xl mx-auto">
            Understanding the methodology behind news verification and trail mapping
          </p>
        </motion.div>

        {/* The Problem */}
        <section className="mb-12">
          <NBCard>
            <h2 className="font-display text-2xl font-bold mb-4">The Problem</h2>
            <p className="text-nb-ink/80 mb-4">
              In today's information landscape, news travels faster than ever. A story can go viral within minutes,
              often before its accuracy can be verified. This creates challenges:
            </p>
            <ul className="space-y-2 text-nb-ink/80">
              <li className="flex items-start gap-2">
                <span className="text-nb-error">•</span>
                Misinformation spreads rapidly through social networks
              </li>
              <li className="flex items-start gap-2">
                <span className="text-nb-error">•</span>
                It's difficult to trace the origin of a claim
              </li>
              <li className="flex items-start gap-2">
                <span className="text-nb-error">•</span>
                Source credibility varies widely but isn't always apparent
              </li>
              <li className="flex items-start gap-2">
                <span className="text-nb-error">•</span>
                Manual fact-checking can't keep pace with content creation
              </li>
            </ul>
          </NBCard>
        </section>

        {/* Our Approach */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">
            Our Approach
          </h2>
          <p className="text-center text-nb-ink/70 mb-8 max-w-2xl mx-auto">
            SatyaTrail combines trail graph mapping with multi-agent verification to provide
            transparent, traceable news authenticity assessment.
          </p>

          {/* Pipeline Steps */}
          <div className="space-y-4">
            {pipelineSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <NBCard
                  className="cursor-pointer hover:shadow-nb-sm transition-shadow"
                  onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-nb-accent rounded-nb border-2 border-nb-ink flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-nb-ink" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-semibold text-lg">
                          {step.title}
                        </h3>
                        {expandedStep === index ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                      <p className="text-nb-ink/70 mt-1">
                        {step.description}
                      </p>
                      {expandedStep === index && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 pt-4 border-t border-nb-ink/10 text-sm text-nb-ink/60"
                        >
                          {step.details}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </NBCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Verdict Meanings */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">
            What the Badges Mean
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {verdictExplanations.map((item) => (
              <NBCard key={item.verdict} className="flex flex-col">
                <div className="mb-3">
                  <VerdictBadge verdict={item.verdict} size="md" />
                </div>
                <h3 className="font-display font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-nb-ink/70">{item.description}</p>
              </NBCard>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <NBCard
                key={index}
                className="cursor-pointer hover:shadow-nb-sm transition-shadow"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-display font-semibold">{faq.question}</h3>
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
                    className="mt-4 pt-4 border-t border-nb-ink/10 text-nb-ink/70"
                  >
                    {faq.answer}
                  </motion.p>
                )}
              </NBCard>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <NBCard className="bg-nb-accent border-nb-ink">
            <h2 className="font-display text-2xl font-bold mb-4">
              Ready to explore?
            </h2>
            <p className="text-nb-ink/70 mb-6">
              Start verifying news or explore the trail graph to see how stories spread.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/verify">
                <NBButton variant="primary" icon={CheckCircle} className="bg-nb-ink text-white">
                  Try Verify
                </NBButton>
              </Link>
              <Link to="/explore/graph">
                <NBButton variant="ghost" icon={GitBranch}>
                  Explore Graph
                </NBButton>
              </Link>
            </div>
          </NBCard>
        </section>
      </div>
    </div>
  )
}

