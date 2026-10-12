import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getClubs, getEvents, getCompletedEvents } from '../../services/api'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import {
  Users,
  Search,
  X,
  Compass,
  ArrowRight,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

const committeeBadgeMap = {
  Technical: 'powder',
  Cultural: 'blush',
  Sports: 'peach',
  Literature: 'mauve',
  Design: 'lavender',
  Management: 'peach',
  Gaming: 'lavender',
}

export default function Clubs() {
  const [clubs, setClubs] = useState([])
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Literature', 'Design', 'Management']

  const handleFetch = () => {
    setLoading(true)
    setError(null)
    Promise.all([getClubs(), getEvents({ period: 'all' }), getCompletedEvents()])
      .then(([clubsData, upcomingData, pastData]) => {
        setClubs(clubsData || [])
        setEvents([...(upcomingData || []), ...(pastData || [])])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load clubs')
        setLoading(false)
      })
  }

  useEffect(() => {
    let ignore = false
    Promise.all([getClubs(), getEvents({ period: 'all' }), getCompletedEvents()])
      .then(([clubsData, upcomingData, pastData]) => {
        if (!ignore) {
          setClubs(clubsData || [])
          setEvents([...(upcomingData || []), ...(pastData || [])])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load clubs')
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  // Calculate event count per club from centralized events dataset
  const clubEventCounts = useMemo(() => {
    const counts = {}
    events.forEach((evt) => {
      if (evt.clubId) {
        counts[evt.clubId] = (counts[evt.clubId] || 0) + 1
      }
    })
    return counts
  }, [events])

  // Filtered clubs
  const filteredClubs = useMemo(() => {
    let list = clubs

    if (selectedCategory !== 'All') {
      list = list.filter((c) => c.category.toLowerCase() === selectedCategory.toLowerCase())
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.committee?.toLowerCase().includes(q) ||
          (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)))
      )
    }

    return list
  }, [clubs, selectedCategory, search])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8c7fb4]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e1730]">Clubs & Societies</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#5a5168] mt-0.5">
            Discover student-led technical clubs, cultural societies, and councils at IIIT Vadodara
          </p>
        </div>
      </div>

      {/* ── Search & Filter Controls ────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7088]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs by name, category, or interests..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-[#cfc7df] bg-[#f0ebf8] text-[#1e1730] placeholder:text-[#9d93ac] focus:outline-none focus:ring-2 focus:ring-[#8c7fb4]/25 focus:border-[#8c7fb4]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7a7088] hover:text-[#1e1730]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#8c7fb4] text-white shadow-2xs font-semibold'
                  : 'bg-[#f0ebf8] border border-[#cfc7df] text-[#5a5168] hover:bg-[#ede7f5]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error State ────────────────────────────────────── */}
      {error && (
        <Card className="text-center py-8 px-6 bg-[#f0ebf8] border-[#cfc7df]">
          <div className="w-10 h-10 rounded-full bg-[#faeaee] text-[#b85b71] mx-auto flex items-center justify-center mb-3">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-[#1e1730]">Unable to load clubs</h3>
          <p className="text-xs text-[#5a5168] mt-1 max-w-sm mx-auto">{error}</p>
          <div className="mt-4 flex justify-center">
            <Button variant="primary" size="sm" icon={RefreshCw} onClick={handleFetch}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* ── Results Info ───────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-[#5a5168]">
        <span>
          Showing <strong>{filteredClubs.length}</strong> of <strong>{clubs.length}</strong> clubs
        </span>
      </div>

      {/* ── Clubs Grid ─────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#cfc7df] bg-[#f0ebf8] overflow-hidden animate-pulse flex flex-col h-72"
            >
              <div className="h-32 bg-[#dcd6ea]" />
              <div className="p-4 space-y-3 flex-1">
                <div className="h-4 bg-[#e4dced] rounded w-1/2" />
                <div className="h-3 bg-[#e4dced] rounded w-3/4" />
                <div className="h-3 bg-[#e4dced] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredClubs.length === 0 ? (
        <Card className="text-center py-16 px-6 bg-[#f0ebf8] border-[#cfc7df]">
          <div className="w-12 h-12 rounded-full bg-[#ede7f5] text-[#8c7fb4] mx-auto flex items-center justify-center mb-3">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1e1730]">No clubs found</h3>
          <p className="text-xs text-[#5a5168] mt-1.5 max-w-sm mx-auto">
            No clubs match &quot;{search}&quot; under the &quot;{selectedCategory}&quot; category.
          </p>
          <div className="mt-5 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setSelectedCategory('All')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClubs.map((club) => {
            const count = clubEventCounts[club.id] || 0
            const badgeVariant = committeeBadgeMap[club.category] || 'lavender'

            return (
              <Link
                key={club.id}
                to={`/student/clubs/${club.id}`}
                className="rounded-2xl border border-[#cfc7df] bg-[#f0ebf8] overflow-hidden hover:border-[#8c7fb4]/50 hover:shadow-xs transition-all flex flex-col group"
              >
                {/* Image Banner */}
                <div className="h-36 relative overflow-hidden bg-[#ede7f5]">
                  <img
                    src={club.image}
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant={badgeVariant} size="sm">
                      {club.category}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#2a2337]/70 text-white backdrop-blur-xs">
                      {club.membersCount} members
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">
                      {club.committee}
                    </p>
                    <h3 className="text-base font-bold text-[#1e1730] mt-0.5 group-hover:text-[#8c7fb4] transition-colors">
                      {club.name}
                    </h3>
                    <p className="text-xs text-[#5a5168] mt-1.5 line-clamp-2 leading-relaxed">
                      {club.description}
                    </p>
                  </div>

                  {/* Footer with event count & action */}
                  <div className="pt-3 border-t border-[#ede7f5] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[#5a5168]">
                      <Calendar className="w-3.5 h-3.5 text-[#8c7fb4]" />
                      <span>
                        <strong>{count}</strong> {count === 1 ? 'event' : 'events'}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#8c7fb4] group-hover:text-[#554b73]">
                      View details
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
