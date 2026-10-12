import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CATEGORIES } from '../../data/categories'
import { CLUBS } from '../../data/clubs'
import Button from '../../components/common/Button'
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  AlignLeft,
  Tag,
  Image,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  PlusCircle,
  AlertCircle,
  Building2,
} from 'lucide-react'

function FormField({ id, label, icon: Icon, required, children }) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs font-bold text-[#1e1730] uppercase tracking-wider"
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-[#7a7088]" />}
        {label}
        {required && <span className="text-[#b85b71]">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full px-4 py-2.5 text-sm rounded-xl border border-[#cfc7df] bg-[#f0ebf8] text-[#1e1730] placeholder:text-[#b0a8bc] focus:outline-none focus:ring-2 focus:ring-[#8c7fb4]/30 focus:border-[#8c7fb4] transition-colors'

export default function EventForm({
  initialValues = {},
  onSave,
  mode = 'create',
  cancelPath,
  successPath,
  successLabel,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  const defaultCancel = cancelPath || (isAdmin ? '/admin/events' : '/organizer/events')
  const defaultSuccess = successPath || (isAdmin ? '/admin/events' : '/organizer/events')
  const defaultSuccessLabel = successLabel || (isAdmin ? 'View All Events' : 'View My Events')

  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const [form, setForm] = useState({
    title: initialValues.title || initialValues.name || '',
    category: initialValues.category || '',
    clubId: initialValues.clubId || 'club-coding',
    organizer: initialValues.organizer || 'Coding Club',
    image: initialValues.image || '',
    description: initialValues.description || '',
    date: initialValues.date || '',
    time: initialValues.time || '',
    venue: initialValues.venue || '',
    registrationLimit: initialValues.registrationLimit ?? '',
  })

  const [errors, setErrors] = useState({})

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleClubChange = (e) => {
    const selectedId = e.target.value
    const foundClub = CLUBS.find((c) => c.id === selectedId)
    setForm((prev) => ({
      ...prev,
      clubId: selectedId,
      organizer: foundClub ? foundClub.name : prev.organizer,
    }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Event name is required'
    if (!form.category) errs.category = 'Category is required'
    if (!form.clubId) errs.clubId = 'Club / Committee is required'
    if (!form.date) errs.date = 'Date is required'
    if (!form.time.trim()) errs.time = 'Time is required'
    if (!form.venue.trim()) errs.venue = 'Venue is required'
    if (!form.description.trim()) errs.description = 'Description is required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      if (onSave) {
        await onSave(form)
      }
      setSubmitted(true)
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        `Failed to ${mode === 'create' ? 'publish' : 'update'} event. Please try again.`
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => navigate(defaultCancel)

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#e8e3f7] flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-[#8c7fb4]" />
        </div>
        <h2 className="text-lg font-bold text-[#1e1730]">
          Event {mode === 'create' ? 'Created' : 'Updated'} Successfully!
        </h2>
        <p className="text-xs text-[#5a5168] mt-1 max-w-xs">
          {form.title} has been {mode === 'create' ? 'published' : 'updated'} and is now visible to students.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="primary"
            onClick={() => navigate(defaultSuccess)}
          >
            {defaultSuccessLabel}
          </Button>
          {mode === 'create' && (
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false)
                setForm({
                  title: '',
                  category: '',
                  clubId: 'club-coding',
                  organizer: 'Coding Club',
                  image: '',
                  description: '',
                  date: '',
                  time: '',
                  venue: '',
                  registrationLimit: '',
                })
              }}
            >
              Create Another
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Basic Info */}
      <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-6 space-y-5">
        <h3 className="text-xs uppercase font-bold tracking-wider text-[#7a7088]">
          Basic Information
        </h3>

        {/* Event Name */}
        <FormField id="ev-title" label="Event Name" icon={Sparkles} required>
          <input
            id="ev-title"
            type="text"
            placeholder="e.g. HackCampus 2027: 24-Hour Hackathon"
            value={form.title}
            onChange={update('title')}
            className={inputClass}
          />
          {errors.title && (
            <p className="text-xs text-[#b85b71] mt-1">{errors.title}</p>
          )}
        </FormField>

        {/* Club / Committee */}
        <FormField id="ev-club" label="Organizing Club / Committee" icon={Building2} required>
          <div className="relative">
            <select
              id="ev-club"
              value={form.clubId}
              onChange={handleClubChange}
              className={`${inputClass} appearance-none pr-10 cursor-pointer`}
            >
              {CLUBS.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name} ({club.category})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7088]" />
          </div>
          {errors.clubId && (
            <p className="text-xs text-[#b85b71] mt-1">{errors.clubId}</p>
          )}
        </FormField>

        {/* Category */}
        <FormField id="ev-category" label="Category" icon={Tag} required>
          <div className="relative">
            <select
              id="ev-category"
              value={form.category}
              onChange={update('category')}
              className={`${inputClass} appearance-none pr-10 cursor-pointer`}
            >
              <option value="" disabled>Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7088]" />
          </div>
          {errors.category && (
            <p className="text-xs text-[#b85b71] mt-1">{errors.category}</p>
          )}
        </FormField>

        {/* Description */}
        <FormField id="ev-description" label="Description" icon={AlignLeft} required>
          <textarea
            id="ev-description"
            rows={4}
            placeholder="Describe the event, what students can expect, prizes, and any eligibility criteria..."
            value={form.description}
            onChange={update('description')}
            className={`${inputClass} resize-none`}
          />
          {errors.description && (
            <p className="text-xs text-[#b85b71] mt-1">{errors.description}</p>
          )}
        </FormField>
      </div>

      {/* Date, Time & Venue */}
      <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-6 space-y-5">
        <h3 className="text-xs uppercase font-bold tracking-wider text-[#7a7088]">
          Date, Time & Venue
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Date */}
          <FormField id="ev-date" label="Date" icon={CalendarDays} required>
            <input
              id="ev-date"
              type="date"
              value={form.date}
              onChange={update('date')}
              className={inputClass}
            />
            {errors.date && (
              <p className="text-xs text-[#b85b71] mt-1">{errors.date}</p>
            )}
          </FormField>

          {/* Time */}
          <FormField id="ev-time" label="Time" icon={Clock} required>
            <input
              id="ev-time"
              type="text"
              placeholder="e.g. 10:00 AM - 05:00 PM"
              value={form.time}
              onChange={update('time')}
              className={inputClass}
            />
            {errors.time && (
              <p className="text-xs text-[#b85b71] mt-1">{errors.time}</p>
            )}
          </FormField>
        </div>

        {/* Venue */}
        <FormField id="ev-venue" label="Venue" icon={MapPin} required>
          <input
            id="ev-venue"
            type="text"
            placeholder="e.g. Main Auditorium, Senate Hall"
            value={form.venue}
            onChange={update('venue')}
            className={inputClass}
          />
          {errors.venue && (
            <p className="text-xs text-[#b85b71] mt-1">{errors.venue}</p>
          )}
        </FormField>
      </div>

      {/* Media & Capacity */}
      <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-6 space-y-5">
        <h3 className="text-xs uppercase font-bold tracking-wider text-[#7a7088]">
          Media & Capacity
        </h3>

        {/* Image URL */}
        <FormField id="ev-image" label="Event Image URL" icon={Image}>
          <input
            id="ev-image"
            type="url"
            placeholder="https://images.unsplash.com/photo-... (optional)"
            value={form.image}
            onChange={update('image')}
            className={inputClass}
          />
          {/* Preview */}
          {form.image && (
            <div className="mt-2 w-full h-36 rounded-xl overflow-hidden border border-[#cfc7df] bg-[#ede7f5]">
              <img
                src={form.image}
                alt="Event preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </div>
          )}
        </FormField>

        {/* Registration Limit */}
        <FormField id="ev-limit" label="Registration Limit" icon={Users}>
          <input
            id="ev-limit"
            type="number"
            min="0"
            placeholder="e.g. 120 (leave blank for unlimited)"
            value={form.registrationLimit}
            onChange={update('registrationLimit')}
            className={inputClass}
          />
          <p className="text-[10px] text-[#7a7088] mt-1">
            Leave blank or set to 0 for unlimited registrations.
          </p>
        </FormField>
      </div>

      {/* Error Feedback */}
      {submitError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#faeaee] border border-[#f0c5cf] text-[#b85b71] text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="secondary"
          icon={mode === 'create' ? PlusCircle : Sparkles}
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? mode === 'create'
              ? 'Publishing Event...'
              : 'Saving Changes...'
            : mode === 'create'
            ? 'Publish Event'
            : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}

