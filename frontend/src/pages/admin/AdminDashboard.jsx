import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EVENTS } from '../../data/events'
import { USERS } from '../../data/users'
import { CLUBS } from '../../data/clubs'
import { MOCK_REGISTRATIONS } from '../../data/registrations'
import { CATEGORIES_CONFIG } from '../../data/categories'
import Badge from '../../components/common/Badge'
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  GraduationCap,
  Users,
  Building2,
  ClipboardList,
  ArrowRight,
  Tag,
  Trophy,
  MapPin,
  CalendarDays,
} from 'lucide-react'

// ── Badge colour map (consistent with rest of app) ────────────────────────────
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

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconBg, iconColor, accent }) {
  return (
    <div
      className={`bg-[#dcd6ea] border ${accent || 'border-[#c4bacf]'} rounded-2xl p-5 flex items-center gap-4`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1e1730]">{value}</p>
        <p className="text-[11px] text-[#7a7088] font-medium">{label}</p>
      </div>
    </div>
  )
}

// ── Quick action card ─────────────────────────────────────────────────────────
function ActionCard({ to, icon: Icon, label, desc, iconBg, iconColor }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 p-4 bg-[#dcd6ea] border border-[#c4bacf] rounded-2xl hover:border-[#c7bccf] hover:bg-[#f5f2f9] transition-all duration-200"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#1e1730]">{label}</p>
        <p className="text-xs text-[#7a7088] truncate">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-[#7a7088] shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, to }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-bold text-[#1e1730]">{title}</h2>
      {to && (
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#8c7fb4] hover:text-[#554b73] transition-colors"
        >
          View All
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  // ── Derived statistics ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const isCompleted = (e) =>
      e.isHistorical === true || e.timing === 'completed' || e.status === 'Completed'

    const totalEvents = EVENTS.length
    const upcomingEvents = EVENTS.filter((e) => !isCompleted(e))
    const completedEvents = EVENTS.filter(isCompleted)

    const totalStudents = USERS.filter((u) => u.role === 'student').length
    const totalOrganizers = USERS.filter((u) => u.role === 'organizer').length
    const totalClubs = CLUBS.length

    // Total registrations across all events (registeredCount is the authoritative field)
    const totalRegistrations = EVENTS.reduce((acc, e) => acc + (e.registeredCount || 0), 0)

    // Category breakdown (all events including historical)
    const categoryMap = {}
    EVENTS.forEach((e) => {
      if (e.category) {
        categoryMap[e.category] = (categoryMap[e.category] || 0) + 1
      }
    })
    const categoryBreakdown = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))

    // Top events by registeredCount (upcoming only)
    const topEvents = [...upcomingEvents]
      .sort((a, b) => (b.registeredCount || 0) - (a.registeredCount || 0))
      .slice(0, 5)

    // Explicit registration entries (from MOCK_REGISTRATIONS)
    const explicitRegTotal = Object.values(MOCK_REGISTRATIONS).reduce(
      (acc, arr) => acc + arr.length,
      0
    )

    return {
      totalEvents,
      upcomingCount: upcomingEvents.length,
      completedCount: completedEvents.length,
      totalStudents,
      totalOrganizers,
      totalClubs,
      totalRegistrations,
      explicitRegTotal,
      upcomingEvents,
      completedEvents,
      categoryBreakdown,
      topEvents,
    }
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* ── Page heading ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#d5ccdf] flex items-center justify-center shrink-0">
          <LayoutDashboard className="w-5 h-5 text-[#443851]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1e1730]">Admin Dashboard</h1>
          <p className="text-xs text-[#5a5168] mt-0.5">campusEventHUB — Platform overview</p>
        </div>
      </div>

      {/* ── Summary stat cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Events"
          value={stats.totalEvents}
          icon={Calendar}
          iconBg="bg-[#e8e3f7]"
          iconColor="text-[#8c7fb4]"
        />
        <StatCard
          label="Upcoming"
          value={stats.upcomingCount}
          icon={CalendarCheck2}
          iconBg="bg-[#dbe8f6]"
          iconColor="text-[#416287]"
          accent="border-[#d2e2f0]"
        />
        <StatCard
          label="Completed"
          value={stats.completedCount}
          icon={CheckCircle2}
          iconBg="bg-[#d5ccdf]"
          iconColor="text-[#443851]"
          accent="border-[#cec5d9]"
        />
        <StatCard
          label="Registrations"
          value={stats.totalRegistrations}
          icon={ClipboardList}
          iconBg="bg-[#fae4d7]"
          iconColor="text-[#8c5942]"
          accent="border-[#f0d5c4]"
        />
        <StatCard
          label="Students"
          value={stats.totalStudents}
          icon={GraduationCap}
          iconBg="bg-[#dbe8f6]"
          iconColor="text-[#334d6e]"
        />
        <StatCard
          label="Organizers"
          value={stats.totalOrganizers}
          icon={Users}
          iconBg="bg-[#f6d8df]"
          iconColor="text-[#b85b71]"
        />
        <StatCard
          label="Clubs & Committees"
          value={stats.totalClubs}
          icon={Building2}
          iconBg="bg-[#e8e3f7]"
          iconColor="text-[#554b73]"
        />
        <StatCard
          label="Categories"
          value={CATEGORIES_CONFIG.length}
          icon={Tag}
          iconBg="bg-[#d5ccdf]"
          iconColor="text-[#5a4e6a]"
        />
      </div>

      {/* ── Two-column area: upcoming events + registration top ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming Events */}
        <div className="bg-[#dcd6ea] border border-[#c4bacf] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#c4bacf]">
            <SectionHeader title="Upcoming Events" to="/admin/events" />
          </div>
          {stats.upcomingEvents.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#7a7088]">No upcoming events.</div>
          ) : (
            <div className="divide-y divide-[#ede8f3]">
              {stats.upcomingEvents.slice(0, 6).map((event) => {
                const variant = categoryBadgeMap[event.category] || 'lavender'
                return (
                  <div key={event.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-[#f5f2f9] transition-colors">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#ede7f5] shrink-0 mt-0.5">
                      {event.image && (
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1e1730] truncate">{event.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <Badge variant={variant} size="sm">{event.category}</Badge>
                        <span className="flex items-center gap-1 text-[10px] text-[#7a7088]">
                          <CalendarDays className="w-3 h-3" />
                          {event.date}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-[#7a7088] mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </span>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                        event.timing === 'this_week'
                          ? 'bg-[#dbe8f6] text-[#334d6e]'
                          : event.timing === 'this_month'
                          ? 'bg-[#e8e3f7] text-[#554b73]'
                          : 'bg-[#f6d8df] text-[#6b3546]'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top Events by Registration */}
        <div className="bg-[#dcd6ea] border border-[#c4bacf] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#c4bacf]">
            <SectionHeader title="Top Events by Registration" to="/admin/events" />
          </div>
          {stats.topEvents.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#7a7088]">No registration data.</div>
          ) : (
            <div className="divide-y divide-[#ede8f3]">
              {stats.topEvents.map((event, idx) => {
                const fillPct = event.registrationLimit
                  ? Math.min(100, Math.round((event.registeredCount / event.registrationLimit) * 100))
                  : 0
                const isFull = event.registrationLimit && event.registeredCount >= event.registrationLimit
                return (
                  <div key={event.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="w-5 text-[11px] font-bold text-[#7a7088] shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1e1730] truncate">{event.title}</p>
                      {event.registrationLimit > 0 ? (
                        <div className="mt-1.5">
                          <div className="flex justify-between text-[10px] text-[#7a7088] mb-0.5">
                            <span>{event.registeredCount} / {event.registrationLimit}</span>
                            <span>{fillPct}%</span>
                          </div>
                          <div className="w-full bg-[#ede7f5] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isFull ? 'bg-[#dfabb8]' : 'bg-[#8c7fb4]'}`}
                              style={{ width: `${fillPct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#b0a8bc] italic">No limit set</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Completed events ──────────────────────────────────────────────── */}
      {stats.completedEvents.length > 0 && (
        <div className="bg-[#dcd6ea] border border-[#c4bacf] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#c4bacf]">
            <SectionHeader title="Recent Completed Events" />
          </div>
          <div className="divide-y divide-[#ede8f3]">
            {stats.completedEvents.slice(0, 4).map((event) => {
              const variant = categoryBadgeMap[event.category] || 'lavender'
              return (
                <div key={event.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#f5f2f9] transition-colors">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#ede7f5] shrink-0">
                    {event.image && (
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#1e1730] truncate">{event.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <Badge variant={variant} size="sm">{event.category}</Badge>
                      <span className="text-[10px] text-[#7a7088]">{event.date}</span>
                    </div>
                    {event.achievement && (
                      <p className="text-[10px] text-[#5a5168] mt-1 flex items-start gap-1">
                        <Trophy className="w-3 h-3 shrink-0 mt-0.5 text-[#7a7088]" />
                        <span className="line-clamp-1">{event.achievement}</span>
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d5ccdf] text-[#443851]">
                    Completed
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Two-column area: category breakdown + quick actions ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Category breakdown */}
        <div className="bg-[#dcd6ea] border border-[#c4bacf] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#c4bacf]">
            <SectionHeader title="Events by Category" />
          </div>
          <div className="px-5 py-4 space-y-3">
            {stats.categoryBreakdown.length === 0 ? (
              <p className="text-xs text-[#7a7088] text-center py-4">No category data.</p>
            ) : (
              stats.categoryBreakdown.map(({ name, count }) => {
                const maxCount = stats.categoryBreakdown[0].count
                const pct = Math.round((count / maxCount) * 100)
                const variant = categoryBadgeMap[name] || 'lavender'
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-20 shrink-0">
                      <Badge variant={variant} size="sm">{name}</Badge>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-[#ede7f5] h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#8c7fb4]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#1e1730] w-4 text-right shrink-0">
                        {count}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="mb-3">
            <h2 className="text-sm font-bold text-[#1e1730]">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <ActionCard
              to="/admin/events"
              icon={Calendar}
              label="Manage Events"
              desc="View and moderate all campus events"
              iconBg="bg-[#e8e3f7]"
              iconColor="text-[#8c7fb4]"
            />
            <ActionCard
              to="/admin/students"
              icon={GraduationCap}
              label="Manage Students"
              desc="Browse the student directory"
              iconBg="bg-[#dbe8f6]"
              iconColor="text-[#416287]"
            />
            <ActionCard
              to="/admin/organizers"
              icon={Users}
              label="Manage Organizers"
              desc="Approve and manage organizers"
              iconBg="bg-[#fae4d7]"
              iconColor="text-[#8c5942]"
            />
            <ActionCard
              to="/admin/clubs"
              icon={Building2}
              label="Manage Clubs"
              desc="Oversee clubs and committees"
              iconBg="bg-[#f6d8df]"
              iconColor="text-[#b85b71]"
            />
            <ActionCard
              to="/admin/categories"
              icon={Tag}
              label="Manage Categories"
              desc="Configure event categories"
              iconBg="bg-[#d5ccdf]"
              iconColor="text-[#443851]"
            />
            <ActionCard
              to="/admin/reports"
              icon={ClipboardList}
              label="View Reports"
              desc="Participation and activity analytics"
              iconBg="bg-[#dbe8f6]"
              iconColor="text-[#334d6e]"
            />
          </div>
        </div>
      </div>

    </div>
  )
}

