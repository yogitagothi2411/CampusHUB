import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { getEventById } from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import RegistrationModal from '../../components/events/RegistrationModal'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Building,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trophy,
  Medal,
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

export default function EventDetails() {
  const { eventId } = useParams()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  const backPath = isAdmin ? '/admin/events' : '/student/events'
  const backLabel = isAdmin ? 'Back to All Events' : 'Back to Events'

  const [rawEvent, setRawEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Registered status & live attendee count
  const [isRegistered, setIsRegistered] = useState(false)
  const [registeredAttendee, setRegisteredAttendee] = useState(null)
  const [registeredCount, setRegisteredCount] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    getEventById(eventId)
      .then((data) => {
        setRawEvent(data)
        if (data) {
          setRegisteredCount(data.registeredCount || 0)
        }
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load event details')
        setLoading(false)
      })
  }

  useEffect(() => {
    let ignore = false
    getEventById(eventId)
      .then((data) => {
        if (!ignore) {
          setRawEvent(data)
          if (data) {
            setRegisteredCount(data.registeredCount || 0)
          }
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load event details')
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [eventId])

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-6 w-36 bg-[#e4dced] rounded-lg" />
        <div className="rounded-2xl border border-[#cfc7df] bg-[#f0ebf8] overflow-hidden">
          <div className="h-64 sm:h-80 md:h-96 bg-[#ede7f5]" />
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-[#f5eff9]">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-[#e4dced] rounded-lg" />
              ))}
            </div>
            <div className="h-20 bg-[#dcd6ea] rounded-xl" />
            <div className="space-y-3">
              <div className="h-4 bg-[#e4dced] rounded w-1/4" />
              <div className="h-3 bg-[#e4dced] rounded w-full" />
              <div className="h-3 bg-[#e4dced] rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="py-12 flex justify-center">
        <Card className="w-full max-w-md text-center py-10 px-8 bg-[#f0ebf8] border-[#cfc7df]">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#faeaee] text-[#b85b71] flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#1e1730]">Unable to Load Event</h1>
          <p className="mt-2 text-xs text-[#5a5168]">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="primary" icon={RefreshCw} onClick={handleRetry}>
              Retry
            </Button>
            <Link to={backPath}>
              <Button variant="outline" icon={ArrowLeft}>
                {backLabel}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // Nonexistent/invalid event handling
  if (!rawEvent) {
    return (
      <div className="py-12 flex justify-center">
        <Card className="w-full max-w-md text-center py-10 px-8 bg-[#f0ebf8] border-[#cfc7df]">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#faeaee] text-[#b85b71] flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#1e1730]">Event Not Found</h1>
          <p className="mt-2 text-xs text-[#5a5168]">
            The event &quot;{eventId}&quot; does not exist or may have been removed.
          </p>
          <div className="mt-6">
            <Link to={backPath}>
              <Button variant="primary" icon={ArrowLeft}>
                {backLabel}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const categoryVariant = categoryBadgeMap[rawEvent.category] || 'lavender'
  const isCapacityFull =
    rawEvent.registrationLimit && registeredCount >= rawEvent.registrationLimit
  const isCompleted = rawEvent.timing === 'completed'
  const percentageFilled = rawEvent.registrationLimit
    ? Math.min(100, Math.round((registeredCount / rawEvent.registrationLimit) * 100))
    : 0

  const handleRegisterSuccess = (info) => {
    setIsRegistered(true)
    setRegisteredAttendee(info)
    setRegisteredCount((prev) => prev + 1)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb & Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to={backPath}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c7fb4] hover:text-[#5c507c] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backLabel}</span>
        </Link>

        <Badge variant={categoryVariant} size="md">
          {rawEvent.category}
        </Badge>
      </div>

      {/* Hero Card */}
      <Card padding="p-0" className="overflow-hidden bg-[#f0ebf8] border-[#cfc7df]">
        {/* Event Cover Image */}
        <div className="relative w-full h-64 sm:h-80 md:h-96 bg-[#ede7f5] overflow-hidden">
          <img
            src={rawEvent.image}
            alt={rawEvent.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2a2337]/80 via-transparent to-transparent" />
          
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="neutral" size="sm" className="bg-white/20 text-white border-white/30 backdrop-blur-sm font-semibold">
                {rawEvent.status}
              </Badge>
              {rawEvent.achievement && (
                <Badge variant="neutral" size="sm" className="bg-[#faede4]/90 text-[#613622] border-transparent font-medium">
                  🏆 {rawEvent.achievement}
                </Badge>
              )}
            </div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight leading-tight drop-shadow-xs">
              {rawEvent.title}
            </h1>
          </div>
        </div>

        {/* Action & Metadata Header Bar */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-[#f5eff9] border border-[#cfc7df]">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#e8e3f7] flex items-center justify-center text-[#8c7fb4] shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">
                  Date
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[#1e1730]">
                  {rawEvent.date}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#faede4] flex items-center justify-center text-[#8c5942] shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">
                  Time
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[#1e1730] truncate block">
                  {rawEvent.time}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#e7eff9] flex items-center justify-center text-[#416287] shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">
                  Venue
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[#1e1730] truncate block">
                  {rawEvent.venue}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#faeaee] flex items-center justify-center text-[#8c5261] shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">
                  Organizer
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[#1e1730] truncate block">
                  {rawEvent.organizer}
                </span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-[#1e1730]">
              About This Event
            </h2>
            <p className="text-sm leading-relaxed text-[#5a5168]">
              {rawEvent.description}
            </p>
          </div>

          {/* Registration Section */}
          <div className="pt-6 border-t border-[#cfc7df] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#1e1730]">
                  Registration Status & Capacity
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#5a5168]">
                  <Users className="w-4 h-4 text-[#7a7088]" />
                  <span>
                    <strong>{registeredCount}</strong> of{' '}
                    <strong>{rawEvent.registrationLimit}</strong> seats filled
                  </span>
                  {rawEvent.registrationLimit && (
                    <span className="text-[#7a7088]">
                      ({rawEvent.registrationLimit - registeredCount} remaining)
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons depending on state */}
              <div>
                {isAdmin ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/admin/events/${rawEvent.id}/manage`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#8c7fb4] text-white rounded-xl text-xs font-semibold hover:bg-[#7b6ea3] transition-colors"
                    >
                      Manage Event
                    </Link>
                    <Link
                      to={`/admin/events/${rawEvent.id}/edit`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#e8e3f7] text-[#554b73] rounded-xl text-xs font-semibold hover:bg-[#ded7ef] transition-colors"
                    >
                      Edit Event
                    </Link>
                    <Link
                      to={`/admin/events/${rawEvent.id}/registrations`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#f6d8df] text-[#6b3546] rounded-xl text-xs font-semibold hover:bg-[#eed0d7] transition-colors"
                    >
                      Registrations ({registeredCount})
                    </Link>
                  </div>
                ) : isCompleted ? (
                  <Badge variant="neutral" size="lg">
                    Event Concluded
                  </Badge>
                ) : isRegistered ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e8e3f7] border border-[#d6cde9] text-[#544579]">
                    <CheckCircle2 className="w-4 h-4 text-[#8c7fb4]" />
                    <span className="text-xs font-bold">You are Registered</span>
                    {registeredAttendee?.ticketId && (
                      <span className="font-mono text-xs opacity-80">
                        ({registeredAttendee.ticketId})
                      </span>
                    )}
                  </div>
                ) : isCapacityFull ? (
                  <Button variant="outline" size="lg" disabled className="opacity-75">
                    Registration Limit Reached
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    icon={Sparkles}
                    onClick={() => setIsModalOpen(true)}
                  >
                    Register for Event
                  </Button>
                )}
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="w-full bg-[#ede7f5] h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCapacityFull ? 'bg-[#dfabb8]' : 'bg-[#8c7fb4]'
                }`}
                style={{ width: `${percentageFilled}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Event Outcomes & Gallery (completed events only) ── */}
      {isCompleted && (
        <div className="space-y-6">
          {/* Winner / Runner-up */}
          {(rawEvent.winner || rawEvent.runnerUp) && (
            <div className="rounded-2xl border border-[#cfc7df] bg-[#f0ebf8] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#cfc7df] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#faeaee] flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-[#a97c2f]" />
                </div>
                <h2 className="text-sm font-bold text-[#1e1730]">Event Results</h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rawEvent.winner && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-[#fdf7e4] border border-[#f0d97a]/50">
                    <div className="w-9 h-9 rounded-lg bg-[#f0d97a]/40 flex items-center justify-center shrink-0">
                      <span className="text-lg">🥇</span>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Winner</p>
                      <p className="text-sm font-bold text-[#1e1730] mt-0.5">{rawEvent.winner}</p>
                    </div>
                  </div>
                )}
                {rawEvent.runnerUp && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-[#f2edf8] border border-[#cfc7df]">
                    <div className="w-9 h-9 rounded-lg bg-[#e4dced] flex items-center justify-center shrink-0">
                      <span className="text-lg">🥈</span>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Runner-up</p>
                      <p className="text-sm font-bold text-[#1e1730] mt-0.5">{rawEvent.runnerUp}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photo Gallery */}
          {rawEvent.photos && rawEvent.photos.length > 0 && (
            <div className="rounded-2xl border border-[#cfc7df] bg-[#f0ebf8] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#cfc7df] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#e8e3f7] flex items-center justify-center">
                  <Medal className="w-4 h-4 text-[#8c7fb4]" />
                </div>
                <h2 className="text-sm font-bold text-[#1e1730]">Event Gallery</h2>
                <span className="ml-auto text-xs text-[#7a7088] font-medium">{rawEvent.photos.length} photos</span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {rawEvent.photos.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-xl overflow-hidden bg-[#ede7f5] group cursor-pointer"
                    >
                      <img
                        src={src}
                        alt={`${rawEvent.title} – photo ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-[#2a2337]/0 group-hover:bg-[#2a2337]/20 transition-colors duration-200 rounded-xl" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No results fallback */}
          {!rawEvent.winner && !rawEvent.runnerUp && (!rawEvent.photos || rawEvent.photos.length === 0) && (
            <div className="rounded-2xl border border-[#cfc7df] bg-[#f0ebf8] p-6 text-center text-xs text-[#7a7088]">
              This was a non-competitive event. No results or gallery available.
            </div>
          )}
        </div>
      )}

      {/* Registration Modal (students only) */}
      {!isAdmin && (
        <RegistrationModal
          event={rawEvent}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onRegisterSuccess={handleRegisterSuccess}
        />
      )}
    </div>
  )
}
