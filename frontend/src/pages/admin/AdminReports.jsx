import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getEvents,
  getClubs,
  getCategories,
  getOrganizers,
  getStudents,
} from '../../services/api'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import {
  BarChart3,
  CalendarDays,
  Building2,
  Tag,
  Users,
  Clock,
  TrendingUp,
  Award,
  Search,
  Filter,
  Printer,
  ChevronRight,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react'

export default function AdminReports() {
  const [events, setEvents] = useState([])
  const [clubs, setClubs] = useState([])
  const [categories, setCategories] = useState([])
  const [organizers, setOrganizers] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [selectedYear, setSelectedYear] = useState('All')
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'categories' | 'clubs' | 'timeline' | 'organizers'
  const [searchFilter, setSearchFilter] = useState('')

  useEffect(() => {
    let ignore = false

    Promise.all([
      getEvents({ includeCompleted: true }),
      getClubs(),
      getCategories(),
      getOrganizers(),
      getStudents(),
    ])
      .then(([eventsData, clubsData, catsData, orgsData, studentsData]) => {
        if (!ignore) {
          setEvents(eventsData || [])
          setClubs(clubsData || [])
          setCategories(catsData || [])
          setOrganizers(orgsData || [])
          setStudents(studentsData || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to compile reports')
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  // Helper to extract year from event
  const getEventYear = (evt) => {
    if (evt.date && evt.date.match(/\b(202\d)\b/)) {
      return evt.date.match(/\b(202\d)\b/)[1]
    }
    if (evt.id && evt.id.match(/\b(202\d)\b/)) {
      return evt.id.match(/\b(202\d)\b/)[1]
    }
    return evt.year ? String(evt.year) : '2026'
  }

  // Filter events by selected year
  const filteredEvents = useMemo(() => {
    if (selectedYear === 'All') return events
    return events.filter((e) => getEventYear(e) === selectedYear)
  }, [events, selectedYear])

  // Available years
  const availableYears = useMemo(() => {
    const set = new Set()
    events.forEach((e) => set.add(getEventYear(e)))
    return ['All', ...Array.from(set).sort((a, b) => b.localeCompare(a))]
  }, [events])

  // --- 1. Core KPIs ---
  const kpis = useMemo(() => {
    const totalEvents = filteredEvents.length
    const upcomingEvents = filteredEvents.filter(
      (e) => !e.isHistorical && e.timing !== 'completed' && e.status !== 'Completed'
    ).length
    const completedEvents = filteredEvents.filter(
      (e) => e.isHistorical || e.timing === 'completed' || e.status === 'Completed'
    ).length
    const totalRegistrations = filteredEvents.reduce(
      (acc, e) => acc + (e.registeredCount || 0),
      0
    )
    const totalCapacity = filteredEvents.reduce(
      (acc, e) => acc + (e.registrationLimit || 0),
      0
    )
    const capacityUtilization =
      totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0
    const activeClubsCount = clubs.filter((c) => (c.status || 'Active') === 'Active').length
    const avgRegistrations =
      totalEvents > 0 ? Math.round(totalRegistrations / totalEvents) : 0

    return {
      totalEvents,
      upcomingEvents,
      completedEvents,
      totalRegistrations,
      totalCapacity,
      capacityUtilization,
      activeClubsCount,
      avgRegistrations,
    }
  }, [filteredEvents, clubs])

  // --- 2. Category Distribution ---
  const categoryStats = useMemo(() => {
    const map = {}
    filteredEvents.forEach((e) => {
      const cat = e.category || 'General'
      if (!map[cat]) {
        map[cat] = {
          name: cat,
          total: 0,
          upcoming: 0,
          completed: 0,
          registrations: 0,
          capacity: 0,
        }
      }
      map[cat].total += 1
      map[cat].registrations += e.registeredCount || 0
      map[cat].capacity += e.registrationLimit || 0
      if (e.isHistorical || e.timing === 'completed' || e.status === 'Completed') {
        map[cat].completed += 1
      } else {
        map[cat].upcoming += 1
      }
    })

    const list = Object.values(map).sort((a, b) => b.total - a.total)
    const maxCount = Math.max(...list.map((c) => c.total), 1)

    return list.map((c) => ({
      ...c,
      percentOfTotal: kpis.totalEvents > 0 ? Math.round((c.total / kpis.totalEvents) * 100) : 0,
      relativeWidth: Math.round((c.total / maxCount) * 100),
    }))
  }, [filteredEvents, kpis.totalEvents])

  // --- 3. Club Engagement ---
  const clubStats = useMemo(() => {
    const list = clubs.map((club) => {
      const clubEvts = filteredEvents.filter(
        (e) => e.clubId === club.id || (e.organizer && e.organizer.includes(club.name))
      )
      const upcoming = clubEvts.filter(
        (e) => !e.isHistorical && e.timing !== 'completed' && e.status !== 'Completed'
      ).length
      const completed = clubEvts.filter(
        (e) => e.isHistorical || e.timing === 'completed' || e.status === 'Completed'
      ).length
      const regs = clubEvts.reduce((sum, e) => sum + (e.registeredCount || 0), 0)

      return {
        id: club.id,
        name: club.name,
        shortName: club.shortName || club.name,
        committee: club.committee || club.category,
        lead: club.lead || 'Student Lead',
        membersCount: club.membersCount || 0,
        status: club.status || 'Active',
        totalEvents: clubEvts.length,
        upcomingEvents: upcoming,
        completedEvents: completed,
        totalRegistrations: regs,
        avgTurnout: clubEvts.length > 0 ? Math.round(regs / clubEvts.length) : 0,
      }
    })

    return list.sort((a, b) => b.totalEvents - a.totalEvents)
  }, [clubs, filteredEvents])

  // --- 4. Yearly Timeline ---
  const yearlyStats = useMemo(() => {
    const map = {}
    events.forEach((e) => {
      const yr = getEventYear(e)
      if (!map[yr]) {
        map[yr] = {
          year: yr,
          total: 0,
          completed: 0,
          upcoming: 0,
          registrations: 0,
          flagshipEvents: [],
        }
      }
      map[yr].total += 1
      map[yr].registrations += e.registeredCount || 0
      if (e.isHistorical || e.timing === 'completed' || e.status === 'Completed') {
        map[yr].completed += 1
      } else {
        map[yr].upcoming += 1
      }
      if (
        e.name.includes('Kreiva') ||
        e.name.includes('Cerebro') ||
        e.name.includes('HackIIITV') ||
        e.name.includes('OLYMPUS') ||
        e.name.includes('Alfaaz')
      ) {
        map[yr].flagshipEvents.push(e.name)
      }
    })

    return Object.values(map).sort((a, b) => b.year.localeCompare(a.year))
  }, [events])

  // --- 5. Organizer Event Counts ---
  const organizerStats = useMemo(() => {
    return organizers.map((org) => {
      const orgEvts = filteredEvents.filter(
        (e) =>
          e.organizerId === org.id ||
          e.clubId === org.clubId ||
          (org.managedEvents && org.managedEvents.includes(e.id))
      )
      const regs = orgEvts.reduce((sum, e) => sum + (e.registeredCount || 0), 0)

      return {
        ...org,
        filteredEventsCount: orgEvts.length,
        filteredRegistrations: regs,
      }
    })
  }, [organizers, filteredEvents])

  // Filtered views based on search box
  const searchLower = searchFilter.toLowerCase().trim()
  const displayCategories = categoryStats.filter((c) =>
    c.name.toLowerCase().includes(searchLower)
  )
  const displayClubs = clubStats.filter(
    (c) =>
      c.name.toLowerCase().includes(searchLower) ||
      c.lead.toLowerCase().includes(searchLower) ||
      c.committee.toLowerCase().includes(searchLower)
  )
  const displayOrganizers = organizerStats.filter(
    (o) =>
      o.name.toLowerCase().includes(searchLower) ||
      (o.clubName && o.clubName.toLowerCase().includes(searchLower)) ||
      (o.role && o.role.toLowerCase().includes(searchLower))
  )

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#dbe8f6] flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-[#334d6e]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e1730]">
              Campus Reports & Analytics
            </h1>
            <p className="text-xs text-[#5a5168] mt-0.5">
              Comprehensive institutional activity metrics, engagement data, and registration summaries
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 print:hidden">
          {/* Year selector */}
          <div className="flex items-center gap-1.5 bg-[#f0ebf8] border border-[#cfc7df] rounded-xl px-2.5 py-1.5 text-xs text-[#5a5168]">
            <Filter className="w-3.5 h-3.5 text-[#7a7088]" />
            <span className="text-[11px] text-[#7a7088]">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent focus:outline-none text-[#1e1730] font-semibold cursor-pointer text-xs"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr === 'All' ? 'All Academic Years' : `AY ${yr}`}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-1.5 text-xs py-2 px-3 bg-white"
          >
            <Printer className="w-3.5 h-3.5 text-[#5a5168]" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* ── Core Executive KPIs Strip ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Events */}
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#7a7088] font-medium">Total Events</span>
            <div className="w-8 h-8 rounded-lg bg-[#dbe8f6] flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-[#334d6e]" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-[#1e1730]">{kpis.totalEvents}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-[#2e7d32] bg-[#edf7ed] px-1.5 py-0.5 rounded font-semibold">
                {kpis.upcomingEvents} Upcoming
              </span>
              <span className="text-[10px] text-[#7a7088] bg-[#e4ddf0] px-1.5 py-0.5 rounded font-semibold">
                {kpis.completedEvents} Completed
              </span>
            </div>
          </div>
        </div>

        {/* Total Registrations */}
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#7a7088] font-medium">
              Total Registrations
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#faeaee] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#8a3852]" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-[#1e1730]">
              {kpis.totalRegistrations.toLocaleString()}
            </p>
            <p className="text-[11px] text-[#5a5168] mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3 text-[#2e7d32]" />
              <span>Avg {kpis.avgRegistrations} participants / event</span>
            </p>
          </div>
        </div>

        {/* Capacity Utilization */}
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#7a7088] font-medium">
              Capacity Utilization
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#faede4] flex items-center justify-center">
              <Award className="w-4 h-4 text-[#613622]" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-[#1e1730]">
              {kpis.capacityUtilization}%
            </p>
            <div className="w-full bg-[#cfc7df]/40 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-[#241c35] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(kpis.capacityUtilization, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active Campus Clubs */}
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#7a7088] font-medium">
              Active Organizations
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ede8f8] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#392e59]" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-[#1e1730]">
              {kpis.activeClubsCount}{' '}
              <span className="text-xs text-[#7a7088] font-normal">/ {clubs.length}</span>
            </p>
            <p className="text-[11px] text-[#5a5168] mt-1 font-medium">
              Across Technical, Cultural & Sports
            </p>
          </div>
        </div>
      </div>

      {/* ── Report Tabs & Quick Search ────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#cfc7df]/80 pb-2 print:hidden">
        {/* Tab buttons */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {[
            { id: 'overview', label: 'Overview Summary' },
            { id: 'categories', label: 'By Category' },
            { id: 'clubs', label: 'By Club & Committee' },
            { id: 'timeline', label: 'Yearly Timeline' },
            { id: 'organizers', label: 'Organizer Leadership' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#241c35] text-white shadow-xs'
                  : 'text-[#5a5168] hover:bg-[#e4ddf0] hover:text-[#1e1730]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Instant table search box */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7a7088]" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter current view..."
            className="w-full pl-8 pr-3 py-1.5 bg-white/80 border border-[#cfc7df] rounded-xl text-xs text-[#1e1730] placeholder-[#7a7088] focus:outline-none focus:border-[#7d6b97]"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-[#7a7088]">
          <div className="w-6 h-6 border-2 border-[#7d6b97] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Compiling analytics reports...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-xs text-[#b85b71] bg-[#faeaee] rounded-2xl border border-[#f0c5cf]">
          <AlertCircle className="w-6 h-6 mx-auto mb-1 text-[#b85b71]" />
          {error}
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════
              TAB 1: OVERVIEW SUMMARY
              ══════════════════════════════════════════════════════ */}
          {(activeTab === 'overview' || activeTab === 'categories') && (
            <div className="space-y-6">
              {/* Split Category & Lifecycle Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Event Lifecycle Breakdown Card */}
                <Card className="bg-[#f0ebf8] border-[#cfc7df] p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#cfc7df]/60 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#392e59]" />
                      <h3 className="font-bold text-sm text-[#1e1730]">
                        Upcoming vs. Completed Events
                      </h3>
                    </div>
                    <Badge variant="powder" size="sm">
                      {kpis.totalEvents} Total Records
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {/* Upcoming Bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-[#1e1730] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#2e7d32]" />
                          Upcoming & In-Progress
                        </span>
                        <span className="text-[#5a5168] font-bold">
                          {kpis.upcomingEvents} (
                          {kpis.totalEvents > 0
                            ? Math.round((kpis.upcomingEvents / kpis.totalEvents) * 100)
                            : 0}
                          %)
                        </span>
                      </div>
                      <div className="w-full bg-[#cfc7df]/40 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#2e7d32] h-full rounded-full"
                          style={{
                            width: `${
                              kpis.totalEvents > 0
                                ? (kpis.upcomingEvents / kpis.totalEvents) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Completed Bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-[#1e1730] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#7a7088]" />
                          Completed & Historical Records
                        </span>
                        <span className="text-[#5a5168] font-bold">
                          {kpis.completedEvents} (
                          {kpis.totalEvents > 0
                            ? Math.round((kpis.completedEvents / kpis.totalEvents) * 100)
                            : 0}
                          %)
                        </span>
                      </div>
                      <div className="w-full bg-[#cfc7df]/40 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#7a7088] h-full rounded-full"
                          style={{
                            width: `${
                              kpis.totalEvents > 0
                                ? (kpis.completedEvents / kpis.totalEvents) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Metric Details Box */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#cfc7df]/60 text-xs">
                      <div className="bg-white/60 p-3 rounded-xl border border-[#cfc7df]/60">
                        <span className="text-[11px] text-[#7a7088] block">
                          Registration Fill Rate
                        </span>
                        <p className="text-base font-bold text-[#1e1730] mt-0.5">
                          {kpis.capacityUtilization}%
                        </p>
                        <span className="text-[10px] text-[#5a5168]">
                          {kpis.totalRegistrations} registered / {kpis.totalCapacity} max seats
                        </span>
                      </div>

                      <div className="bg-white/60 p-3 rounded-xl border border-[#cfc7df]/60">
                        <span className="text-[11px] text-[#7a7088] block">
                          Institutional Footprint
                        </span>
                        <p className="text-base font-bold text-[#1e1730] mt-0.5">
                          {students.length} Active Students
                        </p>
                        <span className="text-[10px] text-[#5a5168]">
                          across B.Tech CSE & CS+AI cohorts
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Top Event Categories Summary */}
                <Card className="bg-[#f0ebf8] border-[#cfc7df] p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#cfc7df]/60 mb-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#8a3852]" />
                      <h3 className="font-bold text-sm text-[#1e1730]">
                        Category Representation
                      </h3>
                    </div>
                    <Link
                      to="/admin/categories"
                      className="text-xs text-[#392e59] font-semibold hover:underline flex items-center gap-0.5"
                    >
                      <span>Manage</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {displayCategories.slice(0, 6).map((cat) => (
                      <div key={cat.name} className="text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-[#1e1730]">{cat.name}</span>
                          <span className="text-[11px] text-[#7a7088]">
                            <strong className="text-[#1e1730]">{cat.total}</strong> events (
                            {cat.percentOfTotal}%) •{' '}
                            <strong className="text-[#1e1730]">{cat.registrations}</strong> regs
                          </span>
                        </div>
                        <div className="w-full bg-[#cfc7df]/40 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#7d6b97] h-full rounded-full transition-all duration-300"
                            style={{ width: `${cat.relativeWidth}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Full Category Breakdown Table (Shown if Categories tab active) */}
              {activeTab === 'categories' && (
                <Card className="bg-[#f0ebf8] border-[#cfc7df] overflow-hidden">
                  <div className="p-4 border-b border-[#cfc7df]/80 bg-[#e4ddf0]/60 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#1e1730]">
                      Comprehensive Category Distribution
                    </h3>
                    <span className="text-xs text-[#7a7088]">
                      Showing {displayCategories.length} of {categories.length} configured categories
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#e4ddf0] text-[#5a5168] font-semibold border-b border-[#cfc7df]">
                        <tr>
                          <th className="py-3 px-4">Category Name</th>
                          <th className="py-3 px-4 text-center">Total Events</th>
                          <th className="py-3 px-4 text-center">Upcoming</th>
                          <th className="py-3 px-4 text-center">Completed</th>
                          <th className="py-3 px-4 text-center">Total Registrations</th>
                          <th className="py-3 px-4 text-right">Share of Campus Events</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#cfc7df]/60 text-[#1e1730]">
                        {displayCategories.map((c) => (
                          <tr key={c.name} className="hover:bg-white/40 transition-colors">
                            <td className="py-3 px-4 font-semibold text-[#1e1730]">{c.name}</td>
                            <td className="py-3 px-4 text-center font-bold">{c.total}</td>
                            <td className="py-3 px-4 text-center text-[#2e7d32] font-medium">
                              {c.upcoming}
                            </td>
                            <td className="py-3 px-4 text-center text-[#7a7088] font-medium">
                              {c.completed}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-medium">
                              {c.registrations.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Badge variant="powder" size="sm">
                                {c.percentOfTotal}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              TAB 2: CLUBS & COMMITTEES REPORT
              ══════════════════════════════════════════════════════ */}
          {(activeTab === 'overview' || activeTab === 'clubs') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#8a3852]" />
                  <h3 className="font-bold text-base text-[#1e1730]">
                    Club & Committee Activity Breakdown
                  </h3>
                </div>
                <Link
                  to="/admin/clubs"
                  className="text-xs text-[#392e59] font-semibold hover:underline flex items-center gap-1"
                >
                  <span>View All Clubs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <Card className="bg-[#f0ebf8] border-[#cfc7df] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#e4ddf0] text-[#5a5168] font-semibold border-b border-[#cfc7df]">
                      <tr>
                        <th className="py-3 px-4">Club / Organization</th>
                        <th className="py-3 px-4">Committee</th>
                        <th className="py-3 px-4">Student Lead</th>
                        <th className="py-3 px-4 text-center">Total Events</th>
                        <th className="py-3 px-4 text-center">Upcoming</th>
                        <th className="py-3 px-4 text-center">Completed</th>
                        <th className="py-3 px-4 text-center">Total Turnout</th>
                        <th className="py-3 px-4 text-center">Avg / Event</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#cfc7df]/60 text-[#1e1730]">
                      {displayClubs.map((club) => {
                        const isActive = club.status === 'Active'
                        return (
                          <tr key={club.id} className="hover:bg-white/40 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-bold text-[#1e1730]">{club.name}</span>
                              <span className="text-[10px] text-[#7a7088] font-mono block">
                                {club.shortName}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[#5a5168]">{club.committee}</td>
                            <td className="py-3 px-4 font-medium text-[#1e1730]">{club.lead}</td>
                            <td className="py-3 px-4 text-center font-bold text-[#1e1730]">
                              {club.totalEvents}
                            </td>
                            <td className="py-3 px-4 text-center text-[#2e7d32] font-semibold">
                              {club.upcomingEvents}
                            </td>
                            <td className="py-3 px-4 text-center text-[#7a7088]">
                              {club.completedEvents}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-semibold">
                              {club.totalRegistrations.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center text-[#5a5168]">
                              {club.avgTurnout}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Badge
                                variant={isActive ? 'powder' : 'neutral'}
                                size="sm"
                              >
                                {club.status}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              TAB 3: YEARLY TIMELINE REPORT
              ══════════════════════════════════════════════════════ */}
          {(activeTab === 'overview' || activeTab === 'timeline') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#392e59]" />
                  <h3 className="font-bold text-base text-[#1e1730]">
                    Events By Academic Year (Historical vs Current)
                  </h3>
                </div>
                <span className="text-xs text-[#7a7088]">
                  Historical records accurately isolated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {yearlyStats.map((yr) => (
                  <Card key={yr.year} className="bg-[#f0ebf8] border-[#cfc7df] p-5">
                    <div className="flex items-center justify-between pb-3 border-b border-[#cfc7df]/60 mb-3">
                      <div>
                        <span className="text-[10px] text-[#7a7088] font-bold tracking-wider uppercase">
                          Academic Period
                        </span>
                        <h4 className="text-lg font-bold text-[#1e1730]">
                          Year {yr.year}
                        </h4>
                      </div>
                      <Badge
                        variant={yr.year === '2026' ? 'lavender' : 'neutral'}
                        size="md"
                      >
                        {yr.year === '2026' ? 'Current Cycle' : 'Historical Archive'}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#cfc7df]/40">
                        <span className="text-[#5a5168]">Total Events:</span>
                        <strong className="text-[#1e1730]">{yr.total}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#cfc7df]/40">
                        <span className="text-[#5a5168]">Upcoming / Active:</span>
                        <strong className="text-[#2e7d32]">{yr.upcoming}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#cfc7df]/40">
                        <span className="text-[#5a5168]">Completed Records:</span>
                        <strong className="text-[#7a7088]">{yr.completed}</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#5a5168]">Recorded Participants:</span>
                        <strong className="text-[#1e1730]">
                          {yr.registrations.toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {yr.flagshipEvents.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[#cfc7df]/60">
                        <span className="text-[10px] text-[#7a7088] font-semibold block mb-1">
                          Documented Flagship Festivals
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {yr.flagshipEvents.slice(0, 3).map((f, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-white/80 border border-[#cfc7df] px-2 py-0.5 rounded text-[#392e59] font-medium truncate max-w-full"
                            >
                              {f.split(':')[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              TAB 4: ORGANIZER LEADERSHIP & EVENT COUNTS
              ══════════════════════════════════════════════════════ */}
          {(activeTab === 'overview' || activeTab === 'organizers') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#8c5942]" />
                  <h3 className="font-bold text-base text-[#1e1730]">
                    Organizer Event Distribution & Stewardship
                  </h3>
                </div>
                <Link
                  to="/admin/organizers"
                  className="text-xs text-[#392e59] font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Manage Organizers</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <Card className="bg-[#f0ebf8] border-[#cfc7df] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#e4ddf0] text-[#5a5168] font-semibold border-b border-[#cfc7df]">
                      <tr>
                        <th className="py-3 px-4">Coordinator Name</th>
                        <th className="py-3 px-4">Affiliated Society / Committee</th>
                        <th className="py-3 px-4">Official Email</th>
                        <th className="py-3 px-4 text-center">Events Managed</th>
                        <th className="py-3 px-4 text-center">Registrations Driven</th>
                        <th className="py-3 px-4 text-right">Account Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#cfc7df]/60 text-[#1e1730]">
                      {displayOrganizers.map((org) => (
                        <tr key={org.id} className="hover:bg-white/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#1e1730]">
                            {org.name}
                          </td>
                          <td className="py-3 px-4 text-[#5a5168]">
                            {org.clubName || org.committee || 'Campus Committee'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#7a7088]">
                            {org.email || 'organizer@iiitvadodara.ac.in'}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-[#1e1730]">
                            {org.filteredEventsCount}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-semibold">
                            {org.filteredRegistrations.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge
                              variant={org.status === 'Active' ? 'powder' : 'neutral'}
                              size="sm"
                            >
                              {org.status || 'Active'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
