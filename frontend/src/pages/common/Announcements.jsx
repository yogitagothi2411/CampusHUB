import { useState, useEffect } from 'react'
import { Megaphone, Plus, Trash2, Edit3, Search, Calendar, Tag, AlertCircle, Check } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { announcementService } from '../../services/api'
import { useAuth } from '../../context/useAuth'

export default function Announcements() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)

  // Admin Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: 'General',
    is_published: true,
  })
  const [submitting, setSubmitting] = useState(false)

  const categories = ['All', 'General', 'Institute', 'Technical', 'Cultural', 'Sports']

  const fetchAnnouncements = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await announcementService.getAnnouncements({
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        search: searchQuery || undefined,
      })
      setAnnouncements(data)
    } catch (err) {
      setError('Unable to load announcements. Please check network connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [categoryFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchAnnouncements()
  }

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({ title: '', body: '', category: 'General', is_published: true })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (ann) => {
    setEditingId(ann.id)
    setFormData({
      title: ann.title,
      body: ann.body,
      category: ann.category || 'General',
      is_published: ann.is_published,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return
    try {
      await announcementService.deleteAnnouncement(id)
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      alert('Failed to delete announcement.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.body.trim()) return

    setSubmitting(true)
    try {
      if (editingId) {
        const updated = await announcementService.updateAnnouncement(editingId, formData)
        setAnnouncements((prev) => prev.map((a) => (a.id === editingId ? updated : a)))
      } else {
        const created = await announcementService.createAnnouncement(formData)
        setAnnouncements((prev) => [created, ...prev])
      }
      setIsModalOpen(false)
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save announcement.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (isoString) => {
    if (!isoString) return ''
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e1730] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ded6f1] flex items-center justify-center text-[#5a4d88]">
              <Megaphone className="w-4 h-4" />
            </div>
            College Announcements
          </h1>
          <p className="text-xs text-[#5a5168] mt-1">
            Official institute notices, committee announcements, and campus circulars.
          </p>
        </div>

        {isAdmin && (
          <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Post Announcement
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-[#fdfcff] border-[#cfc7df]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#d9d2f0] text-[#3e3568] shadow-xs'
                    : 'bg-[#ede8f8]/60 text-[#5a5168] hover:bg-[#ede8f8] hover:text-[#1e1730]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative min-w-56">
            <input
              type="text"
              placeholder="Search notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#ede8f8]/50 border border-[#cfc7df] rounded-xl text-[#1e1730] focus:outline-hidden focus:ring-2 focus:ring-[#8c7fb4]/50"
            />
            <Search className="w-3.5 h-3.5 text-[#7a7088] absolute left-2.5 top-2.5 pointer-events-none" />
          </form>
        </div>
      </Card>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading & Content List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#7a7088]">
          Loading campus announcements...
        </div>
      ) : announcements.length === 0 ? (
        <Card className="p-12 text-center bg-[#fdfcff] border-[#cfc7df]">
          <Megaphone className="w-8 h-8 text-[#8c7fb4] mx-auto mb-2 opacity-50" />
          <p className="text-sm font-bold text-[#1e1730]">No announcements found</p>
          <p className="text-xs text-[#7a7088] mt-1">
            {searchQuery || categoryFilter !== 'All'
              ? 'Try adjusting your search query or category filter.'
              : 'There are no active official announcements published currently.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {announcements.map((ann) => (
            <Card key={ann.id} className="p-5 bg-[#fdfcff] border-[#cfc7df] hover:border-[#b8aed3] transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="lavender" size="sm">
                      <Tag className="w-3 h-3 mr-1" />
                      {ann.category}
                    </Badge>
                    <span className="text-[11px] text-[#7a7088] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(ann.created_at)}
                    </span>
                    {!ann.is_published && (
                      <Badge variant="rose" size="sm">
                        Draft / Unpublished
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#1e1730] leading-snug">
                    {ann.title}
                  </h3>

                  <p className="text-xs text-[#5a5168] whitespace-pre-line leading-relaxed">
                    {ann.body}
                  </p>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(ann)}
                      className="p-1.5 rounded-lg text-[#5a5168] hover:bg-[#ede8f8] hover:text-[#1e1730] transition-colors cursor-pointer"
                      title="Edit announcement"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ann.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Admin Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1730]/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-[#fdfcff] rounded-2xl border border-[#cfc7df] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-[#1e1730] mb-4">
              {editingId ? 'Edit Announcement' : 'Post Official Announcement'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1e1730] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Cerebro 2026 Tech Fest Schedule"
                  className="w-full px-3 py-2 text-xs bg-[#ede8f8]/40 border border-[#cfc7df] rounded-xl text-[#1e1730] focus:ring-2 focus:ring-[#8c7fb4]/50 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1e1730] mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#ede8f8]/40 border border-[#cfc7df] rounded-xl text-[#1e1730] focus:ring-2 focus:ring-[#8c7fb4]/50 focus:outline-hidden"
                >
                  <option value="General">General</option>
                  <option value="Institute">Institute</option>
                  <option value="Technical">Technical</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1e1730] mb-1">
                  Announcement Details
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Full text of the notice, guidelines, and schedule..."
                  className="w-full px-3 py-2 text-xs bg-[#ede8f8]/40 border border-[#cfc7df] rounded-xl text-[#1e1730] focus:ring-2 focus:ring-[#8c7fb4]/50 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="rounded text-[#5a4d88] focus:ring-[#8c7fb4]"
                />
                <label htmlFor="is_published" className="text-xs text-[#1e1730] font-medium">
                  Publish immediately (notifies all campus users)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#cfc7df]/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5a5168] hover:bg-[#ede8f8] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Update Notice' : 'Broadcast Announcement'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
