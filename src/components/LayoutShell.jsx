import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Menu, X, User, Newspaper, GitBranch, CheckCircle, Info } from 'lucide-react'
import { cn } from '../lib/utils'

const navLinks = [
  { to: '/feed', label: 'Feed', icon: Newspaper },
  { to: '/explore/graph', label: 'Graph Explorer', icon: GitBranch },
  { to: '/verify', label: 'Verify', icon: CheckCircle },
  { to: '/about', label: 'About', icon: Info }
]

/**
 * Shared layout shell with header, nav, and footer
 */
export default function LayoutShell({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/feed?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-nb-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-nb-card border-b-2 border-nb-ink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 font-display font-bold text-xl sm:text-2xl text-nb-ink hover:text-nb-accent transition-colors"
            >
              <div className="w-8 h-8 bg-nb-accent rounded-lg border-2 border-nb-ink flex items-center justify-center">
                <GitBranch className="w-5 h-5" />
              </div>
              <span className="hidden sm:inline">SatyaTrail</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-4 py-2 rounded-nb font-medium transition-all',
                      isActive
                        ? 'bg-nb-ink text-white'
                        : 'hover:bg-nb-ink/5 text-nb-ink'
                    )
                  }
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xs">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nb-ink/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick search..."
                  className="w-full pl-9 pr-4 py-2 border-2 border-nb-ink rounded-nb bg-white text-sm focus:outline-none focus:ring-4 focus:ring-nb-accent/30 transition-shadow"
                />
              </div>
            </form>

            {/* Profile & Mobile Menu */}
            <div className="flex items-center gap-2">
              {/* Profile Placeholder */}
              <button
                className="hidden sm:flex w-10 h-10 rounded-full border-2 border-nb-ink bg-nb-accent-2/20 items-center justify-center hover:bg-nb-accent-2/40 transition-colors"
                title="Profile (demo)"
              >
                <User className="w-5 h-5 text-nb-ink" />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-nb border-2 border-nb-ink hover:bg-nb-ink/5 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t-2 border-nb-ink overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2 bg-nb-card">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nb-ink/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-9 pr-4 py-2 border-2 border-nb-ink rounded-nb bg-white text-sm focus:outline-none focus:ring-4 focus:ring-nb-accent/30"
                    />
                  </div>
                </form>

                {/* Mobile Nav Links */}
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-3 rounded-nb font-medium transition-all',
                        isActive
                          ? 'bg-nb-ink text-white'
                          : 'hover:bg-nb-ink/5 text-nb-ink'
                      )
                    }
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-nb-card border-t-2 border-nb-ink mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-nb-ink/70">
              <div className="w-6 h-6 bg-nb-accent rounded-md border-2 border-nb-ink flex items-center justify-center">
                <GitBranch className="w-4 h-4" />
              </div>
              <span className="font-medium">© SatyaTrail (demo)</span>
            </div>

            {/* Footer Links */}
            <nav className="flex items-center gap-6 text-sm">
              <Link to="/about" className="text-nb-ink/70 hover:text-nb-ink transition-colors">
                About
              </Link>
              <Link to="/about" className="text-nb-ink/70 hover:text-nb-ink transition-colors">
                Methodology
              </Link>
              <span className="text-nb-ink/50">Mock Docs</span>
            </nav>

            {/* Version Badge */}
            <div className="px-3 py-1 bg-nb-ink/10 rounded-full text-xs font-medium text-nb-ink/70">
              v1.0.0-demo
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

