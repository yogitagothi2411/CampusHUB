import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { adminGetEvents, deleteEvent, getClubs } from '../../services/api'
import { CATEGORIES } from '../../data/categories'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import {
  CalendarDays,
  PlusCircle,
  Search,
  Filter,
  X,
  RotateCcw,
  Eye,
  Pencil,
  Settings2,
  Users,
  Trash2,
  Clock,
  MapPin,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

const categoryBadgeMap = {
  Cultural: 'blush',
  Hackathon: 'lavender',
  Sports: 'peach',
  Workshop: 'powder',
  Seminar: 'mauve',
  Placement: 'lavender',
  Fest: 'blush',
  Technical: 'powder',
  'Club Activities': 'peach',
}

const statusBadgeMap = {
  Upcoming: 'lavender',
  'This Week': 'peach',
  'This Month': 'powder',
  Completed: 'neutral',
}

const PERIODS = [
  { id: 'all', label: 'All Periods' },
  { id: 'current', label: 'Current' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
]

const STATUSES = ['All', 'Upcoming', 'This Week', 'This Month', 'Completed']

export default function AdminEvents() {
  const [searchParams, setSearchParams] = useSearchParams()

  const searchParam = searchParams.get('search') || ''
  const categoryParam = searchParams.get('category') || 'All'
  const clubParam = searchParams.get('club') || 'All'
  const statusParam = searchParams.get('status') || 'All'
  const periodParam = searchParams.get('period') || 'all'

  const [searchInput, setSearchInput] = useState(searchParam)
  const [prevSearch, setPrevSearch] = useState(searchParam)
  if (searchParam !== prevSearch) {
    setPrevSearch(searchParam)
    setSearchInput(searchParam)
  }

  const [events, setEvents] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Delete modal state
  const [eventToDelete, setEventToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState(null)

  // Load clubs once
  useEffect(() => {
    let ignore = false
    getClubs().then((data) => {
      if (!ignore) setClubs(data || [])
    })
    return () => {
      ignore = true
    }
  }, [])

  // Fetch events based on current query parameters
  useEffect(() => {
    let ignore = false
    adminGetEvents({
      search: searchParam,
      category: categoryParam,
      clubId: clubParam,
      status: statusParam,
      period: periodParam,
    })
      .then((data) => {
        if (!ignore) {
          setEvents(data || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load events')
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [searchParam, categoryParam, clubParam, statusParam, periodParam, refreshKey])

  // Computed summary metrics across loaded events
  const metrics = useMemo(() => {
    const total = events.length
    const upcoming = events.filter(
      (e) => !e.isHistorical && e.timing !== 'completed' && e.status !== 'Completed'
    ).length
    const completed = events.filter(
      (e) => e.isHistorical || e.timing === 'completed' || e.status === 'Completed'
    ).length
    const totalRegistrations = events.reduce((sum, e) => sum + (e.registeredCount || 0), 0)

    return { total, upcoming, completed, totalRegistrations }
  }, [events])

  // Filter setters updating searchParams
  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'All' || value === 'all' || value === '') {
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
    Boolean(searchParam) ||
    categoryParam !== 'All' ||
    clubParam !== 'All' ||
    statusParam !== 'All' ||
    periodParam !== 'all'

  // Handle Event Deletion
  const confirmDelete = async () => {
    if (!eventToDelete) return
    setIsDeleting(true)
    try {
      const res = await deleteEvent(eventToDelete.id)
      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: res.message || `Event "${eventToDelete.title || eventToDelete.name}" deleted.`,
        })
        setEventToDelete(null)
        setRefreshKey((k) => k + 1)
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.message || 'Failed to delete event.',
        })
      }
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Error occurred while deleting event.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e8e3f7] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-[#8c7fb4]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e1730]">Event Management</h1>
            <p className="text-xs text-[#5a5168] mt-0.5">
              Browse, filter, edit, manage, and supervise all campus events
            </p>
          </div>
        </div>

        <Link to="/admin/events/create">
          <Button variant="secondary" icon={PlusCircle} size="md">
            Create Event
          </Button>
        </Link>
      </div>

      {/* ── Feedback Message Banner ───────────────────────────── */}
      {feedbackMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium animate-fadeIn ${
            feedbackMessage.type === 'success'
              ? 'bg-[#edf7ed] border-[#c8e6c9] text-[#2e7d32]'
              : 'bg-[#faeaee] border-[#f0c5cf] text-[#b85b71]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2e7d32]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#b85b71]" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Summary Metrics Strip ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e8e3f7] flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-[#8c7fb4]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.total}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Total Events</p>
          </div>
        </div>

        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e3f2fd] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[#1976d2]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.upcoming}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Active / Upcoming</p>
          </div>
        </div>

        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f2edf8] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-[#5a5168]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.completed}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Completed / Historical</p>
          </div>
        </div>

        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#faeaee] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#b85b71]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.totalRegistrations}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Total Registrations</p>
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
            placeholder="Search events by name, category, club, venue, or keywords..."
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Period */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#7a7088] tracking-wider mb-1">
              Event Period
            </label>
            <select
              value={periodParam}
              onChange={(e) => updateFilter('period', e.target.value)}
              className="w-full px-3 py-2 bg-[#ede8f6] border border-[#cfc7df] rounded-xl text-xs text-[#1e1730] focus:outline-none focus:ring-2 focus:ring-[#8c7fb4]/30 focus:border-[#8c7fb4]"
            >
              {PERIODS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#7a7088] tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryParam}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-3 py-2 bg-[#ede8f6] border border-[#cfc7df] rounded-xl text-xs text-[#1e1730] focus:outline-none focus:ring-2 focus:ring-[#8c7fb4]/30 focus:border-[#8c7fb4]"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Club / Committee */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#7a7088] tracking-wider mb-1">
              Club / Committee
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

          {/* Status */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-[#7a7088] tracking-wider mb-1">
              Status
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

              {periodParam !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#ede7f5] text-[#554b73] rounded-lg text-[11px] font-semibold">
                  Period: {PERIODS.find((p) => p.id === periodParam)?.label || periodParam}
                  <button onClick={() => updateFilter('period', 'all')}>
                    <X className="w-3 h-3 hover:text-black" />
                  </button>
                </span>
              )}

              {categoryParam !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#fbf0f4] text-[#b85b71] rounded-lg text-[11px] font-semibold">
                  Category: {categoryParam}
                  <button onClick={() => updateFilter('category', 'All')}>
                    <X className="w-3 h-3 hover:text-black" />
                  </button>
                </span>
              )}

              {clubParam !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#eaf4fb] text-[#2c6585] rounded-lg text-[11px] font-semibold">
                  Club: {clubs.find((c) => c.id === clubParam)?.name || clubParam}
                  <button onClick={() => updateFilter('club', 'All')}>
                    <X className="w-3 h-3 hover:text-black" />
                  </button>
                </span>
              )}

              {statusParam !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#faeee8] text-[#8f4a24] rounded-lg text-[11px] font-semibold">
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

      {/* ── Events Table / List ─────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex gap-4 items-center"
            >
              <div className="w-20 h-16 bg-[#dcd6ea] rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#dcd6ea] rounded w-1/3" />
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
            <h2 className="text-base font-bold text-[#1e1730]">Unable to Load Events</h2>
            <p className="mt-2 text-xs text-[#5a5168]">{error}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="primary" icon={RefreshCw} onClick={() => setRefreshKey((k) => k + 1)}>
                Retry
              </Button>
            </div>
          </Card>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#f2edf8] flex items-center justify-center mx-auto mb-3 text-[#7a7088]">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#1e1730]">No events found</h3>
          <p className="text-xs text-[#5a5168] mt-1 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'No events match your current search and filter settings. Try adjusting or clearing filters.'
              : 'There are currently no events registered in the platform.'}
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
          {events.map((event) => {
            const catVariant = categoryBadgeMap[event.category] || 'lavender'
            const statVariant = statusBadgeMap[event.status] || 'neutral'
            const isFull =
              event.registrationLimit && event.registeredCount >= event.registrationLimit
            const fillRate = event.registrationLimit
              ? Math.min(100, Math.round((event.registeredCount / event.registrationLimit) * 100))
              : 0

            return (
              <div
                key={event.id}
                className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 sm:p-5 hover:border-[#cfc4de] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Event Info */}
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#ede7f5] shrink-0 border border-[#cfc7df]">
                    <img
                      src={event.image}
                      alt={event.title || event.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={catVariant} size="sm">
                        {event.category}
                      </Badge>
                      <Badge variant={statVariant} size="sm">
                        {event.status}
                      </Badge>
                      {event.isHistorical && (
                        <span className="text-[10px] font-semibold text-[#7a7088] uppercase tracking-wider">
                          Historical
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/admin/events/${event.id}`}
                      className="block text-sm font-bold text-[#1e1730] hover:text-[#8c7fb4] transition-colors line-clamp-1"
                    >
                      {event.title || event.name}
                    </Link>

                    <div className="flex items-center gap-3 text-xs text-[#5a5168] flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#7a7088]" />
                        {event.organizer || 'Club'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-[#8c7fb4]" />
                        {event.date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#7a7088]" />
                        {event.venue}
                      </span>
                    </div>

                    {/* Registration Capacity Indicator */}
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-[#5a5168]">
                      <Users className="w-3.5 h-3.5 text-[#7a7088]" />
                      <span>
                        <strong>{event.registeredCount || 0}</strong>
                        {event.registrationLimit > 0
                          ? ` / ${event.registrationLimit} registered (${fillRate}%)`
                          : ' registered (unlimited)'}
                      </span>
                      {isFull && (
                        <span className="text-[10px] font-bold text-[#b85b71] bg-[#faeaee] px-1.5 py-0.5 rounded">
                          FULL
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="flex items-center gap-2 flex-wrap md:self-center self-end pt-2 md:pt-0 border-t md:border-t-0 border-[#ede7f5]">
                  <Link
                    to={`/admin/events/${event.id}`}
                    title="View Event Details"
                    className="inline-flex items-center gap-1 px-3 py-2 bg-[#ede8f6] border border-[#cfc7df] text-[#1e1730] rounded-xl text-xs font-semibold hover:bg-[#f5eff9] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#8c7fb4]" />
                    <span className="hidden sm:inline">View</span>
                  </Link>

                  <Link
                    to={`/admin/events/${event.id}/edit`}
                    title="Edit Event"
                    className="inline-flex items-center gap-1 px-3 py-2 bg-[#ede8f6] border border-[#cfc7df] text-[#1e1730] rounded-xl text-xs font-semibold hover:bg-[#f5eff9] transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#5a5168]" />
                    <span className="hidden sm:inline">Edit</span>
                  </Link>

                  <Link
                    to={`/admin/events/${event.id}/manage`}
                    title="Manage Event Operations"
                    className="inline-flex items-center gap-1 px-3 py-2 bg-[#e8e3f7] text-[#554b73] rounded-xl text-xs font-semibold hover:bg-[#ded7ef] transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Manage</span>
                  </Link>

                  <Link
                    to={`/admin/events/${event.id}/registrations`}
                    title="View Registrations Roster"
                    className="inline-flex items-center gap-1 px-3 py-2 bg-[#f6d8df] text-[#6b3546] rounded-xl text-xs font-semibold hover:bg-[#eed0d7] transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Registrations</span>
                    <span className="bg-[#b85b71] text-white rounded-full px-1.5 py-px text-[10px] font-bold">
                      {event.registeredCount || 0}
                    </span>
                  </Link>

                  <button
                    onClick={() => setEventToDelete(event)}
                    title="Delete Event"
                    className="inline-flex items-center gap-1 px-2.5 py-2 bg-[#ede8f6] border border-[#f0c5cf] text-[#b85b71] rounded-xl text-xs font-semibold hover:bg-[#faeaee] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="sr-only sm:not-sr-only">Delete</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────── */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2a2337]/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#ede8f6] border border-[#cfc7df] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#faeaee] text-[#b85b71] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1e1730]">Delete Event Confirmation</h3>
                <p className="text-xs text-[#7a7088]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[#5a5168] leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-[#1e1730]">
                &quot;{eventToDelete.title || eventToDelete.name}&quot;
              </strong>
              ? This will remove the event record and all associated student registrations in the
              active session.
            </p>

            <div className="p-3 bg-[#faeaee]/60 border border-[#f0c5cf] rounded-xl text-[11px] text-[#b85b71]">
              <strong>Warning:</strong> All students registered for this event will have their ticket
              references removed from this event.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEventToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-[#b85b71] hover:bg-[#a0485e] text-white border-transparent"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Event'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
