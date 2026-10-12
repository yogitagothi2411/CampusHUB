import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { getEventById, getEventRegistrations, updateEvent } from '../../services/api'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Building,
  AlertCircle,
  Settings2,
  Trophy,
  ImagePlus,
  CheckCircle2,
  Trash2,
  PlusCircle,
  ClipboardList,
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

const inputClass =
  'w-full px-4 py-2.5 text-sm rounded-xl border border-[#cfc7df] bg-[#f0ebf8] text-[#1e1730] placeholder:text-[#b0a8bc] focus:outline-none focus:ring-2 focus:ring-[#8c7fb4]/30 focus:border-[#8c7fb4] transition-colors'

export default function ManageEvent() {
  const { eventId } = useParams()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  const baseEventsPath = isAdmin ? '/admin/events' : '/organizer/events'
  const backLabel = isAdmin ? 'Back to All Events' : 'Back to My Events'

  const [rawEvent, setRawEvent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── Outcome state (for completed events) ─────────────────────────────────
  const [outcome, setOutcome] = useState({
    achievement: '',
    winner: '',
    runnerUp: '',
  })
  const [photoUrls, setPhotoUrls] = useState([])
  const [photoInput, setPhotoInput] = useState('')
  const [outcomeSaved, setOutcomeSaved] = useState(false)
  const [savingOutcome, setSavingOutcome] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    try {
      const [eventData, regData] = await Promise.all([
        getEventById(eventId),
        getEventRegistrations(eventId),
      ])
      setRawEvent(eventData)
      setRegistrations(regData || [])
      if (eventData) {
        setOutcome({
          achievement: eventData.achievement || '',
          winner: eventData.winner || '',
          runnerUp: eventData.runnerUp || '',
        })
        setPhotoUrls(eventData.photos || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load event data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    async function load() {
      try {
        const [eventData, regData] = await Promise.all([
          getEventById(eventId),
          getEventRegistrations(eventId),
        ])
        if (!ignore) {
          setRawEvent(eventData)
          setRegistrations(regData || [])
          if (eventData) {
            setOutcome({
              achievement: eventData.achievement || '',
              winner: eventData.winner || '',
              runnerUp: eventData.runnerUp || '',
            })
            setPhotoUrls(eventData.photos || [])
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load event data')
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
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-[#e4dced] rounded-xl w-1/4" />
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl overflow-hidden">
          <div className="h-48 sm:h-60 bg-[#dcd6ea]" />
          <div className="p-6 space-y-4">
            <div className="h-4 bg-[#dcd6ea] rounded w-3/4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div className="h-10 bg-[#dcd6ea] rounded" />
              <div className="h-10 bg-[#dcd6ea] rounded" />
              <div className="h-10 bg-[#dcd6ea] rounded" />
            </div>
          </div>
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
            <Link to={baseEventsPath}>
              <Button variant="outline" icon={ArrowLeft}>
                {backLabel}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (!rawEvent) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-full max-w-md text-center bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl py-12 px-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#faeaee] text-[#b85b71] flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-[#1e1730]">Event Not Found</h1>
          <p className="text-xs text-[#5a5168] mt-1">
            Event &quot;{eventId}&quot; does not exist or may have been removed.
          </p>
          <div className="mt-6">
            <Link to={baseEventsPath}>
              <Button variant="primary" icon={ArrowLeft}>
                {backLabel}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isCompleted = rawEvent.timing === 'completed'
  const categoryVariant = categoryBadgeMap[rawEvent.category] || 'lavender'
  const fillPercent = rawEvent.registrationLimit
    ? Math.min(100, Math.round((rawEvent.registeredCount / rawEvent.registrationLimit) * 100))
    : 0
  const isFull =
    rawEvent.registrationLimit && rawEvent.registeredCount >= rawEvent.registrationLimit

  const handleAddPhoto = () => {
    const url = photoInput.trim()
    if (!url) return
    setPhotoUrls((prev) => [...prev, url])
    setPhotoInput('')
    setOutcomeSaved(false)
  }

  const handleRemovePhoto = (idx) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx))
    setOutcomeSaved(false)
  }

  const handleSaveOutcome = async () => {
    setSavingOutcome(true)
    setSaveError(null)
    try {
      const updated = {
        ...rawEvent,
        ...outcome,
        photos: photoUrls,
      }
      await updateEvent(eventId, updated)
      setRawEvent(updated)
      setOutcomeSaved(true)
    } catch (err) {
      setSaveError(err.message || 'Failed to save event results')
    } finally {
      setSavingOutcome(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={baseEventsPath}
            className="w-9 h-9 rounded-xl bg-[#f2edf8] flex items-center justify-center text-[#5a5168] hover:bg-[#e8e3f7] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-[#7a7088]" />
              <h1 className="text-xl font-bold text-[#1e1730]">Manage Event</h1>
            </div>
            <p className="text-xs text-[#5a5168] mt-0.5 truncate max-w-xs sm:max-w-sm">
              {rawEvent.title}
            </p>
          </div>
        </div>

        {/* Quick nav actions */}
        <div className="flex gap-2 flex-wrap">
          <Link
            to={`${baseEventsPath}/${rawEvent.id}/registrations`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#e8e3f7] text-[#554b73] rounded-xl text-xs font-semibold hover:bg-[#ded7ef] transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            View Registrations
            <span className="ml-0.5 bg-[#8c7fb4] text-white rounded-full px-1.5 py-px text-[10px] font-bold">
              {registrations.length}
            </span>
          </Link>
          <Link
            to={`${baseEventsPath}/${rawEvent.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#f6d8df] text-[#6b3546] rounded-xl text-xs font-semibold hover:bg-[#eed0d7] transition-colors"
          >
            Edit Event
          </Link>
        </div>
      </div>

      {/* ── Event Overview Card ─────────────────────────────────── */}
      <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl overflow-hidden">
        {/* Cover */}
        <div className="relative w-full h-48 sm:h-60 bg-[#ede7f5]">
          <img
            src={rawEvent.image}
            alt={rawEvent.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2a2337]/70 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
            <h2 className="text-white text-lg font-bold leading-snug drop-shadow-sm max-w-lg">
              {rawEvent.title}
            </h2>
            <Badge variant={categoryVariant} size="md" className="shrink-0 shadow-sm">
              {rawEvent.category}
            </Badge>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#e8e3f7] flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4 text-[#8c7fb4]" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Date</p>
                <p className="text-sm font-semibold text-[#1e1730]">{rawEvent.date}</p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#fae4d7] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-[#8c5942]" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Time</p>
                <p className="text-sm font-semibold text-[#1e1730]">{rawEvent.time}</p>
              </div>
            </div>

            {/* Venue */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#e7eff9] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#416287]" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Venue</p>
                <p className="text-sm font-semibold text-[#1e1730]">{rawEvent.venue}</p>
              </div>
            </div>

            {/* Organizer */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#faeaee] flex items-center justify-center shrink-0">
                <Building className="w-4 h-4 text-[#8c5261]" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Organizer</p>
                <p className="text-sm font-semibold text-[#1e1730]">{rawEvent.organizer}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                isCompleted ? 'bg-[#d5ccdf]' : 'bg-[#dbe8f6]'
              }`}>
                <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-[#645873]' : 'text-[#416287]'}`} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Status</p>
                <p className="text-sm font-semibold text-[#1e1730]">{rawEvent.status}</p>
              </div>
            </div>

            {/* Registrations */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#f6d8df] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-[#b85b71]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Registrations</p>
                <p className="text-sm font-semibold text-[#1e1730]">
                  {rawEvent.registeredCount}
                  {rawEvent.registrationLimit > 0 && (
                    <span className="text-[#7a7088] font-normal"> / {rawEvent.registrationLimit}</span>
                  )}
                </p>
                {rawEvent.registrationLimit > 0 && (
                  <div className="mt-1.5 w-full bg-[#ede7f5] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isFull ? 'bg-[#dfabb8]' : 'bg-[#8c7fb4]'}`}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Completed Event: Outcomes Panel ────────────────────── */}
      {isCompleted && (
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#cfc7df] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#faeaee] flex items-center justify-center">
              <Trophy className="w-4 h-4 text-[#a97c2f]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1e1730]">Event Outcomes</h2>
              <p className="text-[10px] text-[#7a7088]">
                Add or update results and photos for this completed event
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Achievement summary */}
            <div className="space-y-1.5">
              <label
                htmlFor="mgmt-achievement"
                className="text-xs font-bold text-[#1e1730] uppercase tracking-wider"
              >
                Achievement / Result Summary
              </label>
              <input
                id="mgmt-achievement"
                type="text"
                placeholder='e.g. "Winner: Team SparkForge (Dept of ECE)"'
                value={outcome.achievement}
                onChange={(e) => {
                  setOutcome((p) => ({ ...p, achievement: e.target.value }))
                  setOutcomeSaved(false)
                }}
                className={inputClass}
              />
            </div>

            {/* Winner / Runner-up */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="mgmt-winner"
                  className="flex items-center gap-1.5 text-xs font-bold text-[#1e1730] uppercase tracking-wider"
                >
                  <span>🥇</span> Winner
                </label>
                <input
                  id="mgmt-winner"
                  type="text"
                  placeholder="Team / Individual name — Department"
                  value={outcome.winner}
                  onChange={(e) => {
                    setOutcome((p) => ({ ...p, winner: e.target.value }))
                    setOutcomeSaved(false)
                  }}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="mgmt-runner"
                  className="flex items-center gap-1.5 text-xs font-bold text-[#1e1730] uppercase tracking-wider"
                >
                  <span>🥈</span> Runner-up
                </label>
                <input
                  id="mgmt-runner"
                  type="text"
                  placeholder="Team / Individual name — Department"
                  value={outcome.runnerUp}
                  onChange={(e) => {
                    setOutcome((p) => ({ ...p, runnerUp: e.target.value }))
                    setOutcomeSaved(false)
                  }}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Photo URLs */}
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#1e1730] uppercase tracking-wider">
                <ImagePlus className="w-3.5 h-3.5 text-[#7a7088]" />
                Event Photos
              </label>

              {/* Add URL input */}
              <div className="flex gap-2">
                <input
                  id="mgmt-photo-url"
                  type="url"
                  placeholder="Paste an image URL and press Add"
                  value={photoInput}
                  onChange={(e) => setPhotoInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPhoto())}
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#e8e3f7] text-[#554b73] rounded-xl text-xs font-semibold hover:bg-[#ded7ef] transition-colors shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {/* Photo grid preview */}
              {photoUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photoUrls.map((src, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-[#ede7f5] border border-[#cfc7df]"
                    >
                      <img
                        src={src}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-[#2a2337]/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#b85b71]/80"
                        aria-label="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 rounded-xl border border-dashed border-[#d5ccdf] bg-[#f8f5fc] text-[#7a7088]">
                  <ImagePlus className="w-7 h-7 mb-2 opacity-60" />
                  <p className="text-xs font-medium">No photos added yet</p>
                  <p className="text-[10px] mt-0.5 opacity-70">
                    Paste image URLs above to add event photos
                  </p>
                </div>
              )}
            </div>

            {/* Save error */}
            {saveError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#faeaee] border border-[#f0c5cf] text-[#b85b71] text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Save button */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#cfc7df]">
              {outcomeSaved && !savingOutcome && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#5a8a5a]">
                  <CheckCircle2 className="w-4 h-4" />
                  Outcomes saved successfully
                </span>
              )}
              <Button
                variant="secondary"
                icon={CheckCircle2}
                onClick={handleSaveOutcome}
                disabled={savingOutcome}
              >
                {savingOutcome ? 'Saving Outcomes...' : 'Save Outcomes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Registrations Snapshot ─────────────────────────────── */}
      <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#cfc7df] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e8e3f7] flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-[#8c7fb4]" />
            </div>
            <h2 className="text-sm font-bold text-[#1e1730]">Registrations</h2>
            <span className="ml-1 bg-[#8c7fb4] text-white rounded-full px-2 py-px text-[10px] font-bold">
              {registrations.length}
            </span>
          </div>
          <Link
            to={`/organizer/events/${rawEvent.id}/registrations`}
            className="text-xs font-semibold text-[#b85b71] hover:text-[#6b3546] transition-colors"
          >
            View Full List →
          </Link>
        </div>

        {registrations.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <Users className="w-8 h-8 text-[#ccc5d8] mb-2" />
            <p className="text-xs text-[#7a7088]">No registrations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0eaf5]">
            {registrations.slice(0, 5).map((reg) => (
              <div key={reg.id} className="flex items-center gap-4 px-6 py-3">
                <div className="w-8 h-8 rounded-full bg-[#e8e3f7] flex items-center justify-center text-xs font-bold text-[#8c7fb4] shrink-0">
                  {reg.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1e1730] truncate">{reg.name}</p>
                  <p className="text-[10px] text-[#7a7088] truncate">{reg.email}</p>
                </div>
                <span className="text-[10px] text-[#7a7088] shrink-0 hidden sm:block">
                  {reg.registeredOn}
                </span>
              </div>
            ))}
            {registrations.length > 5 && (
              <div className="px-6 py-3 text-center">
                <Link
                  to={`/organizer/events/${rawEvent.id}/registrations`}
                  className="text-xs font-semibold text-[#8c7fb4] hover:text-[#554b73] transition-colors"
                >
                  + {registrations.length - 5} more registrations
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
