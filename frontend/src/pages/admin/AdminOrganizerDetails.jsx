import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getUserById, getOrganizerEvents, updateUserStatus } from '../../services/api'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import {
  ArrowLeft,
  Users,
  Mail,
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX,
  ExternalLink,
  Layers,
  Settings2,
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

export default function AdminOrganizerDetails() {
  const { organizerId } = useParams()

  const [organizer, setOrganizer] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [statusFeedback, setStatusFeedback] = useState(null)

  useEffect(() => {
    let ignore = false

    Promise.all([
      getUserById(organizerId),
      getOrganizerEvents(organizerId),
    ])
      .then(([userData, eventData]) => {
        if (!ignore) {
          setOrganizer(userData)
          setEvents(eventData || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load organizer details')
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [organizerId, refreshKey])

  const handleToggleStatus = async () => {
    if (!organizer) return
    const newStatus = organizer.status === 'Active' ? 'Inactive' : 'Active'
    try {
      const res = await updateUserStatus(organizer.id, newStatus)
      if (res.success) {
        setStatusFeedback({
          type: 'success',
          text: `Account status updated to ${newStatus}.`,
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

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-6 w-36 bg-[#e4dced] rounded-lg" />
        <div className="h-48 bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl" />
        <div className="h-64 bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 flex justify-center">
        <Card className="w-full max-w-md text-center py-10 px-8 bg-[#f0ebf8] border-[#cfc7df]">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#faeaee] text-[#b85b71] flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#1e1730]">Unable to Load Organizer</h1>
          <p className="mt-2 text-xs text-[#5a5168]">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="primary"
              icon={RefreshCw}
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              Retry
            </Button>
            <Link to="/admin/organizers">
              <Button variant="outline" icon={ArrowLeft}>
                Back to Organizers
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (!organizer) {
    return (
      <div className="py-12 flex justify-center">
        <Card className="w-full max-w-md text-center py-10 px-8 bg-[#f0ebf8] border-[#cfc7df]">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#faeaee] text-[#b85b71] flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#1e1730]">Organizer Not Found</h1>
          <p className="mt-2 text-xs text-[#5a5168]">
            Organizer ID &quot;{organizerId}&quot; does not exist or may have been removed.
          </p>
          <div className="mt-6">
            <Link to="/admin/organizers">
              <Button variant="primary" icon={ArrowLeft}>
                Back to Organizers
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const isActive = organizer.status === 'Active'
  const upcomingCount = events.filter(
    (e) => !e.isHistorical && e.timing !== 'completed' && e.status !== 'Completed'
  ).length
  const completedCount = events.filter(
    (e) => e.isHistorical || e.timing === 'completed' || e.status === 'Completed'
  ).length
  const totalRegistrations = events.reduce((sum, e) => sum + (e.registeredCount || 0), 0)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── Breadcrumb & Back Link ────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/organizers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c7fb4] hover:text-[#554b73] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Organizers</span>
        </Link>
      </div>

      {/* ── Feedback Banner ───────────────────────────────────── */}
      {statusFeedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium animate-fadeIn ${
            statusFeedback.type === 'success'
              ? 'bg-[#edf7ed] border-[#c8e6c9] text-[#2e7d32]'
              : 'bg-[#faeaee] border-[#f0c5cf] text-[#b85b71]'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2e7d32]" />
            <span>{statusFeedback.text}</span>
          </div>
          <button
            onClick={() => setStatusFeedback(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Organizer Profile Header Card ────────────────────── */}
      <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#ede7f5] shrink-0 border-2 border-[#cfc7df]">
              <img
                src={organizer.avatar}
                alt={organizer.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-[#1e1730]">{organizer.name}</h1>
                {organizer.title && (
                  <Badge variant="mauve" size="sm">
                    {organizer.title}
                  </Badge>
                )}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-[#e8f5e9] text-[#2e7d32]'
                      : 'bg-[#faeaee] text-[#b85b71]'
                  }`}
                >
                  {organizer.status}
                </span>
              </div>
              <p className="text-xs text-[#5a5168] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#7a7088]" />
                {organizer.email}
                {organizer.alternateEmail && (
                  <span className="text-[#7a7088]">({organizer.alternateEmail})</span>
                )}
              </p>
            </div>
          </div>

          {/* Status Toggle Action */}
          <div>
            <Button
              variant={isActive ? 'outline' : 'secondary'}
              size="sm"
              icon={isActive ? UserX : UserCheck}
              onClick={handleToggleStatus}
              className={isActive ? 'border-[#f0c5cf] text-[#b85b71] hover:bg-[#faeaee]' : ''}
            >
              {isActive ? 'Deactivate Organizer' : 'Activate Organizer'}
            </Button>
          </div>
        </div>

        {/* Association & Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-4 border-t border-[#ede7f5]">
          <div className="p-3.5 rounded-xl bg-[#ede8f6] border border-[#cfc7df]">
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Club / Committee</p>
            <p className="text-xs font-semibold text-[#1e1730] mt-0.5">{organizer.clubName || 'General'}</p>
            {organizer.committee && (
              <p className="text-[10px] text-[#7a7088] mt-0.5">{organizer.committee}</p>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-[#ede8f6] border border-[#cfc7df]">
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Total Events</p>
            <p className="text-xl font-bold text-[#1e1730] mt-0.5">{events.length}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#ede8f6] border border-[#cfc7df]">
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Active / Upcoming</p>
            <p className="text-xl font-bold text-[#1976d2] mt-0.5">{upcomingCount}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#ede8f6] border border-[#cfc7df]">
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Completed</p>
            <p className="text-xl font-bold text-[#5a5168] mt-0.5">{completedCount}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#ede8f6] border border-[#cfc7df]">
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Total Attendees</p>
            <p className="text-xl font-bold text-[#8c5942] mt-0.5">{totalRegistrations}</p>
          </div>
        </div>
      </div>

      {/* ── Managed Events List ───────────────────────────────── */}
      <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#ede7f5]">
          <div>
            <h2 className="text-base font-bold text-[#1e1730]">Managed Campus Events</h2>
            <p className="text-xs text-[#5a5168] mt-0.5">
              Events coordinated and administered by this organizer
            </p>
          </div>
          <span className="bg-[#fae4d7] text-[#8c5942] px-2.5 py-1 rounded-full text-xs font-bold">
            {events.length} {events.length === 1 ? 'Event' : 'Events'}
          </span>
        </div>

        {events.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f2edf8] text-[#7a7088] flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#1e1730]">No events found</p>
            <p className="text-xs text-[#5a5168] mt-1 max-w-xs mx-auto">
              This organizer has not yet coordinated any campus events.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const catVariant = categoryBadgeMap[event.category] || 'lavender'
              const statVariant = statusBadgeMap[event.status] || 'neutral'

              return (
                <div
                  key={event.id}
                  className="bg-[#ede8f6] border border-[#cfc7df] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#cfc4de] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#ede7f5] shrink-0 border border-[#cfc7df]">
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
                        className="text-sm font-bold text-[#1e1730] hover:text-[#8c7fb4] transition-colors flex items-center gap-1.5 line-clamp-1"
                      >
                        <span>{event.title || event.name}</span>
                        <ExternalLink className="w-3 h-3 text-[#7a7088]" />
                      </Link>

                      <div className="flex items-center gap-4 text-xs text-[#5a5168] flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5 text-[#8c7fb4]" />
                          {event.date}
                        </span>
                        {event.time && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#7a7088]" />
                            {event.time}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#7a7088]" />
                          {event.venue}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#7a7088]" />
                          <strong>{event.registeredCount || 0}</strong> registered
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center self-end shrink-0">
                    <Link
                      to={`/admin/events/${event.id}/manage`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#e8e3f7] text-[#554b73] rounded-lg text-xs font-semibold hover:bg-[#ded7ef] transition-colors"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>Manage</span>
                    </Link>
                    <Link
                      to={`/admin/events/${event.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#f5eff9] text-[#554b73] rounded-lg text-xs font-semibold hover:bg-[#e8e3f7] transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
