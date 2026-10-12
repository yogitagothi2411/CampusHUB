import { useState, useEffect } from 'react'
import { getCompletedEvents } from '../../services/api'
import PastEventCard from '../../components/events/PastEventCard'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { History, CalendarX, AlertCircle, RefreshCw } from 'lucide-react'

export default function PastEvents() {
  const [completedEvents, setCompletedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    getCompletedEvents()
      .then((data) => {
        setCompletedEvents(data || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Unable to load past events')
        setLoading(false)
      })
  }

  useEffect(() => {
    let ignore = false
    getCompletedEvents()
      .then((data) => {
        if (!ignore) {
          setCompletedEvents(data || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Unable to load past events')
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#e8e3f7] flex items-center justify-center shrink-0">
          <History className="w-5 h-5 text-[#8c7fb4]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1e1730]">Past Events</h1>
          <p className="text-xs text-[#5a5168] mt-0.5">
            Explore completed college events, outcomes, and photo galleries
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f0ebf8] border border-[#cfc7df] rounded-xl text-xs text-[#5a5168]">
          <span className="font-bold text-[#1e1730] text-sm">
            {loading ? '-' : completedEvents.length}
          </span>
          <span>events completed</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f0ebf8] border border-[#cfc7df] rounded-xl text-xs text-[#5a5168]">
          <span className="font-bold text-[#1e1730] text-sm">
            {loading
              ? '-'
              : completedEvents.reduce((acc, e) => acc + (e.photos?.length || 0), 0)}
          </span>
          <span>photos archived</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f0ebf8] border border-[#cfc7df] rounded-xl text-xs text-[#5a5168]">
          <span className="font-bold text-[#1e1730] text-sm">
            {loading ? '-' : completedEvents.filter((e) => e.winner).length}
          </span>
          <span>competitive results</span>
        </div>
      </div>

      {/* Events grid / Loading / Error / Empty States */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#cfc7df] bg-[#f0ebf8] overflow-hidden animate-pulse flex flex-col h-full"
            >
              <div className="h-44 sm:h-48 bg-[#dcd6ea]" />
              <div className="p-5 flex-1 space-y-3">
                <div className="h-4 bg-[#e4dced] rounded w-3/4" />
                <div className="h-3 bg-[#e4dced] rounded w-1/2" />
                <div className="h-3 bg-[#e4dced] rounded w-2/3" />
                <div className="pt-2 flex justify-between">
                  <div className="h-3 bg-[#e4dced] rounded w-20" />
                  <div className="h-3 bg-[#e4dced] rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <Card className="text-center py-10 px-6 bg-[#f0ebf8] border-[#cfc7df]">
          <div className="w-10 h-10 rounded-full bg-[#faeaee] text-[#b85b71] mx-auto flex items-center justify-center mb-3">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-[#1e1730]">Unable to load past events</h3>
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
      ) : completedEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-[#ede7f5] flex items-center justify-center mb-4">
            <CalendarX className="w-7 h-7 text-[#8c7fb4]" />
          </div>
          <p className="text-sm font-semibold text-[#1e1730]">No completed events yet</p>
          <p className="text-xs text-[#7a7088] mt-1 max-w-xs">
            Past events will appear here once they conclude. Check back after upcoming events are held!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedEvents.map((event) => (
            <PastEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
