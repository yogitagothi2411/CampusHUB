import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getClubById, getEventsByClub } from '../../services/api'
import EventCard from '../../components/events/EventCard'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import {
  ArrowLeft,
  Mail,
  Calendar,
  History,
  Tag,
  AlertCircle,
  RefreshCw,
  Compass,
} from 'lucide-react'

export default function ClubDetails() {
  const { clubId } = useParams()

  const [club, setClub] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' | 'past'

  const handleFetch = () => {
    setLoading(true)
    setError(null)
    Promise.all([getClubById(clubId), getEventsByClub(clubId)])
      .then(([clubData, eventsData]) => {
        setClub(clubData || null)
        setEvents(eventsData || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load club details')
        setLoading(false)
      })
  }

  useEffect(() => {
    let ignore = false
    Promise.all([getClubById(clubId), getEventsByClub(clubId)])
      .then(([clubData, eventsData]) => {
        if (!ignore) {
          setClub(clubData || null)
          setEvents(eventsData || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load club details')
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [clubId])

  // Derive upcoming and past events dynamically from centralized events dataset
  const upcomingEvents = useMemo(() => {
    return events.filter(
      (e) => e.timing !== 'completed' && !e.isHistorical && e.status !== 'Completed'
    )
  }, [events])

  const pastEvents = useMemo(() => {
    return events.filter(
      (e) => e.timing === 'completed' || e.isHistorical || e.status === 'Completed'
    )
  }, [events])

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-6 w-32 bg-[#e4dced] rounded-lg" />
        <div className="h-60 rounded-3xl bg-[#ede7f5]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 rounded-2xl bg-[#f0ebf8] border border-[#cfc7df]" />
          <div className="h-40 rounded-2xl bg-[#f0ebf8] border border-[#cfc7df]" />
        </div>
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
          <h1 className="text-lg font-bold text-[#1e1730]">Unable to Load Club</h1>
          <p className="text-xs text-[#5a5168] mt-1">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="primary" icon={RefreshCw} onClick={handleFetch}>
              Retry
            </Button>
            <Link to="/student/clubs">
              <Button variant="outline" icon={ArrowLeft}>
                Back to Clubs
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="flex justify-center py-20">
        <Card className="w-full max-w-md text-center py-12 px-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#faeaee] text-[#b85b71] flex items-center justify-center mb-4">
            <Compass className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-[#1e1730]">Club Not Found</h1>
          <p className="text-xs text-[#5a5168] mt-1">
            We could not find any club with ID &quot;{clubId}&quot;.
          </p>
          <div className="mt-6 flex justify-center">
            <Link to="/student/clubs">
              <Button variant="primary" icon={ArrowLeft}>
                Browse All Clubs
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* ── Breadcrumb / Back button ───────────────────────── */}
      <div>
        <Link
          to="/student/clubs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c7fb4] hover:text-[#554b73] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Clubs
        </Link>
      </div>

      {/* ── Hero Banner ────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border border-[#cfc7df] bg-[#f0ebf8] shadow-xs">
        {/* Cover Photo */}
        <div className="h-44 sm:h-56 relative overflow-hidden bg-[#ede7f5]">
          <img
            src={club.coverImage || club.image}
            alt={club.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2a2337]/70 via-[#2a2337]/20 to-transparent" />
        </div>

        {/* Club Profile Card */}
        <div className="p-6 sm:p-8 -mt-16 sm:-mt-20 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-[#ede7f5] shrink-0">
              <img
                src={club.image}
                alt={club.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Badges */}
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="lavender" size="sm">
                  {club.category}
                </Badge>
                <Badge variant="powder" size="sm">
                  {club.committee}
                </Badge>
                <span className="text-xs text-[#7a7088]">• {club.membersCount} active members</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1e1730] tracking-tight">
                {club.name}
              </h1>
            </div>

            {/* Stats summary */}
            <div className="flex items-center gap-3 self-start sm:self-end">
              <div className="px-4 py-2 rounded-xl bg-[#ede8f6] border border-[#cfc7df] text-center shadow-2xs">
                <span className="block text-lg font-bold text-[#1e1730]">{events.length}</span>
                <span className="block text-[10px] uppercase font-bold text-[#7a7088]">
                  Total Events
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#e8e3f7] border border-[#d6cde9] text-center shadow-2xs">
                <span className="block text-lg font-bold text-[#554b73]">
                  {upcomingEvents.length}
                </span>
                <span className="block text-[10px] uppercase font-bold text-[#554b73]">
                  Upcoming
                </span>
              </div>
            </div>
          </div>

          {/* Description & Contact */}
          <div className="mt-6 pt-6 border-t border-[#ede7f5] grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-xs font-bold text-[#7a7088] uppercase tracking-wider">About</h3>
              <p className="text-sm text-[#5a5168] leading-relaxed">{club.description}</p>

              {/* Tags */}
              {club.tags && club.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  <Tag className="w-3.5 h-3.5 text-[#7a7088]" />
                  {club.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-0.5 rounded-lg bg-[#ede7f5] text-[#554b73] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Box */}
            <div className="space-y-3 bg-[#f5eff9] p-4 rounded-2xl border border-[#cfc7df]">
              <h3 className="text-xs font-bold text-[#7a7088] uppercase tracking-wider">
                Leadership & Contact
              </h3>
              <div className="space-y-2 text-xs text-[#5a5168]">
                <div>
                  <span className="block text-[10px] font-bold text-[#7a7088] uppercase">
                    Coordinator
                  </span>
                  <span className="font-semibold text-[#1e1730]">{club.lead}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-[#7a7088] uppercase">
                    Official Email
                  </span>
                  <a
                    href={`mailto:${club.email}`}
                    className="inline-flex items-center gap-1.5 font-medium text-[#8c7fb4] hover:underline"
                  >
                    <Mail className="w-3 h-3" />
                    {club.email}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Club Events Tabs ─────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#cfc7df] pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#8c7fb4]" />
            <h2 className="text-lg font-bold text-[#1e1730]">Club Activities & Events</h2>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#f0ebf8] rounded-xl border border-[#cfc7df]">
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-[#8c7fb4] text-white shadow-2xs font-semibold'
                  : 'text-[#5a5168] hover:text-[#1e1730]'
              }`}
            >
              Upcoming ({upcomingEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('past')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'past'
                  ? 'bg-[#8c7fb4] text-white shadow-2xs font-semibold'
                  : 'text-[#5a5168] hover:text-[#1e1730]'
              }`}
            >
              Past Archive ({pastEvents.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'upcoming' ? (
          upcomingEvents.length === 0 ? (
            <Card className="text-center py-12 px-6 bg-[#f0ebf8] border-[#cfc7df]">
              <div className="w-10 h-10 rounded-full bg-[#ede7f5] text-[#8c7fb4] mx-auto flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1e1730]">No upcoming events scheduled</h3>
              <p className="text-xs text-[#5a5168] mt-1 max-w-sm mx-auto">
                {club.name} currently has no upcoming active events. Check the past archive to see earlier initiatives.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>
          )
        ) : pastEvents.length === 0 ? (
          <Card className="text-center py-12 px-6 bg-[#f0ebf8] border-[#cfc7df]">
            <div className="w-10 h-10 rounded-full bg-[#ede7f5] text-[#8c7fb4] mx-auto flex items-center justify-center mb-3">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1e1730]">No past events archived</h3>
            <p className="text-xs text-[#5a5168] mt-1 max-w-sm mx-auto">
              There are no completed event records on file for {club.name}.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
