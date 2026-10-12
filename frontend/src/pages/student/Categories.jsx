import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CATEGORIES_CONFIG } from '../../data/categories'
import { getEvents, getCompletedEvents } from '../../services/api'
import Button from '../../components/common/Button'
import { Grid, ArrowRight, Calendar } from 'lucide-react'

export default function Categories() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    Promise.all([getEvents({ period: 'all' }), getCompletedEvents()])
      .then(([upcoming, completed]) => {
        if (!ignore) {
          setEvents([...(upcoming || []), ...(completed || [])])
          setLoading(false)
        }
      })
      .catch(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [])

  // Calculate event counts dynamically per category
  const categoryCounts = useMemo(() => {
    const counts = {}
    events.forEach((e) => {
      if (e.category) {
        counts[e.category] = (counts[e.category] || 0) + 1
      }
    })
    return counts
  }, [events])

  const handleCategoryClick = (categoryName) => {
    navigate(`/student/events?category=${encodeURIComponent(categoryName)}`)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-[#8c7fb4]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e1730]">Event Categories</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#5a5168] mt-0.5">
            Browse campus activities, competitions, and initiatives by interest
          </p>
        </div>

        <Link to="/student/events">
          <Button variant="outline" size="sm" icon={Calendar}>
            Browse All Events
          </Button>
        </Link>
      </div>

      {/* ── Visual Categories Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CATEGORIES_CONFIG.map((cat) => {
          const count = categoryCounts[cat.name] || 0

          return (
            <div
              key={cat.id || cat.name}
              onClick={() => handleCategoryClick(cat.name)}
              className={`rounded-2xl border p-5 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between group hover:shadow-sm hover:-translate-y-0.5 ${cat.bgClass}`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a7088]">
                      Category
                    </span>
                    <h3 className={`text-lg font-bold ${cat.textColor} tracking-tight`}>
                      {cat.name}
                    </h3>
                  </div>
                  <div className="w-16 h-16 rounded-xl overflow-hidden shadow-xs shrink-0 bg-white/60">
                    <img
                      src={cat.image}
                      alt={cat.alt || cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                </div>

                <p className="text-xs text-[#5a5168] mt-3 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-black/5 flex items-center justify-between text-xs">
                <span className="font-medium text-[#5a5168]">
                  {loading ? '...' : `${count} ${count === 1 ? 'event' : 'events'}`}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#8c7fb4] group-hover:text-[#554b73]">
                  Explore
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
