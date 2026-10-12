import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getOrganizerProfile, getOrganizerEvents } from '../../services/api'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import {
  UserCircle2,
  Mail,
  Building2,
  CalendarDays,
  CalendarCheck2,
  CheckCircle2,
  Users,
  Settings2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'

function StatCard({ label, value, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xl font-bold text-[#1e1730]">{value}</p>
        <p className="text-[11px] text-[#7a7088] font-medium">{label}</p>
      </div>
    </div>
  )
}

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

export default function OrganizerProfile() {
  const [profile, setProfile] = useState(null)
  const [recentEvents, setRecentEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [profileData, eventsData] = await Promise.all([
        getOrganizerProfile(),
        getOrganizerEvents(),
      ])
      setProfile(profileData)
      setRecentEvents((eventsData || []).slice(0, 5))
    } catch (err) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    async function init() {
      try {
        const [profileData, eventsData] = await Promise.all([
          getOrganizerProfile(),
          getOrganizerEvents(),
        ])
        if (!ignore) {
          setProfile(profileData)
          setRecentEvents((eventsData || []).slice(0, 5))
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load profile')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    init()
    return () => {
      ignore = true
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-pulse">
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-[#ede7f5] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-[#e4dced] rounded w-1/3" />
            <div className="h-3 bg-[#e4dced] rounded w-1/4" />
            <div className="h-3 bg-[#e4dced] rounded w-2/5" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#ede7f5] shrink-0" />
              <div className="space-y-1.5">
                <div className="h-4 bg-[#e4dced] rounded w-10" />
                <div className="h-3 bg-[#e4dced] rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center py-20">
        <Card className="w-full max-w-md text-center py-12 px-8 bg-[#f0ebf8] border-[#cfc7df]">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#faeaee] text-[#b85b71] flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-[#1e1730]">Unable to Load Profile</h1>
          <p className="text-xs text-[#5a5168] mt-1">{error}</p>
          <button
            onClick={load}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8c7fb4] text-white text-sm font-semibold hover:bg-[#7b6ea3] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </Card>
      </div>
    )
  }

  if (!profile) return null

  const initials = profile.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'O'

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page heading */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#fae4d7] flex items-center justify-center shrink-0">
          <UserCircle2 className="w-5 h-5 text-[#8c5942]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1e1730]">My Profile</h1>
          <p className="text-xs text-[#5a5168] mt-0.5">Your organizer account and activity overview</p>
        </div>
      </div>

      {/* Identity card */}
      <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full overflow-hidden bg-[#fae4d7] flex items-center justify-center shrink-0">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          ) : (
            <span className="text-2xl font-bold text-[#8c5942]">{initials}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h2 className="text-lg font-bold text-[#1e1730]">{profile.name}</h2>
            <Badge variant="peach">{profile.title || 'Event Organizer'}</Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-[#5a5168]">
              <Mail className="w-3.5 h-3.5 text-[#7a7088] shrink-0" />
              <span className="truncate">{profile.email}</span>
            </div>
            {profile.clubName && (
              <div className="flex items-center gap-2 text-sm text-[#5a5168]">
                <Building2 className="w-3.5 h-3.5 text-[#7a7088] shrink-0" />
                <span>{profile.clubName}</span>
              </div>
            )}
            {profile.committee && (
              <div className="flex items-center gap-2 text-xs text-[#7a7088]">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>{profile.committee}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {profile.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total Events"
            value={profile.stats.totalEvents}
            icon={CalendarDays}
            iconBg="bg-[#e8e3f7]"
            iconColor="text-[#8c7fb4]"
          />
          <StatCard
            label="Upcoming"
            value={profile.stats.upcoming}
            icon={CalendarCheck2}
            iconBg="bg-[#dbe8f6]"
            iconColor="text-[#416287]"
          />
          <StatCard
            label="Completed"
            value={profile.stats.completed}
            icon={CheckCircle2}
            iconBg="bg-[#d5ccdf]"
            iconColor="text-[#645873]"
          />
          <StatCard
            label="Registrations"
            value={profile.stats.totalRegistrations}
            icon={Users}
            iconBg="bg-[#fae4d7]"
            iconColor="text-[#8c5942]"
          />
        </div>
      )}

      {/* Recent managed events */}
      {recentEvents.length > 0 && (
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#cfc7df] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1e1730]">Recent Events</h3>
            <Link
              to="/organizer/events"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#b85b71] hover:text-[#6b3546] transition-colors"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#f0eaf5]">
            {recentEvents.map((event) => {
              const categoryVariant = categoryBadgeMap[event.category] || 'lavender'
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-[#faf7fc] transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#ede7f5] shrink-0 flex items-center justify-center">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <CalendarDays className="w-4 h-4 text-[#8c7fb4]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1e1730] truncate">{event.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={categoryVariant} size="sm">
                        {event.category}
                      </Badge>
                      <span className="text-[10px] text-[#7a7088]">{event.date}</span>
                    </div>
                  </div>

                  {/* Status pill */}
                  <span
                    className={`hidden sm:block text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      event.timing === 'completed'
                        ? 'bg-[#d5ccdf] text-[#443851]'
                        : event.timing === 'this_week'
                        ? 'bg-[#dbe8f6] text-[#334d6e]'
                        : 'bg-[#e8e3f7] text-[#554b73]'
                    }`}
                  >
                    {event.status}
                  </span>

                  {/* Manage link */}
                  <Link
                    to={`/organizer/events/${event.id}/manage`}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f6d8df] text-[#6b3546] text-xs font-semibold hover:bg-[#eed0d7] transition-colors"
                  >
                    <Settings2 className="w-3 h-3" />
                    <span className="hidden sm:block">Manage</span>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Account details */}
      <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-6 space-y-4">
        <h3 className="text-xs uppercase font-bold tracking-wider text-[#7a7088]">Account Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088] mb-1">Name</p>
            <p className="text-[#1e1730] font-medium">{profile.name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088] mb-1">Email</p>
            <p className="text-[#1e1730] font-medium truncate">{profile.email}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088] mb-1">Role</p>
            <p className="text-[#1e1730] font-medium capitalize">{profile.role || 'Organizer'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088] mb-1">Title</p>
            <p className="text-[#1e1730] font-medium">{profile.title || '—'}</p>
          </div>
          {profile.clubName && (
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088] mb-1">Club / Committee</p>
              <p className="text-[#1e1730] font-medium">{profile.clubName}</p>
            </div>
          )}
          {profile.committee && profile.committee !== profile.clubName && (
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088] mb-1">Committee</p>
              <p className="text-[#1e1730] font-medium">{profile.committee}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
