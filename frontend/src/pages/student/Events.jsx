import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getEvents, getClubs } from '../../services/api'
import { CATEGORIES } from '../../data/categories'
import EventCard from '../../components/events/EventCard'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import {
  CalendarDays,
  Search,
  Filter,
  X,
  RotateCcw,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedCategory = searchParams.get('category') || 'All'
  const search = searchParams.get('search') || ''
  const selectedPeriod = searchParams.get('period') || 'all'
  const selectedClub = searchParams.get('club') || 'All'
  const selectedStatus = searchParams.get('status') || 'All'

  const [searchInput, setSearchInput] = useState(search)
  const [prevSearch, setPrevSearch] = useState(search)
  if (search !== prevSearch) {
    setPrevSearch(search)
    setSearchInput(search)
  }

  const [events, setEvents] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Period tabs
  const periods = [
    { id: 'all', label: 'All Upcoming' },
    { id: 'current', label: 'Current' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'past', label: 'Past Events' },
  ]

  const statusOptions = ['All', 'Upcoming', 'This Week', 'This Month', 'Completed']

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

  // Fetch events matching filters
  const handleFetch = () => {
    setLoading(true)
    setError(null)
    getEvents({
      category: selectedCategory,
      period: selectedPeriod,
      clubId: selectedClub,
      status: selectedStatus,
      search: search,
    })
      .then((data) => {
        setEvents(data || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load events')
        setLoading(false)
      })
  }

  useEffect(() => {
    let ignore = false
    getEvents({
      category: selectedCategory,
      period: selectedPeriod,
      clubId: selectedClub,
      status: selectedStatus,
      search: search,
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
  }, [selectedCategory, selectedPeriod, selectedClub, selectedStatus, search])

  // Update query params when filters change
  const updateParams = (newParams) => {
    const next = {
      ...(selectedCategory !== 'All' ? { category: selectedCategory } : {}),
      ...(selectedPeriod !== 'all' ? { period: selectedPeriod } : {}),
      ...(selectedClub !== 'All' ? { club: selectedClub } : {}),
      ...(selectedStatus !== 'All' ? { status: selectedStatus } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
      ...newParams,
    }
    // Clean empty/all
    Object.keys(next).forEach((k) => {
      if (next[k] === 'All' || next[k] === 'all' || !next[k]) delete next[k]
    })
    setSearchParams(next)
  }

  const handlePeriodChange = (id) => {
    updateParams({ period: id })
  }

  const handleCategoryChange = (cat) => {
    updateParams({ category: cat })
  }

  const handleClubChange = (clubId) => {
    updateParams({ club: clubId })
  }

  const handleStatusChange = (status) => {
    updateParams({ status: status })
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setSearchParams({})
  }

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedPeriod !== 'all' ||
    selectedClub !== 'All' ||
    selectedStatus !== 'All'

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#8c7fb4]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e1730]">Event Discovery</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#5a5168] mt-0.5">
            Explore and filter upcoming competitions, fests, workshops, and sports at IIIT Vadodara
          </p>
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={handleResetFilters}
            className="self-start sm:self-auto"
          >
            Reset Filters
          </Button>
        )}
      </div>

      {/* ── Period Tabs ────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 bg-[#f0ebf8] rounded-2xl border border-[#cfc7df] overflow-x-auto">
        {periods.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePeriodChange(p.id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              selectedPeriod === p.id
                ? 'bg-[#8c7fb4] text-white shadow-2xs font-semibold'
                : 'text-[#5a5168] hover:text-[#1e1730] hover:bg-[#ede7f5]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Search & Filter Controls ────────────────────────── */}
      <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7088]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              updateParams({ search: e.target.value })
            }}
            placeholder="Search by event name, category, venue, or description..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-[#cfc7df] bg-[#ede8f6] text-[#1e1730] placeholder:text-[#9d93ac] focus:outline-none focus:ring-2 focus:ring-[#8c7fb4]/25 focus:border-[#8c7fb4]"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                updateParams({ search: '' })
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7a7088] hover:text-[#1e1730]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns Row: Category, Club, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Category Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#7a7088] uppercase tracking-wider">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#cfc7df] bg-[#ede8f6] text-[#1e1730] focus:outline-none focus:ring-2 focus:ring-[#8c7fb4]/25 cursor-pointer"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Club Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#7a7088] uppercase tracking-wider">
              Organizing Club / Committee
            </label>
            <select
              value={selectedClub}
              onChange={(e) => handleClubChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#cfc7df] bg-[#ede8f6] text-[#1e1730] focus:outline-none focus:ring-2 focus:ring-[#8c7fb4]/25 cursor-pointer"
            >
              <option value="All">All Clubs & Committees</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#7a7088] uppercase tracking-wider">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#cfc7df] bg-[#ede8f6] text-[#1e1730] focus:outline-none focus:ring-2 focus:ring-[#8c7fb4]/25 cursor-pointer"
            >
              {statusOptions.map((st) => (
                <option key={st} value={st}>
                  {st === 'All' ? 'All Statuses' : st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Pills */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-[#ede7f5] flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[#7a7088] font-medium">Active filters:</span>
            {search.trim() && (
              <Badge variant="powder" size="sm">
                Search: &quot;{search}&quot;
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    updateParams({ search: '' })
                  }}
                  className="ml-1 hover:opacity-75"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedCategory !== 'All' && (
              <Badge variant="lavender" size="sm">
                Category: {selectedCategory}
                <button
                  type="button"
                  onClick={() => handleCategoryChange('All')}
                  className="ml-1 hover:opacity-75"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedClub !== 'All' && (
              <Badge variant="peach" size="sm">
                Club: {clubs.find((c) => c.id === selectedClub)?.name || selectedClub}
                <button
                  type="button"
                  onClick={() => handleClubChange('All')}
                  className="ml-1 hover:opacity-75"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedStatus !== 'All' && (
              <Badge variant="mauve" size="sm">
                Status: {selectedStatus}
                <button
                  type="button"
                  onClick={() => handleStatusChange('All')}
                  className="ml-1 hover:opacity-75"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedPeriod !== 'all' && (
              <Badge variant="neutral" size="sm">
                Period: {periods.find((p) => p.id === selectedPeriod)?.label}
                <button
                  type="button"
                  onClick={() => handlePeriodChange('all')}
                  className="ml-1 hover:opacity-75"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* ── Results Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-[#5a5168]">
        <span>
          Showing <strong>{events.length}</strong> {events.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* ── Error State ────────────────────────────────────── */}
      {error && (
        <Card className="text-center py-8 px-6 bg-[#f0ebf8] border-[#cfc7df]">
          <div className="w-10 h-10 rounded-full bg-[#faeaee] text-[#b85b71] mx-auto flex items-center justify-center mb-3">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-[#1e1730]">Unable to load events</h3>
          <p className="text-xs text-[#5a5168] mt-1 max-w-sm mx-auto">{error}</p>
          <div className="mt-4 flex justify-center">
            <Button variant="primary" size="sm" icon={RefreshCw} onClick={handleFetch}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* ── Events Grid / Loading / Empty State ────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#cfc7df] bg-[#f0ebf8] overflow-hidden animate-pulse flex flex-col h-80"
            >
              <div className="h-44 bg-[#dcd6ea]" />
              <div className="p-4 space-y-3 flex-1">
                <div className="h-4 bg-[#e4dced] rounded w-3/4" />
                <div className="h-3 bg-[#e4dced] rounded w-1/2" />
                <div className="h-3 bg-[#e4dced] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="text-center py-16 px-6 bg-[#f0ebf8] border-[#cfc7df]">
          <div className="w-12 h-12 rounded-full bg-[#faeaee] text-[#b85b71] mx-auto flex items-center justify-center mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1e1730]">No events found</h3>
          <p className="text-xs text-[#5a5168] mt-1.5 max-w-sm mx-auto leading-relaxed">
            No events match your current search query or filter combination. Try adjusting your search term, clearing filters, or switching periods.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button variant="primary" size="sm" icon={RotateCcw} onClick={handleResetFilters}>
              Reset Filters
            </Button>
            <Link to="/student/dashboard">
              <Button variant="outline" size="sm">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
