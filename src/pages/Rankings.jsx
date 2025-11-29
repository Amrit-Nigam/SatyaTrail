import { useEffect, useMemo, useState } from 'react'
import { ArrowUpDown, Award, BarChart2 } from 'lucide-react'
import reputationService from '../lib/services/reputationService'

function getReputationColor(score) {
  if (score >= 85) return 'bg-emerald-600 text-white border-emerald-700'
  if (score >= 70) return 'bg-amber-500 text-black border-amber-700/80'
  if (score >= 50) return 'bg-slate-200 text-slate-900 border-slate-400'
  return 'bg-red-600 text-white border-red-800'
}

export default function Rankings() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortField, setSortField] = useState('reputationScore')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await reputationService.getLeaderboard({ limit: 20 })
        if (!isMounted) return
        setAgents(data)
      } catch (err) {
        console.error('Failed to load rankings', err)
        if (!isMounted) return
        setError(err.message || 'Failed to load rankings')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  const sortedAgents = useMemo(() => {
    const arr = [...agents]
    arr.sort((a, b) => {
      const aVal = a[sortField] ?? 0
      const bVal = b[sortField] ?? 0
      if (sortDir === 'asc') return aVal - bVal
      return bVal - aVal
    })
    return arr
  }, [agents, sortField, sortDir])

  const toggleSort = (field) => {
    if (field === sortField) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const totals = useMemo(() => {
    if (!agents.length) return null
    const totalVerifications = agents.reduce((sum, a) => sum + (a.totalVerifications || 0), 0)
    const avgReputation =
      agents.reduce((sum, a) => sum + (a.reputationScore || 0), 0) / agents.length
    const avgCred =
      agents.reduce((sum, a) => sum + (a.avgCredibilityScore || 0), 0) / agents.length
    return {
      totalAgents: agents.length,
      totalVerifications,
      avgReputation: Math.round(avgReputation),
      avgCredibility: Math.round(avgCred),
    }
  }, [agents])

  return (
    <div className="pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-nb-ink">
              Trust Leaderboard
            </h1>
            <p className="mt-2 text-sm sm:text-base text-nb-ink/70 max-w-2xl">
              Ranked list of verification agents and news sources, scored by reputation, historical
              accuracy, and credibility across their checks.
            </p>
          </div>
          {totals && (
            <div className="inline-flex items-center gap-3 rounded-full border border-black/40 bg-white/40 px-4 py-2 shadow-sm">
              <BarChart2 className="w-4 h-4 text-nb-ink" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-nb-ink">
                {totals.totalAgents} agents · {totals.totalVerifications} verifications
              </span>
            </div>
          )}
        </header>

        {/* Card */}
        <div className="border border-black/40 rounded-2xl bg-white/80 shadow-[0_8px_0_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="px-4 sm:px-6 py-3 border-b border-black/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-nb-ink" />
              <span className="text-xs sm:text-sm font-semibold tracking-[0.12em] uppercase text-nb-ink">
                Reputation rankings
              </span>
            </div>
            {loading && (
              <div className="text-xs font-medium text-nb-ink/70">Loading rankings…</div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 sm:px-6 py-3 bg-red-50 border-b border-red-300 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-4 sm:px-6 py-3 font-semibold text-xs tracking-[0.16em] uppercase">
                    #
                  </th>
                  <th className="px-4 sm:px-6 py-3 font-semibold text-xs tracking-[0.16em] uppercase">
                    Agent
                  </th>
                  <th className="px-4 sm:px-6 py-3 font-semibold text-xs tracking-[0.16em] uppercase">
                    Type
                  </th>
                  <th className="px-4 sm:px-6 py-3 font-semibold text-xs tracking-[0.16em] uppercase">
                    <button
                      type="button"
                      onClick={() => toggleSort('reputationScore')}
                      className="inline-flex items-center gap-1"
                    >
                      Reputation
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 sm:px-6 py-3 font-semibold text-xs tracking-[0.16em] uppercase">
                    <button
                      type="button"
                      onClick={() => toggleSort('accuracyRate')}
                      className="inline-flex items-center gap-1"
                    >
                      Accuracy
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 sm:px-6 py-3 font-semibold text-xs tracking-[0.16em] uppercase">
                    <button
                      type="button"
                      onClick={() => toggleSort('totalVerifications')}
                      className="inline-flex items-center gap-1"
                    >
                      Verifications
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 sm:px-6 py-3 font-semibold text-xs tracking-[0.16em] uppercase">
                    <button
                      type="button"
                      onClick={() => toggleSort('avgCredibilityScore')}
                      className="inline-flex items-center gap-1"
                    >
                      Avg. credibility
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && !agents.length && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 sm:px-6 py-6 text-center text-xs sm:text-sm text-nb-ink/70"
                    >
                      Gathering reputation data from recent verifications…
                    </td>
                  </tr>
                )}

                {!loading && !agents.length && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 sm:px-6 py-6 text-center text-xs sm:text-sm text-nb-ink/70"
                    >
                      No agents have recorded verifications yet. Try running a few checks on the
                      Verify page and come back.
                    </td>
                  </tr>
                )}

                {sortedAgents.map((agent, index) => (
                  <tr
                    key={`${agent.agentName}-${index}`}
                    className="border-t border-black/10 odd:bg-white/70 even:bg-white/40"
                  >
                    <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold text-nb-ink">
                      {index + 1}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-nb-ink">
                          {agent.agentName}
                        </span>
                        <span className="text-[11px] text-nb-ink/60 uppercase tracking-[0.16em]">
                          Agent
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-nb-ink/80 capitalize">
                      {agent.agentType || 'generic'}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <span
                        className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold ${getReputationColor(
                          agent.reputationScore || 0
                        )}`}
                      >
                        {agent.reputationScore ?? '—'}/100
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-nb-ink/80">
                      {agent.accuracyRate != null ? `${agent.accuracyRate}%` : '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-nb-ink/80">
                      {agent.totalVerifications ?? 0}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-nb-ink/80">
                      {agent.avgCredibilityScore != null ? `${agent.avgCredibilityScore}/100` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}


