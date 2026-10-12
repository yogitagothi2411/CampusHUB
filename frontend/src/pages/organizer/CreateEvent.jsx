import { Link, useLocation } from 'react-router-dom'
import { createEvent } from '../../services/api'
import EventForm from '../../components/events/EventForm'
import { ArrowLeft, PlusCircle } from 'lucide-react'

export default function CreateEvent() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  const backPath = isAdmin ? '/admin/events' : '/organizer/events'
  const backLabel = isAdmin ? 'Back to All Events' : 'Back to My Events'
  const subtitle = isAdmin
    ? 'Publish a new campus event across clubs and committees'
    : 'Publish a new event for the college community'

  const handleSave = async (formData) => {
    return await createEvent(formData)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f6d8df] flex items-center justify-center shrink-0">
            <PlusCircle className="w-5 h-5 text-[#b85b71]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e1730]">Create Event</h1>
            <p className="text-xs text-[#5a5168] mt-0.5">{subtitle}</p>
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

      {/* Form */}
      <EventForm
        mode="create"
        onSave={handleSave}
        cancelPath={backPath}
        successPath={backPath}
        successLabel={isAdmin ? 'View All Events' : 'View My Events'}
      />
    </div>
  )
}
