import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getEvents, getCompletedEvents, getClubs } from '../../services/api'
import { CATEGORIES_CONFIG } from '../../data/categories'
import EventCard from '../../components/events/EventCard'
import CategoryCard from '../../components/events/CategoryCard'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import {
  Search,
  X,
  Calendar,
  Compass,
  Users,
  History,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Trophy,
} from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [timingFilter, setTimingFilter] = useState('all')

  const [events, setEvents] = useState([])
  const [completedEvents, setCompletedEvents] = useState([])
  const [featuredClubs, setFeaturedClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const timingTabs = [
    { id: 'all', label: 'All Upcoming' },
    { id: 'current', label: 'Current' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
  ]

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      getEvents({
        period: timingFilter,
        search: searchQuery,
      }),
      getCompletedEvents(),
      getClubs(),
    ])
      .then(([eventsData, completedData, clubsData]) => {
        setEvents(eventsData || [])
        setCompletedEvents((completedData || []).slice(0, 3))
        setFeaturedClubs((clubsData || []).slice(0, 4))
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Unable to load dashboard data')
        setLoading(false)
      })
  }

  useEffect(() => {
    let ignore = false
    Promise.all([
      getEvents({
        period: timingFilter,
        search: searchQuery,
      }),
      getCompletedEvents(),
      getClubs(),
    ])
      .then(([eventsData, completedData, clubsData]) => {
        if (!ignore) {
          setEvents(eventsData || [])
          setCompletedEvents((completedData || []).slice(0, 3))
          setFeaturedClubs((clubsData || []).slice(0, 4))
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Unable to load dashboard data')
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [timingFilter, searchQuery])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/student/events?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleCategorySelect = (categoryName) => {
    navigate(`/student/events?category=${encodeURIComponent(categoryName)}`)
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* ── 1. Welcome Header & Search ───────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e8e3f7] text-[#554b73]">
                Student Portal
              </span>
              <span className="text-xs text-[#7a7088]">• IIIT Vadodara</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1e1730] mt-1.5">
              Welcome back, Aryan 👋
            </h1>
            <p className="text-sm text-[#5a5168] mt-0.5">
              Discover official college hackathons, sports championships, fests, and workshops
            </p>
          </div>

          <Link to="/student/events">
            <Button variant="outline" size="sm" icon={Calendar}>
              Browse All Events
            </Button>
          </Link>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7088] pointer-events-none">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title, category, venue, or club (press Enter)..."
            className="w-full rounded-2xl border border-[#cfc7df] bg-[#f0ebf8] pl-12 pr-24 py-3.5 text-sm text-[#1e1730] placeholder:text-[#9d93ac] shadow-2xs hover:border-[#cfc4dc] focus:border-[#8c7fb4] focus:ring-2 focus:ring-[#8c7fb4]/25 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-[#7a7088] hover:text-[#1e1730] rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#8c7fb4] hover:bg-[#7b6ea3] text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Search
          </button>
        </form>
      </section>

      {/* ── 2. Browse by Category ────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#8c7fb4]" />
            <h2 className="text-lg font-bold text-[#1e1730]">Browse by Category</h2>
          </div>
          <Link
            to="/student/categories"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#8c7fb4] hover:text-[#554b73] transition-colors"
          >
            View all categories
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {CATEGORIES_CONFIG.slice(0, 6).map((cat) => (
            <CategoryCard
              key={cat.name}
              category={cat}
              onClick={() => handleCategorySelect(cat.name)}
            />
          ))}
        </div>
      </section>

      {/* ── 3. Upcoming Schedule Feed with Tabs ──────────────── */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#cfc7df] pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8c7fb4]" />
            <h2 className="text-lg font-bold text-[#1e1730]">Upcoming Schedule</h2>
            <Badge variant="neutral" size="sm">
              {events.length} {events.length === 1 ? 'event' : 'events'}
            </Badge>
          </div>

          {/* Period Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#f0ebf8] rounded-xl border border-[#cfc7df] overflow-x-auto">
            {timingTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimingFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  timingFilter === tab.id
                    ? 'bg-[#8c7fb4] text-white shadow-2xs font-semibold'
                    : 'text-[#5a5168] hover:text-[#1e1730] hover:bg-[#ede7f5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="text-center py-8 px-6 bg-[#f0ebf8] border-[#cfc7df]">
            <div className="w-10 h-10 rounded-full bg-[#faeaee] text-[#b85b71] mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#1e1730]">Unable to load events</h3>
            <p className="text-xs text-[#5a5168] mt-1 max-w-sm mx-auto">{error}</p>
            <div className="mt-4 flex justify-center">
              <Button variant="primary" size="sm" icon={RefreshCw} onClick={handleRetry}>
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* Events Grid / Loading / Empty */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
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
          <Card className="text-center py-12 px-6 bg-[#f0ebf8] border-[#cfc7df]">
            <div className="w-12 h-12 rounded-full bg-[#ede7f5] text-[#8c7fb4] mx-auto flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1e1730]">No events found</h3>
            <p className="text-xs text-[#5a5168] mt-1 max-w-sm mx-auto">
              There are no active events for the selected period. Check other periods or browse the full event catalog.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setTimingFilter('all')}>
                Show All Upcoming
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* ── 4. Clubs Discovery Preview ───────────────────────── */}
      <section className="space-y-4 pt-4 border-t border-[#cfc7df]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#8c7fb4]" />
            <h2 className="text-lg font-bold text-[#1e1730]">Student Clubs & Societies</h2>
          </div>
          <Link
            to="/student/clubs"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#8c7fb4] hover:text-[#554b73] transition-colors"
          >
            Explore all {featuredClubs.length > 0 ? '14 clubs' : 'clubs'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredClubs.map((club) => (
            <Link
              key={club.id}
              to={`/student/clubs/${club.id}`}
              className="p-4 rounded-2xl border border-[#cfc7df] bg-[#f0ebf8] hover:border-[#8c7fb4]/40 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="lavender" size="sm">
                    {club.category}
                  </Badge>
                  <span className="text-[10px] text-[#7a7088]">{club.membersCount} members</span>
                </div>
                <h3 className="text-sm font-bold text-[#1e1730] group-hover:text-[#8c7fb4] transition-colors">
                  {club.name}
                </h3>
                <p className="text-xs text-[#5a5168] mt-1 line-clamp-2 leading-relaxed">
                  {club.description}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#ede7f5] flex items-center justify-between text-xs text-[#8c7fb4] font-medium">
                <span>View activities</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 5. Past Events & Achievements Preview ───────────── */}
      <section className="space-y-4 pt-4 border-t border-[#cfc7df]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#8c7fb4]" />
            <h2 className="text-lg font-bold text-[#1e1730]">Past Events & Highlights</h2>
          </div>
          <Link
            to="/student/past-events"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#8c7fb4] hover:text-[#554b73] transition-colors"
          >
            Browse past events archive
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {completedEvents.map((evt) => (
            <Link
              key={evt.id}
              to={`/student/events/${evt.id}`}
              className="rounded-2xl border border-[#cfc7df] bg-[#f0ebf8] overflow-hidden hover:border-[#8c7fb4]/40 hover:shadow-xs transition-all group flex flex-col"
            >
              <div className="h-32 bg-[#dcd6ea] relative overflow-hidden">
                <img
                  src={evt.image}
                  alt={evt.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2">
                  <Badge variant="neutral" size="sm">
                    {evt.category}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="neutral" size="sm">
                    Completed
                  </Badge>
                </div>
              </div>
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#1e1730] line-clamp-1 group-hover:text-[#8c7fb4]">
                    {evt.title}
                  </h3>
                  <p className="text-[11px] text-[#7a7088] mt-1">{evt.date}</p>
                </div>
                {evt.achievement && (
                  <div className="mt-2 pt-2 border-t border-[#ede7f5] flex items-center gap-1.5 text-[11px] font-medium text-[#544964] truncate">
                    <Trophy className="w-3 h-3 text-[#a97c2f] shrink-0" />
                    <span className="truncate">{evt.achievement}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
