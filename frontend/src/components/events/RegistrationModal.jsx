import { useState } from 'react'
import { registerForEvent } from '../../services/api'
import Input from '../common/Input'
import Button from '../common/Button'
import Badge from '../common/Badge'
import { X, CheckCircle, Ticket, User, Mail, Hash, BookOpen, AlertCircle, Loader2 } from 'lucide-react'

export default function RegistrationModal({
  event,
  isOpen,
  onClose,
  onRegisterSuccess,
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [studentId, setStudentId] = useState('')
  const [department, setDepartment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [ticketId, setTicketId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)

  if (!isOpen || !event) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setApiError(null)

    try {
      const res = await registerForEvent(event.id, {
        fullName,
        email,
        studentId,
        department,
      })
      const passId = res?.ticketId || `CEH-${Math.floor(1000 + Math.random() * 9000)}`
      setTicketId(passId)
      setSubmitted(true)
      if (onRegisterSuccess) {
        onRegisterSuccess({
          fullName,
          email,
          studentId,
          department,
          ticketId: passId,
        })
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Registration could not be completed. The event may be full or unavailable.'
      setApiError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDone = () => {
    setSubmitted(false)
    setApiError(null)
    setFullName('')
    setEmail('')
    setStudentId('')
    setDepartment('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#2a2337]/35 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full sm:max-w-lg bg-[#f0ebf8] rounded-t-2xl sm:rounded-2xl border border-[#e5ddeee8] shadow-xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85dvh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#cfc7df] bg-[#f5eff9]">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-[#8c7fb4]" />
            <span className="text-sm font-bold text-[#1e1730]">
              {submitted ? 'Registration Confirmed' : 'Event Registration'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#7a7088] hover:text-[#1e1730] hover:bg-[#eae2f2] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#e8e3f7] text-[#8c7fb4] flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#1e1730]">
                  You&apos;re Registered!
                </h3>
                <p className="text-xs text-[#5a5168] mt-1 max-w-xs mx-auto">
                  Your registration for <strong className="text-[#1e1730]">{event.title}</strong> has been confirmed.
                </p>
              </div>

              {/* Pass Badge */}
              <div className="inline-block p-3 rounded-xl bg-[#f0ebf7] border border-[#ddd3eb] text-center">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">
                  Mock Ticket Code
                </span>
                <span className="text-base font-mono font-bold text-[#8c7fb4]">
                  {ticketId}
                </span>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleDone}
                  className="w-full justify-center"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <span className="block text-xs font-semibold text-[#7a7088]">
                  Registering for
                </span>
                <h4 className="text-sm font-bold text-[#1e1730] leading-snug line-clamp-1">
                  {event.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="lavender" size="sm">
                    {event.category}
                  </Badge>
                  <span className="text-xs text-[#7a7088]">
                    {event.date} • {event.time}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-[#cfc7df]">
                <Input
                  label="Student Full Name"
                  id="reg-fullName"
                  type="text"
                  placeholder="e.g. Alex Chen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  icon={User}
                  required
                />

                <Input
                  label="College Email"
                  id="reg-email"
                  type="email"
                  placeholder="alex.chen@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={Mail}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Student ID / Roll No"
                    id="reg-studentId"
                    type="text"
                    placeholder="e.g. 23CS0412"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    icon={Hash}
                    required
                  />

                  <Input
                    label="Branch / Department"
                    id="reg-dept"
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    icon={BookOpen}
                    required
                  />
                </div>
              </div>

              {apiError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#faeaee] border border-[#f0c5cf] text-[#b85b71] text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#cfc7df]">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registering...
                    </span>
                  ) : (
                    'Confirm Registration'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
