import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { getEventById, updateEvent } from '../../services/api'
import EventForm from '../../components/events/EventForm'
import { ArrowLeft, Pencil, AlertCircle, RefreshCw } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'

export default function EditEvent() {
  const { eventId } = useParams()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  const backPath = isAdmin ? '/admin/events' : '/organizer/events'
  const backLabel = isAdmin ? 'Back to All Events' : 'Back to My Events'

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getEventById(eventId)
      setEvent(data)
    } catch (err) {
      setError(err.message || 'Failed to load event details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const data = await getEventById(eventId)
        if (!ignore) {
          setEvent(data)
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load event details')
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
  }, [eventId])

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-pulse">
        <div className="h-10 bg-[#e4dced] rounded-xl w-1/3" />
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-6 space-y-4">
          <div className="h-6 bg-[#dcd6ea] rounded w-1/2" />
          <div className="h-10 bg-[#dcd6ea] rounded" />
          <div className="h-10 bg-[#dcd6ea] rounded" />
          <div className="h-24 bg-[#dcd6ea] rounded" />
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
          <h1 className="text-lg font-bold text-[#1e1730]">Unable to Load Event</h1>
          <p className="text-xs text-[#5a5168] mt-1">{error}</p>
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

  if (!event) {
    return (
      <div className="flex justify-center py-20">
        <Card className="w-full max-w-md text-center py-12 px-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#faeaee] text-[#b85b71] flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-[#1e1730]">Event Not Found</h1>
          <p className="text-xs text-[#5a5168] mt-1">
            Event &quot;{eventId}&quot; does not exist or may have been removed.
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

  // Convert stored date string to ISO YYYY-MM-DD for the date input
  const toInputDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d)) return ''
    return d.toISOString().split('T')[0]
  }

  const initialValues = {
    title: event.title || event.name,
    category: event.category,
    clubId: event.clubId || 'club-coding',
    organizer: event.organizer || '',
    image: event.image || '',
    description: event.description || '',
    date: toInputDate(event.date),
    time: event.time || '',
    venue: event.venue || '',
    registrationLimit: event.registrationLimit ?? '',
  }

  const handleSave = async (formData) => {
    return await updateEvent(eventId, formData)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e8e3f7] flex items-center justify-center shrink-0">
            <Pencil className="w-5 h-5 text-[#8c7fb4]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e1730]">Edit Event</h1>
            <p className="text-xs text-[#5a5168] mt-0.5 truncate max-w-xs sm:max-w-sm">
              {event.title || event.name}
            </p>
          </div>
        </div>

        <Link
          to={backPath}
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c7fb4] hover:text-[#554b73] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {backLabel}
        </Link>
      </div>

      {/* Pre-filled form */}
      <EventForm
        mode="edit"
        initialValues={initialValues}
        onSave={handleSave}
        cancelPath={backPath}
        successPath={backPath}
        successLabel={isAdmin ? 'View All Events' : 'View My Events'}
      />
    </div>
  )
}

