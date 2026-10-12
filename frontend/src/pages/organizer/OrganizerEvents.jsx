import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getOrganizerEvents } from '../../services/api'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import {
  ListChecks,
  PlusCircle,
  Pencil,
  Users,
  CalendarDays,
  MapPin,
  Search,
  Filter,
  CalendarX,
  Settings2,
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

const STATUS_FILTERS = ['All', 'Upcoming', 'This Week', 'Completed']

export default function OrganizerEvents() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [allEvents, setAllEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getOrganizerEvents()
      setAllEvents(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load organizer events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const data = await getOrganizerEvents()
        if (!ignore) {
          setAllEvents(data || [])
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load organizer events')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [])

  const events = useMemo(() => {
    let list = allEvents

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q)
      )
    }

    if (statusFilter !== 'All') {
      list = list.filter((e) => e.status === statusFilter)
    }

    return list
  }, [allEvents, search, statusFilter])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e8e3f7] flex items-center justify-center shrink-0">
            <ListChecks className="w-5 h-5 text-[#8c7fb4]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e1730]">My Events</h1>
            <p className="text-xs text-[#5a5168] mt-0.5">
              {loading ? 'Loading events...' : `${allEvents.length} events managed by you`}
            </p>
          </div>
        </div>
        <Link
          to="/organizer/events/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#f6d8df] hover:bg-[#eed0d7] text-[#6b3546] rounded-xl text-sm font-semibold transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Create Event
        </Link>
      </div>

      {/* Error Card */}
      {error && (
        <Card className="text-center py-8 px-6 bg-[#f0ebf8] border-[#cfc7df]">
          <div className="w-10 h-10 rounded-full bg-[#faeaee] text-[#b85b71] mx-auto flex items-center justify-center mb-3">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-[#1e1730]">Unable to load events</h3>
          <p className="text-xs text-[#5a5168] mt-1 max-w-sm mx-auto">{error}</p>
          <div className="mt-4 flex justify-center">
            <Button
              variant="primary"
              size="sm"
              icon={RefreshCw}
              onClick={handleRetry}
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7088]" />
          <input
            id="org-event-search"
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#cfc7df] bg-[#f0ebf8] text-[#1e1730] placeholder:text-[#b0a8bc] focus:outline-none focus:ring-2 focus:ring-[#8c7fb4]/30 focus:border-[#8c7fb4]"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-[#7a7088] shrink-0" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === f
                  ? 'bg-[#f6d8df] text-[#6b3546]'
                  : 'bg-[#f0ebf8] border border-[#cfc7df] text-[#5a5168] hover:bg-[#f6d8df]/40'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table / Loading / Empty */}
      {loading ? (
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-6 space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-[#f0eaf5]">
              <div className="w-12 h-12 rounded-xl bg-[#ede7f5] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#e4dced] rounded w-1/3" />
                <div className="h-3 bg-[#e4dced] rounded w-1/4" />
              </div>
              <div className="h-6 w-16 bg-[#e4dced] rounded-full" />
              <div className="h-8 w-24 bg-[#e4dced] rounded-xl" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-[#ede7f5] flex items-center justify-center mb-4">
            <CalendarX className="w-7 h-7 text-[#8c7fb4]" />
          </div>
          <p className="text-sm font-semibold text-[#1e1730]">No events found</p>
          <p className="text-xs text-[#7a7088] mt-1">
            Try adjusting your search or filter, or create a new event.
          </p>
        </div>
      ) : (
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl overflow-hidden">
          {/* Desktop table header */}
          <div className="hidden md:grid grid-cols-[1fr_120px_140px_100px_160px] gap-4 px-6 py-3 bg-[#f5eff9] border-b border-[#cfc7df]">
            {['Event', 'Category', 'Date', 'Registrations', 'Actions'].map((h) => (
              <span key={h} className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">
                {h}
              </span>
            ))}
          </div>

          <div className="divide-y divide-[#f0eaf5]">
            {events.map((event) => {
              const categoryVariant = categoryBadgeMap[event.category] || 'lavender'
              const isFull =
                event.registrationLimit &&
                event.registeredCount >= event.registrationLimit
              const fillPercent = event.registrationLimit
                ? Math.min(100, Math.round((event.registeredCount / event.registrationLimit) * 100))
                : 0

              return (
                <div
                  key={event.id}
                  className="flex flex-col md:grid md:grid-cols-[1fr_120px_140px_100px_160px] md:items-center gap-3 md:gap-4 px-6 py-4 hover:bg-[#faf7fc] transition-colors"
                >
                  {/* Event info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#ede7f5] shrink-0">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1e1730] line-clamp-2 md:truncate">
                        {event.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-[#7a7088]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.venue}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <Badge variant={categoryVariant} size="sm">
                      {event.category}
                    </Badge>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-xs text-[#5a5168]">
                    <CalendarDays className="w-3.5 h-3.5 text-[#7a7088] shrink-0" />
                    {event.date}
                  </div>

                  {/* Registrations */}
                  {event.registrationLimit > 0 ? (
                    <div className="flex items-start gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#7a7088] mt-0.5 shrink-0" />
                      <div className="w-full">
                        <p className="text-xs font-medium text-[#1e1730]">
                          {event.registeredCount}
                          <span className="text-[#7a7088] font-normal">
                            /{event.registrationLimit}
                          </span>
                        </p>
                        <div className="w-full bg-[#ede7f5] h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isFull ? 'bg-[#dfabb8]' : 'bg-[#8c7fb4]'}`}
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#b0a8bc] italic">No limit</span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/organizer/events/${event.id}/manage`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f6d8df] text-[#6b3546] text-xs font-semibold hover:bg-[#eed0d7] transition-colors"
                    >
                      <Settings2 className="w-3 h-3" />
                      Manage
                    </Link>
                    <Link
                      to={`/organizer/events/${event.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e8e3f7] text-[#554b73] text-xs font-semibold hover:bg-[#ded7ef] transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
