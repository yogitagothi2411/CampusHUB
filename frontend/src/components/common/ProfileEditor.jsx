import { useEffect, useState } from 'react'
import { Check, Edit3, X } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import Button from './Button'

const fieldClass = 'w-full rounded-xl border border-[#cfc7df] bg-white px-3 py-2.5 text-sm text-[#1e1730] outline-none focus:border-[#8c7fb4] focus:ring-2 focus:ring-[#8c7fb4]/20'
const labelClass = 'block text-xs font-semibold text-[#5a5168] mb-1.5'

export default function ProfileEditor({ onSaved }) {
  const { user, updateProfile } = useAuth()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({})

  useEffect(() => {
    setForm({
      name: user?.name || '',
      avatar: user?.avatar || '',
      studentId: user?.studentId || user?.student_id || '',
      batch: user?.batch || '',
      branch: user?.branch || '',
      year: user?.year || '',
      title: user?.title || '',
      clubName: user?.clubName || user?.club_name || '',
      committee: user?.committee || '',
    })
  }, [user])

  const change = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = { name: form.name.trim(), avatar: form.avatar.trim() }
      if (user?.role === 'student') Object.assign(payload, {
        studentId: form.studentId.trim(), batch: form.batch.trim(), branch: form.branch.trim(), year: form.year.trim(),
      })
      if (user?.role === 'organizer') Object.assign(payload, {
        title: form.title.trim(), clubName: form.clubName.trim(), committee: form.committee.trim(),
      })
      const updated = await updateProfile(payload)
      onSaved?.(updated)
      setSuccess('Your profile has been updated.')
      setOpen(false)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Unable to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-[#cfc7df] bg-[#f0ebf8] p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#1e1730]">Profile settings</h3>
          <p className="text-xs text-[#7a7088] mt-0.5">Update the personal details shown on your account.</p>
        </div>
        <Button variant="outline" size="sm" icon={Edit3} onClick={() => { setOpen((v) => !v); setError(''); setSuccess('') }}>
          {open ? 'Close' : 'Edit profile'}
        </Button>
      </div>

      {success && <p role="status" className="text-xs text-green-700">{success}</p>}
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}

      {open && (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label><span className={labelClass}>Full name *</span><input className={fieldClass} value={form.name || ''} onChange={change('name')} required maxLength={100} /></label>
            <label><span className={labelClass}>Email (cannot be changed here)</span><input className={`${fieldClass} opacity-70`} value={user?.email || ''} disabled /></label>
            <label className="sm:col-span-2"><span className={labelClass}>Profile photo URL</span><input className={fieldClass} type="url" placeholder="https://example.com/photo.jpg" value={form.avatar || ''} onChange={change('avatar')} /></label>
            {user?.role === 'student' && <>
              <label><span className={labelClass}>Student ID</span><input className={fieldClass} value={form.studentId || ''} onChange={change('studentId')} /></label>
              <label><span className={labelClass}>Batch</span><input className={fieldClass} value={form.batch || ''} onChange={change('batch')} /></label>
              <label><span className={labelClass}>Branch</span><input className={fieldClass} value={form.branch || ''} onChange={change('branch')} /></label>
              <label><span className={labelClass}>Year</span><input className={fieldClass} value={form.year || ''} onChange={change('year')} /></label>
            </>}
            {user?.role === 'organizer' && <>
              <label><span className={labelClass}>Designation</span><input className={fieldClass} value={form.title || ''} onChange={change('title')} /></label>
              <label><span className={labelClass}>Club name</span><input className={fieldClass} value={form.clubName || ''} onChange={change('clubName')} /></label>
              <label><span className={labelClass}>Committee</span><input className={fieldClass} value={form.committee || ''} onChange={change('committee')} /></label>
            </>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" icon={X} onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" icon={Check} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </form>
      )}
    </section>
  )
}