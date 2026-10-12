import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentStudent, getStudentRegisteredEvents } from '../../services/api'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import {
  Mail,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Ticket,
  ArrowRight,
} from 'lucide-react'

export default function Profile() {
  const [student, setStudent] = useState(null)
  const [registeredEvents, setRegisteredEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    getCurrentStudent().then((user) => {
      if (!ignore) {
        setStudent(user)
        if (user) {
          getStudentRegisteredEvents(user.id).then((events) => {
            if (!ignore) {
              setRegisteredEvents(events || [])
              setLoading(false)
            }
          })
        } else {
          setLoading(false)
        }
      }
    })
    return () => {
      ignore = true
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-40 rounded-3xl bg-[#ede7f5]" />
        <div className="h-60 rounded-3xl bg-[#f0ebf8] border border-[#cfc7df]" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-[#5a5168]">Unable to load profile data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* ── Profile Header Card ─────────────────────────────── */}
      <div className="rounded-3xl border border-[#cfc7df] bg-[#f0ebf8] p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-[#ede7f5] shrink-0">
            <img
              src={student.avatar}
              alt={student.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <Badge variant="lavender" size="sm">
                Student
              </Badge>
              <Badge variant="neutral" size="sm">
                ID: {student.studentId}
              </Badge>
              <Badge variant="powder" size="sm">
                {student.batch}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#1e1730] tracking-tight">
              {student.name}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-[#5a5168] justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1.5 justify-center sm:justify-start">
                <Mail className="w-3.5 h-3.5 text-[#7a7088]" />
                {student.email}
              </span>
              <span className="inline-flex items-center gap-1.5 justify-center sm:justify-start">
                <GraduationCap className="w-3.5 h-3.5 text-[#7a7088]" />
                {student.branch} ({student.year})
              </span>
            </div>

            <p className="text-xs text-[#7a7088] pt-1">
              Indian Institute of Information Technology Vadodara (IIITV)
            </p>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="mt-6 pt-6 border-t border-[#ede7f5] grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#ede8f6] border border-[#cfc7df] text-center">
            <span className="block text-xl font-bold text-[#1e1730]">
              {registeredEvents.length}
            </span>
            <span className="block text-[11px] font-semibold text-[#7a7088] uppercase mt-0.5">
              Registered Events
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#e8e3f7] border border-[#d6cde9] text-center">
            <span className="block text-xl font-bold text-[#554b73]">
              {registeredEvents.filter((e) => e.status !== 'Completed').length}
            </span>
            <span className="block text-[11px] font-semibold text-[#554b73] uppercase mt-0.5">
              Upcoming Passes
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-[#ede8f6] border border-[#cfc7df] text-center">
            <span className="block text-xl font-bold text-[#8c7fb4]">
              {student.year}
            </span>
            <span className="block text-[11px] font-semibold text-[#7a7088] uppercase mt-0.5">
              Academic Standing
            </span>
          </div>
        </div>
      </div>

      {/* ── Registered Events Section ───────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#8c7fb4]" />
            <h2 className="text-lg font-bold text-[#1e1730]">My Event Registrations</h2>
          </div>
          <Link
            to="/student/events"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#8c7fb4] hover:text-[#554b73]"
          >
            Explore more events
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {registeredEvents.length === 0 ? (
          <Card className="text-center py-12 px-6 bg-[#f0ebf8] border-[#cfc7df]">
            <div className="w-10 h-10 rounded-full bg-[#ede7f5] text-[#8c7fb4] mx-auto flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1e1730]">No registrations yet</h3>
            <p className="text-xs text-[#5a5168] mt-1 max-w-sm mx-auto">
              You haven&apos;t registered for any campus events yet. Explore upcoming hackathons, fests, and workshops to register.
            </p>
            <div className="mt-4 flex justify-center">
              <Link to="/student/events">
                <Button variant="primary" size="sm">
                  Discover Events
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {registeredEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-4 sm:p-5 rounded-2xl border border-[#cfc7df] bg-[#f0ebf8] hover:border-[#8c7fb4]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#ede7f5] shrink-0">
                    <img
                      src={evt.image}
                      alt={evt.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="lavender" size="sm">
                        {evt.category}
                      </Badge>
                      <Badge variant={evt.status === 'Completed' ? 'neutral' : 'peach'} size="sm">
                        {evt.status}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-bold text-[#1e1730] line-clamp-1">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-[#5a5168] mt-0.5">
                      {evt.date} • {evt.venue}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="flex items-center gap-1.5 text-xs text-[#554b73] font-medium px-2.5 py-1 rounded-lg bg-[#e8e3f7]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#8c7fb4]" />
                    <span>Registered</span>
                  </div>
                  <Link to={`/student/events/${evt.id}`}>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
