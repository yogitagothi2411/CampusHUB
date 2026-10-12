import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getOrganizerEvents } from '../../services/api'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import {
  CalendarDays,
  CalendarCheck2,
  CheckCircle2,
  Users,
  PlusCircle,
  TrendingUp,
  ArrowRight,
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

function StatCard({ label, value, icon: Icon, iconBg, iconColor, accent }) {
  return (
    <div
      className={`bg-[#f0ebf8] border ${accent || 'border-[#cfc7df]'} rounded-2xl p-5 flex items-center gap-4`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1e1730]">{value}</p>
        <p className="text-xs text-[#7a7088] font-medium">{label}</p>
      </div>
    </div>
  )
}

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getOrganizerEvents()
      setEvents(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load organizer dashboard data')
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
          setEvents(data || [])
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load organizer dashboard data')
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

  const stats = useMemo(() => {
    const total = events.length
    const upcoming = events.filter(
      (e) => e.timing === 'current' || e.timing === 'this_week' || e.timing === 'this_month'
    ).length
    const completed = events.filter(
      (e) => e.timing === 'completed' || e.isHistorical || e.status === 'Completed'
    ).length
    const totalRegistrations = events.reduce((acc, e) => acc + (e.registeredCount || 0), 0)
    return { total, upcoming, completed, totalRegistrations }
  }, [events])

  const recentEvents = useMemo(
    () => [...events].slice(0, 4),
    [events]
  )

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1e1730]">Dashboard</h1>
          <p className="text-xs text-[#5a5168] mt-0.5">
            Overview of your events and registrations
          </p>
        </div>
        <Link
          to="/organizer/events/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#f6d8df] hover:bg-[#eed0d7] text-[#6b3546] rounded-xl text-sm font-semibold transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Event
        </Link>
      </div>

      {/* Error alert */}
      {error && (
        <Card className="text-center py-8 px-6 bg-[#f0ebf8] border-[#cfc7df]">
          <div className="w-10 h-10 rounded-full bg-[#faeaee] text-[#b85b71] mx-auto flex items-center justify-center mb-3">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-[#1e1730]">Unable to load dashboard data</h3>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Events"
          value={loading ? '-' : stats.total}
          icon={CalendarDays}
          iconBg="bg-[#e8e3f7]"
          iconColor="text-[#8c7fb4]"
        />
        <StatCard
          label="Upcoming"
          value={loading ? '-' : stats.upcoming}
          icon={CalendarCheck2}
          iconBg="bg-[#dbe8f6]"
          iconColor="text-[#416287]"
          accent="border-[#dbe8f6]"
        />
        <StatCard
          label="Completed"
          value={loading ? '-' : stats.completed}
          icon={CheckCircle2}
          iconBg="bg-[#d5ccdf]"
          iconColor="text-[#645873]"
        />
        <StatCard
          label="Total Registrations"
          value={loading ? '-' : stats.totalRegistrations}
          icon={Users}
          iconBg="bg-[#fae4d7]"
          iconColor="text-[#8c5942]"
          accent="border-[#fae4d7]"
        />
      </div>

      {/* Recent Events */}
      <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#cfc7df] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-4 h-4 text-[#7a7088]" />
            <h2 className="text-sm font-bold text-[#1e1730]">Recent Events</h2>
          </div>
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
            const isFull =
              event.registrationLimit && event.registeredCount >= event.registrationLimit
            const fillPercent = event.registrationLimit
              ? Math.min(100, Math.round((event.registeredCount / event.registrationLimit) * 100))
              : 0

            return (
              <div
                key={event.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-[#faf7fc] transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#ede7f5] shrink-0">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1e1730] truncate">{event.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={categoryVariant} size="sm">
                      {event.category}
                    </Badge>
                    <span className="text-[10px] text-[#7a7088]">{event.date}</span>
                  </div>
                </div>

                {/* Registration fill */}
                {event.registrationLimit > 0 && (
                  <div className="hidden sm:block w-28 shrink-0">
                    <div className="flex justify-between text-[10px] text-[#7a7088] mb-1">
                      <span>{event.registeredCount}/{event.registrationLimit}</span>
                      <span>{fillPercent}%</span>
                    </div>
                    <div className="w-full bg-[#ede7f5] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isFull ? 'bg-[#dfabb8]' : 'bg-[#8c7fb4]'}`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      event.timing === 'completed'
                        ? 'bg-[#d5ccdf] text-[#443851]'
                        : event.timing === 'this_week'
                        ? 'bg-[#dbe8f6] text-[#334d6e]'
                        : 'bg-[#e8e3f7] text-[#554b73]'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="shrink-0 hidden sm:flex items-center gap-2">
                  <Link
                    to={`/organizer/events/${event.id}/manage`}
                    className="text-xs font-semibold text-[#b85b71] hover:text-[#6b3546] transition-colors"
                  >
                    Manage
                  </Link>
                  <span className="text-[#d5ccdf]">|</span>
                  <Link
                    to={`/organizer/events/${event.id}/edit`}
                    className="text-xs font-semibold text-[#8c7fb4] hover:text-[#554b73] transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/organizer/events/create"
          className="group flex items-center gap-4 p-5 bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl hover:border-[#f6d8df] hover:bg-[#fdf6f8] transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-[#f6d8df] flex items-center justify-center shrink-0 group-hover:bg-[#eed0d7] transition-colors">
            <PlusCircle className="w-5 h-5 text-[#b85b71]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e1730]">Create New Event</p>
            <p className="text-xs text-[#7a7088] mt-0.5">Publish a new event for students</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#7a7088] ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/organizer/events"
          className="group flex items-center gap-4 p-5 bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl hover:border-[#e8e3f7] hover:bg-[#f8f6fb] transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-[#e8e3f7] flex items-center justify-center shrink-0 group-hover:bg-[#ded7ef] transition-colors">
            <CalendarDays className="w-5 h-5 text-[#8c7fb4]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e1730]">Manage My Events</p>
            <p className="text-xs text-[#7a7088] mt-0.5">View and edit your published events</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#7a7088] ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
