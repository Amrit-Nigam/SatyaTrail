import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, Menu, X, User, Newspaper, GitBranch, CheckCircle, Info } from 'lucide-react'
import { cn } from '../lib/utils'

const navLinks = [
  { to: '/feed', label: 'Feed', icon: Newspaper },
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#e3cab8' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          {/* Glass navbar container with full glass effect */}
          <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-full shadow-2xl">
            {/* Additional glass overlay for enhanced effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-full"></div>
            
            <div className="relative px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <Link
                  to="/"
                  className="flex items-center gap-3 font-display font-bold text-xl sm:text-2xl text-nb-ink hover:opacity-80 transition-opacity"
                >
                  <span>SatyaTrail</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 px-4 py-2 font-medium transition-all uppercase tracking-wide text-sm rounded-full',
                          isActive
                            ? 'bg-nb-ink text-nb-bg'
                            : 'hover:bg-nb-ink/10 text-nb-ink'
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
                      className="w-full pl-9 pr-4 py-2 border-2 border-nb-ink/30 bg-white/30 backdrop-blur-md text-sm focus:outline-none focus:ring-2 focus:ring-nb-ink transition-shadow rounded-full"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                  </div>
                </form>

                {/* Profile & Mobile Menu */}
                <div className="flex items-center gap-2">
                  {/* Profile Placeholder */}
                  <button
                    className="hidden sm:flex w-9 h-9 border-2 border-nb-ink/30 bg-white/30 backdrop-blur-md items-center justify-center hover:bg-white/40 transition-colors rounded-full"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                    }}
                    title="Profile (demo)"
                  >
                    <User className="w-4 h-4 text-nb-ink" />
                  </button>

                  {/* Mobile Menu Toggle */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-nb-ink hover:bg-white/20 transition-colors duration-200"
                  >
                    {mobileMenuOpen ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Menu className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile Menu */}
              {mobileMenuOpen && (
                <div className="md:hidden mt-4 pt-4 border-t border-white/20">
                  <div className="flex flex-col space-y-3">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearch} className="mb-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nb-ink/40" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search..."
                          className="w-full pl-9 pr-4 py-2 border border-white/20 bg-white/10 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-nb-ink rounded-xl"
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
                            'text-nb-ink/90 hover:text-nb-ink text-left py-2 px-3 rounded-lg hover:bg-white/10 transition-colors duration-200 font-medium flex items-center gap-2',
                            isActive && 'text-nb-ink bg-white/10'
                          )
                        }
                      >
                        <link.icon className="w-4 h-4" />
                        {link.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-black/30 bg-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-black/80">
              <span className="font-display font-bold">© SatyaTrail</span>
            </div>

            {/* Footer Links */}
            <nav className="flex items-center gap-6 text-sm">
              <Link to="/about" className="text-black/80 hover:text-black transition-colors font-bold">
                About
              </Link>
              <Link to="/about" className="text-black/80 hover:text-black transition-colors font-bold">
                Methodology
              </Link>
              <span className="text-black/60 italic">Mock Docs</span>
            </nav>

            {/* Version Badge */}
            <div className="px-3 py-1 border border-black/30 rounded-lg text-xs font-bold text-black/80 uppercase tracking-wide">
              v1.0.0-demo
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

