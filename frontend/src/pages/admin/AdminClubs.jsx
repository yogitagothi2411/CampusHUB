import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getClubs,
  createClub,
  updateClub,
  updateClubStatus,
  getEvents,
} from '../../services/api'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import {
  Building2,
  Search,
  Filter,
  X,
  RotateCcw,
  PlusCircle,
  Eye,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Users,
  CalendarDays,
  ShieldCheck,
  Power,
  Layers,
  Mail,
} from 'lucide-react'

const COMMITTEES = [
  'All',
  'Technical Committee',
  'Cultural Committee',
  'Sports Committee',
  'Design & Creative',
  'Editorial Committee',
]

const STATUSES = ['All', 'Active', 'Inactive']

export default function AdminClubs() {
  const [searchParams, setSearchParams] = useSearchParams()

  const searchParam = searchParams.get('search') || ''
  const committeeParam = searchParams.get('committee') || 'All'
  const statusParam = searchParams.get('status') || 'All'

  const [searchInput, setSearchInput] = useState(searchParam)
  const [prevSearch, setPrevSearch] = useState(searchParam)
  if (searchParam !== prevSearch) {
    setPrevSearch(searchParam)
    setSearchInput(searchParam)
  }

  const [clubs, setClubs] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [feedback, setFeedback] = useState(null)

  // Modals state
  const [viewingClub, setViewingClub] = useState(null)
  const [editingClub, setEditingClub] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Form states
  const initialForm = {
    name: '',
    shortName: '',
    category: 'Technical',
    committee: 'Technical Committee',
    lead: '',
    email: '',
    membersCount: 50,
    tags: '',
    description: '',
    image: '',
    coverImage: '',
  }
  const [formData, setFormData] = useState(initialForm)
  const [formError, setFormError] = useState('')

  // Load data
  useEffect(() => {
    let ignore = false

    Promise.all([
      getClubs({ search: searchParam, status: statusParam }),
      getEvents({ includeCompleted: true }),
    ])
      .then(([clubsData, eventsData]) => {
        if (!ignore) {
          // Additional committee filtering if selected
          let filteredClubs = clubsData || []
          if (committeeParam && committeeParam !== 'All') {
            filteredClubs = filteredClubs.filter(
              (c) =>
                (c.committee || '').toLowerCase() === committeeParam.toLowerCase() ||
                (c.category || '').toLowerCase() === committeeParam.toLowerCase()
            )
          }
          setClubs(filteredClubs)
          setEvents(eventsData || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load clubs')
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [searchParam, committeeParam, statusParam, refreshKey])

  // Map club event counts
  const clubEventCounts = useMemo(() => {
    const counts = {}
    events.forEach((e) => {
      if (e.clubId) {
        counts[e.clubId] = (counts[e.clubId] || 0) + 1
      }
    })
    return counts
  }, [events])

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = clubs.length
    const active = clubs.filter((c) => (c.status || 'Active') === 'Active').length
    const totalMembers = clubs.reduce((sum, c) => sum + (Number(c.membersCount) || 0), 0)
    const totalEvents = clubs.reduce(
      (sum, c) => sum + (clubEventCounts[c.id] || 0),
      0
    )

    return { total, active, totalMembers, totalEvents }
  }, [clubs, clubEventCounts])

  // URL search params updater
  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'All' || value === '') {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setSearchParams(next, { replace: true })
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateFilter('search', searchInput.trim())
  }

  const handleClearSearch = () => {
    setSearchInput('')
    updateFilter('search', '')
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setSearchParams({}, { replace: true })
  }

  const hasActiveFilters =
    Boolean(searchParam) || committeeParam !== 'All' || statusParam !== 'All'

  // Toggle club status
  const handleToggleStatus = async (club) => {
    const newStatus = club.status === 'Inactive' ? 'Active' : 'Inactive'
    try {
      const res = await updateClubStatus(club.id, newStatus)
      if (res) {
        setFeedback({
          type: 'success',
          text: `"${club.name}" status changed to ${newStatus}.`,
        })
        setRefreshKey((k) => k + 1)
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to update club status.',
      })
    }
  }

  // Open Create Modal
  const openCreateModal = () => {
    setFormData(initialForm)
    setFormError('')
    setIsCreateOpen(true)
  }

  // Open Edit Modal
  const openEditModal = (club) => {
    setEditingClub(club)
    setFormData({
      name: club.name || '',
      shortName: club.shortName || '',
      category: club.category || 'Technical',
      committee: club.committee || 'Technical Committee',
      lead: club.lead || '',
      email: club.email || '',
      membersCount: club.membersCount || 0,
      tags: Array.isArray(club.tags) ? club.tags.join(', ') : club.tags || '',
      description: club.description || '',
      image: club.image || '',
      coverImage: club.coverImage || '',
    })
    setFormError('')
  }

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.lead.trim()) {
      setFormError('Please enter club name and student lead.')
      return
    }

    setFormSubmitting(true)
    try {
      await createClub(formData)
      setIsCreateOpen(false)
      setFeedback({
        type: 'success',
        text: `Club "${formData.name}" was successfully registered!`,
      })
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setFormError(err.message || 'Failed to create club.')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.lead.trim()) {
      setFormError('Please enter club name and student lead.')
      return
    }

    setFormSubmitting(true)
    try {
      await updateClub(editingClub.id, formData)
      setEditingClub(null)
      setFeedback({
        type: 'success',
        text: `Club "${formData.name}" updated successfully.`,
      })
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setFormError(err.message || 'Failed to update club.')
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#faeaee] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-[#8a3852]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e1730]">Clubs & Committees</h1>
            <p className="text-xs text-[#5a5168] mt-0.5">
              Supervise student clubs, societies, leads, and operational statuses
            </p>
          </div>
        </div>

        <Button
          onClick={openCreateModal}
          variant="primary"
          className="bg-[#241c35] hover:bg-[#342a4a] text-white flex items-center gap-2 text-xs py-2 px-4 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Club</span>
        </Button>
      </div>

      {/* ── Feedback Message Banner ───────────────────────────── */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-[#edf7ed] border-[#c8e6c9] text-[#2e7d32]'
              : 'bg-[#faeaee] border-[#f0c5cf] text-[#b85b71]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2e7d32]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#b85b71]" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Summary Metrics Strip ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#faeaee] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-[#8a3852]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.total}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Total Clubs</p>
          </div>
        </div>

        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e5eff8] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#1e426b]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.active}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Active Organizations</p>
          </div>
        </div>

        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#faede4] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#613622]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.totalMembers}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Total Student Members</p>
          </div>
        </div>

        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ede8f8] flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-[#392e59]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.totalEvents}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Events Organized</p>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────────────────────────── */}
      <Card className="bg-[#f0ebf8] border-[#cfc7df] p-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7088]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by club name, short name, lead, or tags..."
              className="w-full pl-9 pr-8 py-2 bg-white/80 border border-[#cfc7df] rounded-xl text-xs text-[#1e1730] placeholder-[#7a7088] focus:outline-none focus:border-[#7d6b97] transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7a7088] hover:text-[#1e1730]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Committee Filter */}
            <div className="flex items-center gap-1.5 bg-white/80 border border-[#cfc7df] rounded-xl px-2.5 py-1.5 text-xs text-[#5a5168]">
              <Layers className="w-3.5 h-3.5 text-[#7a7088]" />
              <select
                value={committeeParam}
                onChange={(e) => updateFilter('committee', e.target.value)}
                className="bg-transparent focus:outline-none text-[#1e1730] cursor-pointer text-xs"
              >
                {COMMITTEES.map((com) => (
                  <option key={com} value={com}>
                    {com}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-white/80 border border-[#cfc7df] rounded-xl px-2.5 py-1.5 text-xs text-[#5a5168]">
              <Filter className="w-3.5 h-3.5 text-[#7a7088]" />
              <select
                value={statusParam}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="bg-transparent focus:outline-none text-[#1e1730] cursor-pointer text-xs"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st === 'All' ? 'All Statuses' : st}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 px-2.5 text-xs text-[#5a5168] hover:text-[#1e1730] flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Results Count Strip */}
        <div className="mt-3 pt-2.5 border-t border-[#cfc7df]/60 flex items-center justify-between text-[11px] text-[#7a7088]">
          <span>
            Showing <strong className="text-[#1e1730]">{clubs.length}</strong>{' '}
            {clubs.length === 1 ? 'club' : 'clubs'}
          </span>
          {hasActiveFilters && (
            <span className="bg-[#e4ddf0] px-2 py-0.5 rounded-full text-[#5a5168] font-medium">
              Filters Active
            </span>
          )}
        </div>
      </Card>

      {/* ── Clubs Table View (Desktop & Tablet) ───────────────── */}
      <Card className="bg-[#f0ebf8] border-[#cfc7df] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#7a7088]">
            <div className="w-6 h-6 border-2 border-[#7d6b97] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading clubs catalog...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-[#b85b71]">
            <AlertCircle className="w-6 h-6 mx-auto mb-1 text-[#b85b71]" />
            {error}
          </div>
        ) : clubs.length === 0 ? (
          <div className="p-12 text-center text-[#7a7088]">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#7a7088]" />
            <p className="text-sm font-medium text-[#1e1730]">No clubs found</p>
            <p className="text-xs text-[#7a7088] mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your search query or filter selection.'
                : 'No clubs are registered in the directory yet.'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="mt-4 text-xs"
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#e4ddf0] text-[#5a5168] font-semibold border-b border-[#cfc7df]">
                <tr>
                  <th className="py-3 px-4">Club / Society</th>
                  <th className="py-3 px-4">Committee</th>
                  <th className="py-3 px-4">Student Lead</th>
                  <th className="py-3 px-4 text-center">Members</th>
                  <th className="py-3 px-4 text-center">Events</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cfc7df]/60 text-[#1e1730]">
                {clubs.map((club) => {
                  const isActive = (club.status || 'Active') === 'Active'
                  const eventCount = clubEventCounts[club.id] || 0

                  return (
                    <tr
                      key={club.id}
                      className="hover:bg-white/40 transition-colors group"
                    >
                      {/* Club info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              club.image ||
                              'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={club.name}
                            className="w-9 h-9 rounded-xl object-cover border border-[#cfc7df] shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1e1730] truncate">
                              {club.name}
                            </p>
                            <span className="text-[11px] text-[#7a7088] font-mono">
                              {club.shortName || club.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Committee & category */}
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            club.category === 'Technical'
                              ? 'powder'
                              : club.category === 'Cultural'
                              ? 'blush'
                              : club.category === 'Sports'
                              ? 'peach'
                              : 'lavender'
                          }
                          size="sm"
                          className="font-medium"
                        >
                          {club.committee || club.category}
                        </Badge>
                      </td>

                      {/* Lead */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-[#1e1730]">{club.lead || 'TBA'}</p>
                        <p className="text-[11px] text-[#7a7088] truncate">
                          {club.email || '—'}
                        </p>
                      </td>

                      {/* Members */}
                      <td className="py-3 px-4 text-center font-medium">
                        <span className="inline-flex items-center gap-1 text-[#5a5168]">
                          <Users className="w-3 h-3 text-[#7a7088]" />
                          {club.membersCount || 0}
                        </span>
                      </td>

                      {/* Events Count */}
                      <td className="py-3 px-4 text-center font-medium">
                        <span className="inline-flex items-center gap-1 text-[#5a5168]">
                          <CalendarDays className="w-3 h-3 text-[#7a7088]" />
                          {eventCount}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={isActive ? 'powder' : 'neutral'}
                          size="sm"
                          className={isActive ? 'text-[#1e426b] font-medium' : ''}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View details */}
                          <button
                            onClick={() => setViewingClub(club)}
                            className="p-1.5 rounded-lg text-[#5a5168] hover:text-[#1e1730] hover:bg-white/80 transition-colors"
                            title="View Club Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit club */}
                          <button
                            onClick={() => openEditModal(club)}
                            className="p-1.5 rounded-lg text-[#5a5168] hover:text-[#1e1730] hover:bg-white/80 transition-colors"
                            title="Edit Club Details"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(club)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? 'text-[#7a7088] hover:text-[#b85b71] hover:bg-[#faeaee]'
                                : 'text-[#2e7d32] hover:bg-[#edf7ed]'
                            }`}
                            title={isActive ? 'Deactivate Club' : 'Activate Club'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── VIEW CLUB MODAL ───────────────────────────────────── */}
      {viewingClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#f5f1fa] border border-[#cfc7df] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-scaleIn">
            {/* Modal Cover Image Banner */}
            <div className="relative h-32 bg-[#e4ddf0] overflow-hidden">
              <img
                src={
                  viewingClub.coverImage ||
                  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80'
                }
                alt="cover"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setViewingClub(null)}
                className="absolute top-3 right-3 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 relative pt-0">
              <div className="flex items-end justify-between -mt-10 mb-4">
                <img
                  src={
                    viewingClub.image ||
                    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&auto=format&fit=crop&q=80'
                  }
                  alt={viewingClub.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-[#f5f1fa] shadow-sm shrink-0"
                />
                <Badge
                  variant={
                    (viewingClub.status || 'Active') === 'Active'
                      ? 'powder'
                      : 'neutral'
                  }
                  size="md"
                >
                  {viewingClub.status || 'Active'}
                </Badge>
              </div>

              <h2 className="text-lg font-bold text-[#1e1730]">
                {viewingClub.name}
              </h2>
              <p className="text-xs text-[#7a7088] font-mono mt-0.5">
                {viewingClub.committee || 'Committee'} • {viewingClub.category}
              </p>

              <p className="text-xs text-[#5a5168] mt-3 leading-relaxed">
                {viewingClub.description || 'No description provided.'}
              </p>

              {/* Stats & Contacts Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#cfc7df]/60 text-xs">
                <div className="bg-white/60 p-3 rounded-xl border border-[#cfc7df]/60">
                  <span className="text-[11px] text-[#7a7088] block">Student Lead</span>
                  <strong className="text-[#1e1730] block mt-0.5">
                    {viewingClub.lead || 'Not assigned'}
                  </strong>
                  <span className="text-[11px] text-[#7a7088] flex items-center gap-1 mt-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" />
                    {viewingClub.email || '—'}
                  </span>
                </div>

                <div className="bg-white/60 p-3 rounded-xl border border-[#cfc7df]/60">
                  <span className="text-[11px] text-[#7a7088] block">Membership</span>
                  <strong className="text-[#1e1730] block mt-0.5">
                    {viewingClub.membersCount || 0} Registered Members
                  </strong>
                  <span className="text-[11px] text-[#7a7088] flex items-center gap-1 mt-1">
                    <CalendarDays className="w-3 h-3 shrink-0" />
                    {clubEventCounts[viewingClub.id] || 0} Associated Events
                  </span>
                </div>
              </div>

              {/* Tags */}
              {viewingClub.tags && viewingClub.tags.length > 0 && (
                <div className="mt-4">
                  <span className="text-[11px] text-[#7a7088] block mb-1.5 font-medium">
                    Specializations & Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(viewingClub.tags)
                      ? viewingClub.tags
                      : [viewingClub.tags]
                    ).map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-[#e4ddf0] text-[#392e59] text-[10px] px-2 py-0.5 rounded-md font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingClub(null)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const c = viewingClub
                    setViewingClub(null)
                    openEditModal(c)
                  }}
                  className="text-xs bg-[#241c35] text-white"
                >
                  Edit Club
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ───────────────────────────────── */}
      {(isCreateOpen || editingClub) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#f5f1fa] border border-[#cfc7df] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-5 border-b border-[#cfc7df]/80 bg-[#e4ddf0]/60">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#392e59]" />
                <h2 className="text-base font-bold text-[#1e1730]">
                  {isCreateOpen ? 'Add New Campus Club' : `Edit ${editingClub?.name}`}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsCreateOpen(false)
                  setEditingClub(null)
                }}
                className="text-[#7a7088] hover:text-[#1e1730]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs"
            >
              {formError && (
                <div className="p-3 bg-[#faeaee] border border-[#f0c5cf] rounded-xl text-[#b85b71] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block text-[#5a5168] font-semibold mb-1">
                    Club Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Coding Club"
                    className="w-full px-3 py-2 bg-white/90 border border-[#cfc7df] rounded-xl focus:outline-none focus:border-[#7d6b97]"
                  />
                </div>

                {/* Short Name */}
                <div>
                  <label className="block text-[#5a5168] font-semibold mb-1">
                    Short Name / Acronym
                  </label>
                  <input
                    type="text"
                    value={formData.shortName}
                    onChange={(e) =>
                      setFormData({ ...formData, shortName: e.target.value })
                    }
                    placeholder="e.g. Enigma"
                    className="w-full px-3 py-2 bg-white/90 border border-[#cfc7df] rounded-xl focus:outline-none focus:border-[#7d6b97]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Committee */}
                <div>
                  <label className="block text-[#5a5168] font-semibold mb-1">
                    Committee
                  </label>
                  <select
                    value={formData.committee}
                    onChange={(e) =>
                      setFormData({ ...formData, committee: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/90 border border-[#cfc7df] rounded-xl focus:outline-none focus:border-[#7d6b97]"
                  >
                    <option value="Technical Committee">Technical Committee</option>
                    <option value="Cultural Committee">Cultural Committee</option>
                    <option value="Sports Committee">Sports Committee</option>
                    <option value="Editorial Committee">Editorial Committee</option>
                    <option value="Design & Creative">Design & Creative</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[#5a5168] font-semibold mb-1">
                    Category Tag
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/90 border border-[#cfc7df] rounded-xl focus:outline-none focus:border-[#7d6b97]"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Design">Design</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Management">Management</option>
                    <option value="Literature">Literature</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Lead Name */}
                <div className="sm:col-span-1">
                  <label className="block text-[#5a5168] font-semibold mb-1">
                    Student Lead *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lead}
                    onChange={(e) =>
                      setFormData({ ...formData, lead: e.target.value })
                    }
                    placeholder="e.g. Arjun Mehta"
                    className="w-full px-3 py-2 bg-white/90 border border-[#cfc7df] rounded-xl focus:outline-none focus:border-[#7d6b97]"
                  />
                </div>

                {/* Lead Email */}
                <div className="sm:col-span-1">
                  <label className="block text-[#5a5168] font-semibold mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="club@iiitvadodara.ac.in"
                    className="w-full px-3 py-2 bg-white/90 border border-[#cfc7df] rounded-xl focus:outline-none focus:border-[#7d6b97]"
                  />
                </div>

                {/* Members Count */}
                <div className="sm:col-span-1">
                  <label className="block text-[#5a5168] font-semibold mb-1">
                    Members Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.membersCount}
                    onChange={(e) =>
                      setFormData({ ...formData, membersCount: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/90 border border-[#cfc7df] rounded-xl focus:outline-none focus:border-[#7d6b97]"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[#5a5168] font-semibold mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="e.g. Competitive Programming, ICPC, Web Development"
                  className="w-full px-3 py-2 bg-white/90 border border-[#cfc7df] rounded-xl focus:outline-none focus:border-[#7d6b97]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[#5a5168] font-semibold mb-1">
                  Club Mission & Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Outline the core activities and purpose of the student club..."
                  className="w-full px-3 py-2 bg-white/90 border border-[#cfc7df] rounded-xl focus:outline-none focus:border-[#7d6b97]"
                />
              </div>

              {/* Image URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5a5168] font-semibold mb-1">
                    Avatar Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-white/90 border border-[#cfc7df] rounded-xl focus:outline-none focus:border-[#7d6b97]"
                  />
                </div>

                <div>
                  <label className="block text-[#5a5168] font-semibold mb-1">
                    Cover Banner URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.coverImage}
                    onChange={(e) =>
                      setFormData({ ...formData, coverImage: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-white/90 border border-[#cfc7df] rounded-xl focus:outline-none focus:border-[#7d6b97]"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-[#cfc7df]/80 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false)
                    setEditingClub(null)
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formSubmitting}
                  variant="primary"
                  className="bg-[#241c35] text-white text-xs px-5"
                >
                  {formSubmitting
                    ? 'Saving...'
                    : isCreateOpen
                    ? 'Add Club'
                    : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
