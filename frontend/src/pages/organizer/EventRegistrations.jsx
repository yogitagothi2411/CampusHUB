import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { getEventById, getEventRegistrations } from '../../services/api'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import {
  ArrowLeft,
  Users,
  Search,
  UserX,
  CalendarDays,
  Mail,
  Hash,
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

export default function EventRegistrations() {
  const { eventId } = useParams()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  const baseEventsPath = isAdmin ? '/admin/events' : '/organizer/events'
  const backLabel = isAdmin ? 'Back to All Events' : 'Back to My Events'
  const managePath = `${baseEventsPath}/${eventId}/manage`

  const [search, setSearch] = useState('')
  const [event, setEvent] = useState(null)
  const [allRegistrations, setAllRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    try {
      const [eventData, regData] = await Promise.all([
        getEventById(eventId),
        getEventRegistrations(eventId),
      ])
      setEvent(eventData)
      setAllRegistrations(regData || [])
    } catch (err) {
      setError(err.message || 'Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const [eventData, regData] = await Promise.all([
          getEventById(eventId),
          getEventRegistrations(eventId),
        ])
        if (!ignore) {
          setEvent(eventData)
          setAllRegistrations(regData || [])
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load registrations')
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
  }, [eventId])

  const filtered = useMemo(() => {
    if (!search.trim()) return allRegistrations
    const q = search.toLowerCase()
    return allRegistrations.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
    )
  }, [search, allRegistrations])

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-[#e4dced] rounded-xl w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4" />
          ))}
        </div>
        <div className="h-64 bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center py-20">
        <Card className="w-full max-w-md text-center py-12 px-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#faeaee] text-[#b85b71] flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-[#1e1730]">Unable to Load Registrations</h1>
          <p className="text-xs text-[#5a5168] mt-1">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="primary" icon={RefreshCw} onClick={handleRetry}>
              Retry
            </Button>
            <Link to={baseEventsPath}>
              <Button variant="outline" icon={ArrowLeft}>
                {backLabel}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-full max-w-md text-center bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl py-12 px-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#faeaee] text-[#b85b71] flex items-center justify-center mb-4">
            <UserX className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-[#1e1730]">Event Not Found</h1>
          <p className="text-xs text-[#5a5168] mt-1">
            Cannot load registrations for &quot;{eventId}&quot;.
          </p>
          <div className="mt-6">
            <Link
              to={baseEventsPath}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c7fb4] hover:text-[#554b73]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {backLabel}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const categoryVariant = categoryBadgeMap[event.category] || 'lavender'
  const fillPercent = event.registrationLimit
    ? Math.min(100, Math.round((allRegistrations.length / event.registrationLimit) * 100))
    : 0
  const isFull = event.registrationLimit && allRegistrations.length >= event.registrationLimit

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            to={managePath}
            className="w-9 h-9 rounded-xl bg-[#f2edf8] flex items-center justify-center text-[#5a5168] hover:bg-[#e8e3f7] transition-colors shrink-0 mt-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#7a7088]" />
              <h1 className="text-xl font-bold text-[#1e1730]">Registrations</h1>
            </div>
            <p className="text-xs text-[#5a5168] mt-0.5 line-clamp-1 max-w-xs sm:max-w-sm">
              {event.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={categoryVariant} size="md">{event.category}</Badge>
          <Link
            to={managePath}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#f6d8df] text-[#6b3546] rounded-xl text-xs font-semibold hover:bg-[#eed0d7] transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Manage Event
          </Link>
        </div>
      </div>

      {/* ── Stats Strip ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total registrations */}
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e8e3f7] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#8c7fb4]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{allRegistrations.length}</p>
            <p className="text-[10px] text-[#7a7088] font-medium">Registered</p>
          </div>
        </div>

        {/* Capacity */}
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fae4d7] flex items-center justify-center shrink-0">
            <Hash className="w-5 h-5 text-[#8c5942]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">
              {event.registrationLimit > 0 ? event.registrationLimit : '∞'}
            </p>
            <p className="text-[10px] text-[#7a7088] font-medium">Capacity</p>
          </div>
        </div>

        {/* Fill rate */}
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-[#7a7088] font-medium uppercase tracking-wider">Fill Rate</p>
            <p className="text-sm font-bold text-[#1e1730]">{fillPercent}%</p>
          </div>
          <div className="w-full bg-[#ede7f5] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-[#dfabb8]' : 'bg-[#8c7fb4]'}`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          {isFull && (
            <p className="text-[10px] font-semibold text-[#b85b71]">Registration limit reached</p>
          )}
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7088]" />
        <input
          id="reg-search"
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#cfc7df] bg-[#f0ebf8] text-[#1e1730] placeholder:text-[#b0a8bc] focus:outline-none focus:ring-2 focus:ring-[#8c7fb4]/30 focus:border-[#8c7fb4] transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-[#7a7088] hover:text-[#1e1730] font-medium transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Registrations Table ─────────────────────────────────── */}
      <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[40px_1fr_1fr_120px] gap-4 px-6 py-3 bg-[#f5eff9] border-b border-[#cfc7df]">
          {['#', 'Student', 'College Email', 'Registered On'].map((h) => (
            <span
              key={h}
              className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]"
            >
              {h}
            </span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-[#ede7f5] flex items-center justify-center mb-3">
              <UserX className="w-6 h-6 text-[#8c7fb4]" />
            </div>
            <p className="text-sm font-semibold text-[#1e1730]">
              {search ? 'No matching registrations' : 'No registrations yet'}
            </p>
            <p className="text-xs text-[#7a7088] mt-1 max-w-xs">
              {search
                ? 'Try a different name or email.'
                : 'Students who register will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0eaf5]">
            {filtered.map((reg, idx) => (
              <div
                key={reg.id}
                className="flex flex-col sm:grid sm:grid-cols-[40px_1fr_1fr_120px] sm:items-center gap-2 sm:gap-4 px-6 py-4 hover:bg-[#faf7fc] transition-colors"
              >
                {/* Serial */}
                <span className="hidden sm:block text-xs font-mono text-[#b0a8bc]">
                  {String(idx + 1).padStart(2, '0')}
                </span>

                {/* Student */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#e8e3f7] flex items-center justify-center text-xs font-bold text-[#8c7fb4] shrink-0">
                    {reg.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1e1730]">{reg.name}</p>
                    {/* Email shown under name on mobile */}
                    <p className="text-[10px] text-[#7a7088] sm:hidden">{reg.email}</p>
                  </div>
                </div>

                {/* Email — hidden on mobile (shown inline above) */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#5a5168]">
                  <Mail className="w-3.5 h-3.5 text-[#7a7088] shrink-0" />
                  <span className="truncate">{reg.email}</span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs text-[#5a5168]">
                  <CalendarDays className="w-3.5 h-3.5 text-[#7a7088] shrink-0" />
                  <span>{reg.registeredOn}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-[#f0eaf5] bg-[#faf7fc]">
            <p className="text-[10px] text-[#7a7088]">
              Showing{' '}
              <strong className="text-[#1e1730]">{filtered.length}</strong>{' '}
              {search ? `of ${allRegistrations.length} registrations` : 'registrations'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
