import { useSearchParams } from 'react-router-dom'
import { Search, Filter, Grid, List } from 'lucide-react'
import { articlesService } from '../lib/services/articlesService'
import { sourcesService } from '../lib/services/sourcesService'
import { useUIStore } from '../lib/stores/useUIStore'
import { cn, getVerdictLabel } from '../lib/utils'

/**
 * Filter bar for /feed and /explore pages
 */
export default function FeedFilterBar({ showViewToggle = true }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { viewMode, setViewMode } = useUIStore()

  const categories = articlesService.getCategories()
  const verdicts = articlesService.getVerdicts()
  const sources = sourcesService.listAll()

  const currentCategory = searchParams.get('category') || 'all'
  const currentVerdict = searchParams.get('verdict') || 'all'
  const currentSource = searchParams.get('sourceId') || 'all'
  const currentQuery = searchParams.get('q') || ''

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'all' || value === '') {
      newParams.delete(key)
    } else {
      newParams.set(key, value)
    }
    // Reset to page 1 when filters change
    newParams.delete('page')
    setSearchParams(newParams)
  }

  return (
    <div className="bg-transparent border border-nb-ink/30 rounded-lg p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-nb-ink/40" />
          <input
            type="text"
            placeholder="Search headlines, content..."
            value={currentQuery}
            onChange={(e) => updateFilter('q', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-nb-ink/30 rounded-lg bg-white/60 focus:outline-none focus:border-nb-ink transition-shadow"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-nb-ink/60" />
            <select
              value={currentCategory}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="px-3 py-2 border border-nb-ink/30 rounded-lg bg-white/60 focus:outline-none focus:border-nb-ink cursor-pointer font-medium text-sm"
              data-testid="feed-filter-category"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat.toLowerCase()}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Verdict Filter */}
          <select
            value={currentVerdict}
            onChange={(e) => updateFilter('verdict', e.target.value)}
            className="px-3 py-2 border border-nb-ink/30 rounded-lg bg-white/60 focus:outline-none focus:border-nb-ink cursor-pointer font-medium text-sm"
            data-testid="feed-filter-verdict"
          >
            <option value="all">All Verdicts</option>
            {verdicts.map((v) => (
              <option key={v} value={v}>
                {getVerdictLabel(v)}
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={currentSource}
            onChange={(e) => updateFilter('sourceId', e.target.value)}
            className="px-3 py-2 border border-nb-ink/30 rounded-lg bg-white/60 focus:outline-none focus:border-nb-ink cursor-pointer font-medium text-sm"
          >
            <option value="all">All Sources</option>
            {sources.map((src) => (
              <option key={src.id} value={src.id}>
                {src.name}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          {showViewToggle && (
            <div className="flex border border-nb-ink/30 rounded-lg overflow-hidden ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'grid' 
                    ? 'bg-nb-ink text-white' 
                    : 'bg-white/60 text-nb-ink hover:bg-nb-ink/10'
                )}
                title="Grid view"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 transition-colors border-l border-nb-ink/30',
                  viewMode === 'list' 
                    ? 'bg-nb-ink text-white' 
                    : 'bg-white/60 text-nb-ink hover:bg-nb-ink/10'
                )}
                title="List view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

