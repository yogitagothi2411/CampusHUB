import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getUserById, getStudentRegistrations, updateUserStatus } from '../../services/api'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  BookOpen,
  CalendarDays,
  Hash,
  Ticket,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX,
  ExternalLink,
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

export default function AdminStudentDetails() {
  const { studentId } = useParams()

  const [student, setStudent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [statusFeedback, setStatusFeedback] = useState(null)

  useEffect(() => {
    let ignore = false

    Promise.all([
      getUserById(studentId),
      getStudentRegistrations(studentId),
    ])
      .then(([userData, regData]) => {
        if (!ignore) {
          setStudent(userData)
          setRegistrations(regData || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load student details')
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [studentId, refreshKey])

  const handleToggleStatus = async () => {
    if (!student) return
    const newStatus = student.status === 'Active' ? 'Inactive' : 'Active'
    try {
      const res = await updateUserStatus(student.id, newStatus)
      if (res.success) {
        setStatusFeedback({
          type: 'success',
          text: `Account status updated to ${newStatus}.`,
        })
        setRefreshKey((k) => k + 1)
      }
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        text: err.message || 'Failed to update student status.',
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-6 w-36 bg-[#e4dced] rounded-lg" />
        <div className="h-48 bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl" />
        <div className="h-64 bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 flex justify-center">
        <Card className="w-full max-w-md text-center py-10 px-8 bg-[#f0ebf8] border-[#cfc7df]">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#faeaee] text-[#b85b71] flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#1e1730]">Unable to Load Student</h1>
          <p className="mt-2 text-xs text-[#5a5168]">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="primary"
              icon={RefreshCw}
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              Retry
            </Button>
            <Link to="/admin/students">
              <Button variant="outline" icon={ArrowLeft}>
                Back to Students
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="py-12 flex justify-center">
        <Card className="w-full max-w-md text-center py-10 px-8 bg-[#f0ebf8] border-[#cfc7df]">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#faeaee] text-[#b85b71] flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#1e1730]">Student Not Found</h1>
          <p className="mt-2 text-xs text-[#5a5168]">
            Student ID &quot;{studentId}&quot; does not exist or may have been removed.
          </p>
          <div className="mt-6">
            <Link to="/admin/students">
              <Button variant="primary" icon={ArrowLeft}>
                Back to Students
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const isActive = student.status === 'Active'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── Breadcrumb & Back Link ────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/students"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c7fb4] hover:text-[#554b73] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Students</span>
        </Link>
      </div>

      {/* ── Feedback Banner ───────────────────────────────────── */}
      {statusFeedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium animate-fadeIn ${
            statusFeedback.type === 'success'
              ? 'bg-[#edf7ed] border-[#c8e6c9] text-[#2e7d32]'
              : 'bg-[#faeaee] border-[#f0c5cf] text-[#b85b71]'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2e7d32]" />
            <span>{statusFeedback.text}</span>
          </div>
          <button
            onClick={() => setStatusFeedback(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Student Profile Header Card ──────────────────────── */}
      <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#ede7f5] shrink-0 border-2 border-[#d6cde9]">
              <img
                src={student.avatar}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-[#1e1730]">{student.name}</h1>
                <Badge variant="powder" size="sm">
                  {student.studentId}
                </Badge>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-[#e8f5e9] text-[#2e7d32]'
                      : 'bg-[#faeaee] text-[#b85b71]'
                  }`}
                >
                  {student.status}
                </span>
              </div>
              <p className="text-xs text-[#5a5168] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#7a7088]" />
                {student.email}
              </p>
            </div>
          </div>

          {/* Status Toggle Action */}
          <div>
            <Button
              variant={isActive ? 'outline' : 'secondary'}
              size="sm"
              icon={isActive ? UserX : UserCheck}
              onClick={handleToggleStatus}
              className={isActive ? 'border-[#f0c5cf] text-[#b85b71] hover:bg-[#faeaee]' : ''}
            >
              {isActive ? 'Deactivate Student Account' : 'Activate Student Account'}
            </Button>
          </div>
        </div>

        {/* Academic Details Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#ede7f5]">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#ede8f6] border border-[#cfc7df]">
            <div className="w-9 h-9 rounded-lg bg-[#dbe8f6] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-[#416287]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Branch / Course</p>
              <p className="text-xs font-semibold text-[#1e1730] mt-0.5">{student.branch}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#ede8f6] border border-[#cfc7df]">
            <div className="w-9 h-9 rounded-lg bg-[#f2edf8] flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-[#5a5168]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Academic Year</p>
              <p className="text-xs font-semibold text-[#1e1730] mt-0.5">{student.year} ({student.batch})</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#ede8f6] border border-[#cfc7df]">
            <div className="w-9 h-9 rounded-lg bg-[#e8e3f7] flex items-center justify-center shrink-0">
              <Ticket className="w-4 h-4 text-[#8c7fb4]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">Registered Events</p>
              <p className="text-xs font-semibold text-[#1e1730] mt-0.5">{registrations.length} Events</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Student Registration History ──────────────────────── */}
      <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#ede7f5]">
          <div>
            <h2 className="text-base font-bold text-[#1e1730]">Event Registration History</h2>
            <p className="text-xs text-[#5a5168] mt-0.5">
              Verified campus events this student has registered for
            </p>
          </div>
          <span className="bg-[#e8e3f7] text-[#554b73] px-2.5 py-1 rounded-full text-xs font-bold">
            {registrations.length} {registrations.length === 1 ? 'Event' : 'Events'}
          </span>
        </div>

        {registrations.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f2edf8] text-[#7a7088] flex items-center justify-center mx-auto mb-3">
              <Ticket className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#1e1730]">No registrations found</p>
            <p className="text-xs text-[#5a5168] mt-1 max-w-xs mx-auto">
              This student has not yet registered for any campus events.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {registrations.map((reg) => {
              const catVariant = categoryBadgeMap[reg.category] || 'lavender'

              return (
                <div
                  key={reg.id}
                  className="bg-[#ede8f6] border border-[#cfc7df] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#cfc4de] transition-colors"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={catVariant} size="sm">
                        {reg.category}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#5a5168] bg-[#f5eff9] px-2 py-0.5 rounded">
                        <Hash className="w-3 h-3 text-[#7a7088]" />
                        {reg.ticketId}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f5e9] text-[#2e7d32]">
                        {reg.status}
                      </span>
                    </div>

                    <Link
                      to={`/admin/events/${reg.eventId}`}
                      className="text-sm font-bold text-[#1e1730] hover:text-[#8c7fb4] transition-colors flex items-center gap-1.5 line-clamp-1"
                    >
                      <span>{reg.eventTitle}</span>
                      <ExternalLink className="w-3 h-3 text-[#7a7088]" />
                    </Link>

                    <div className="flex items-center gap-4 text-xs text-[#5a5168] flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-[#8c7fb4]" />
                        {reg.date}
                      </span>
                      {reg.time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#7a7088]" />
                          {reg.time}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#7a7088]" />
                        {reg.venue}
                      </span>
                      <span className="text-[11px] text-[#7a7088]">
                        Registered on: {reg.registeredOn}
                      </span>
                    </div>
                  </div>

                  <div className="sm:self-center self-end shrink-0">
                    <Link
                      to={`/admin/events/${reg.eventId}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#f5eff9] text-[#554b73] rounded-lg text-xs font-semibold hover:bg-[#e8e3f7] transition-colors"
                    >
                      View Event
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
