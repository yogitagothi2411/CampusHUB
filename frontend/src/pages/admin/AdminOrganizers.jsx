import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getOrganizers, getClubs, updateUserStatus } from '../../services/api'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import {
  Users,
  Search,
  Filter,
  X,
  RotateCcw,
  Eye,
  Mail,
  Building2,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX,
  Layers,
  Sparkles,
} from 'lucide-react'

const STATUSES = ['All', 'Active', 'Inactive']

export default function AdminOrganizers() {
  const [searchParams, setSearchParams] = useSearchParams()

  const searchParam = searchParams.get('search') || ''
  const clubParam = searchParams.get('club') || 'All'
  const statusParam = searchParams.get('status') || 'All'

  const [searchInput, setSearchInput] = useState(searchParam)
  const [prevSearch, setPrevSearch] = useState(searchParam)
  if (searchParam !== prevSearch) {
    setPrevSearch(searchParam)
    setSearchInput(searchParam)
  }

  const [organizers, setOrganizers] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [statusFeedback, setStatusFeedback] = useState(null)

  // Load clubs list once for filter dropdown
  useEffect(() => {
    let ignore = false
    getClubs().then((data) => {
      if (!ignore) setClubs(data || [])
    })
    return () => {
      ignore = true
    }
  }, [])

  // Fetch organizers based on search and filters
  useEffect(() => {
    let ignore = false
    getOrganizers({
      search: searchParam,
      clubId: clubParam,
      status: statusParam,
    })
      .then((data) => {
        if (!ignore) {
          setOrganizers(data || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load organizers')
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [searchParam, clubParam, statusParam, refreshKey])

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = organizers.length
    const active = organizers.filter((o) => o.status === 'Active').length
    const totalEvents = organizers.reduce((sum, o) => sum + (o.totalEvents || 0), 0)
    const totalRegistrations = organizers.reduce((sum, o) => sum + (o.totalRegistrations || 0), 0)

    return { total, active, totalEvents, totalRegistrations }
  }, [organizers])

  // Filter setters
  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'All' || value === '') {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setSearchParams(next, { replace: true })
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateFilter('search', searchInput.trim())
  }

  const handleClearSearch = () => {
    setSearchInput('')
    updateFilter('search', '')
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setSearchParams({}, { replace: true })
  }

  const hasActiveFilters =
    Boolean(searchParam) || clubParam !== 'All' || statusParam !== 'All'

  // Toggle organizer status
  const handleToggleStatus = async (organizer) => {
    const newStatus = organizer.status === 'Active' ? 'Inactive' : 'Active'
    try {
      const res = await updateUserStatus(organizer.id, newStatus)
      if (res.success) {
        setStatusFeedback({
          type: 'success',
          text: `${organizer.name} is now marked as ${newStatus}.`,
        })
        setRefreshKey((k) => k + 1)
      }
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        text: err.message || 'Failed to update organizer status.',
      })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fae4d7] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#8c5942]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e1730]">Organizers Management</h1>
            <p className="text-xs text-[#5a5168] mt-0.5">
              Supervise student coordinators, club representatives, and committees
            </p>
          </div>
        </div>
      </div>

      {/* ── Feedback Message Banner ───────────────────────────── */}
      {statusFeedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium animate-fadeIn ${
            statusFeedback.type === 'success'
              ? 'bg-[#edf7ed] border-[#c8e6c9] text-[#2e7d32]'
              : 'bg-[#faeaee] border-[#f0c5cf] text-[#b85b71]'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2e7d32]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#b85b71]" />
            )}
            <span>{statusFeedback.text}</span>
          </div>
          <button
            onClick={() => setStatusFeedback(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Summary Metrics Strip ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fae4d7] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#8c5942]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.total}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Total Organizers</p>
          </div>
        </div>

        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e8f5e9] flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5 text-[#2e7d32]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.active}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Active Coordinators</p>
          </div>
        </div>

        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e8e3f7] flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-[#8c7fb4]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.totalEvents}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Managed Events</p>
          </div>
        </div>

        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#faeaee] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#b85b71]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.totalRegistrations}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Total Attendees</p>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────── */}
      <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-5 space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#7a7088]" />
          <input
            type="text"
            placeholder="Search organizers by name, email, club, or committee..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              updateFilter('search', e.target.value)
            }}
            className="w-full pl-10 pr-24 py-2.5 bg-[#ede8f6] border border-[#cfc7df] rounded-xl text-xs text-[#1e1730] placeholder:text-[#b0a8bc] focus:outline-none focus:ring-2 focus:ring-[#8c7fb4]/30 focus:border-[#8c7fb4] transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-12 text-[#7a7088] hover:text-[#1e1730] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 px-3 py-1.5 bg-[#8c7fb4] text-white text-[11px] font-semibold rounded-lg hover:bg-[#7b6ea3] transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Club / Committee */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#7a7088] tracking-wider mb-1">
              Affiliated Club / Committee
            </label>
            <select
              value={clubParam}
              onChange={(e) => updateFilter('club', e.target.value)}
              className="w-full px-3 py-2 bg-[#ede8f6] border border-[#cfc7df] rounded-xl text-xs text-[#1e1730] focus:outline-none focus:ring-2 focus:ring-[#8c7fb4]/30 focus:border-[#8c7fb4]"
            >
              <option value="All">All Clubs & Committees</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Status */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#7a7088] tracking-wider mb-1">
              Account Status
            </label>
            <select
              value={statusParam}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full px-3 py-2 bg-[#ede8f6] border border-[#cfc7df] rounded-xl text-xs text-[#1e1730] focus:outline-none focus:ring-2 focus:ring-[#8c7fb4]/30 focus:border-[#8c7fb4]"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st === 'All' ? 'All Statuses' : st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Bar & Reset */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-[#ede7f5] flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[#7a7088] font-medium text-[11px]">Active Filters:</span>

              {searchParam && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#e8e3f7] text-[#554b73] rounded-lg text-[11px] font-semibold">
                  Search: &quot;{searchParam}&quot;
                  <button onClick={handleClearSearch}>
                    <X className="w-3 h-3 hover:text-black" />
                  </button>
                </span>
              )}

              {clubParam !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#fae4d7] text-[#8c5942] rounded-lg text-[11px] font-semibold">
                  Club: {clubs.find((c) => c.id === clubParam)?.name || clubParam}
                  <button onClick={() => updateFilter('club', 'All')}>
                    <X className="w-3 h-3 hover:text-black" />
                  </button>
                </span>
              )}

              {statusParam !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#e8f5e9] text-[#2e7d32] rounded-lg text-[11px] font-semibold">
                  Status: {statusParam}
                  <button onClick={() => updateFilter('status', 'All')}>
                    <X className="w-3 h-3 hover:text-black" />
                  </button>
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8c7fb4] hover:text-[#554b73] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* ── Organizers List / Table ───────────────────────────── */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex gap-4 items-center"
            >
              <div className="w-14 h-14 bg-[#dcd6ea] rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#dcd6ea] rounded w-1/4" />
                <div className="h-3 bg-[#dcd6ea] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-12 flex justify-center">
          <Card className="w-full max-w-md text-center py-10 px-8 bg-[#f0ebf8] border-[#cfc7df]">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#faeaee] text-[#b85b71] flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-[#1e1730]">Unable to Load Organizers</h2>
            <p className="mt-2 text-xs text-[#5a5168]">{error}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="primary"
                icon={RefreshCw}
                onClick={() => setRefreshKey((k) => k + 1)}
              >
                Retry
              </Button>
            </div>
          </Card>
        </div>
      ) : organizers.length === 0 ? (
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#f2edf8] flex items-center justify-center mx-auto mb-3 text-[#7a7088]">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#1e1730]">No organizers found</h3>
          <p className="text-xs text-[#5a5168] mt-1 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'No organizers match your current search and filter settings. Try clearing filters.'
              : 'There are currently no organizers registered in the platform directory.'}
          </p>
          {hasActiveFilters && (
            <div className="mt-4">
              <Button variant="outline" size="sm" icon={RotateCcw} onClick={handleResetFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {organizers.map((organizer) => {
            const isActive = organizer.status === 'Active'

            return (
              <div
                key={organizer.id}
                className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 sm:p-5 hover:border-[#cfc4de] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Organizer Info */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#ede7f5] shrink-0 border border-[#cfc7df]">
                    <img
                      src={organizer.avatar}
                      alt={organizer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/admin/organizers/${organizer.id}`}
                        className="text-sm font-bold text-[#1e1730] hover:text-[#8c7fb4] transition-colors"
                      >
                        {organizer.name}
                      </Link>
                      {organizer.title && (
                        <Badge variant="mauve" size="sm">
                          {organizer.title}
                        </Badge>
                      )}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-[#e8f5e9] text-[#2e7d32]'
                            : 'bg-[#faeaee] text-[#b85b71]'
                        }`}
                      >
                        {organizer.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#5a5168] flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-[#7a7088]" />
                        {organizer.email}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#7a7088]" />
                        {organizer.clubName || 'Club Coordinator'}
                      </span>
                      {organizer.committee && (
                        <span className="text-[11px] text-[#7a7088]">
                          ({organizer.committee})
                        </span>
                      )}
                    </div>

                    {/* Events Summary Badge */}
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-[#5a5168] flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-[#8c7fb4]" />
                        <strong>{organizer.totalEvents}</strong> Total Events
                      </span>
                      <span className="text-[#7a7088]">•</span>
                      <span className="text-[#1976d2] font-semibold">
                        {organizer.upcomingEvents} Upcoming
                      </span>
                      <span className="text-[#7a7088]">•</span>
                      <span>{organizer.completedEvents} Completed</span>
                      <span className="text-[#7a7088]">•</span>
                      <span className="font-semibold text-[#8c5942]">
                        {organizer.totalRegistrations} Attendees
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap md:self-center self-end pt-2 md:pt-0 border-t md:border-t-0 border-[#ede7f5]">
                  <button
                    onClick={() => handleToggleStatus(organizer)}
                    title={`Mark as ${isActive ? 'Inactive' : 'Active'}`}
                    className={`inline-flex items-center gap-1 px-3 py-2 border rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#ede8f6] border-[#f0c5cf] text-[#b85b71] hover:bg-[#faeaee]'
                        : 'bg-[#ede8f6] border-[#c8e6c9] text-[#2e7d32] hover:bg-[#edf7ed]'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Deactivate</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Activate</span>
                      </>
                    )}
                  </button>

                  <Link
                    to={`/admin/organizers/${organizer.id}`}
                    title="View Organizer Details & Events"
                    className="inline-flex items-center gap-1 px-3 py-2 bg-[#fae4d7] text-[#8c5942] rounded-xl text-xs font-semibold hover:bg-[#f6d7c5] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Profile</span>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
