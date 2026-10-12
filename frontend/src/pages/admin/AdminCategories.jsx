import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  getCategories,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  getEvents,
} from '../../services/api'
import Badge from '../../components/common/Badge'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import {
  Tag,
  Search,
  Filter,
  X,
  RotateCcw,
  PlusCircle,
  Eye,
  Pencil,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Power,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  ExternalLink,
  Sparkles,
} from 'lucide-react'

const COLOR_THEMES = [
  { id: 'lavender', label: 'Lavender', previewBg: 'bg-[#ded4f5]', textColor: 'text-[#392e59]' },
  { id: 'blush', label: 'Blush', previewBg: 'bg-[#eed2d9]', textColor: 'text-[#5f2e3c]' },
  { id: 'powder', label: 'Powder Blue', previewBg: 'bg-[#d3e6f7]', textColor: 'text-[#1e426b]' },
  { id: 'peach', label: 'Peach', previewBg: 'bg-[#f4ded0]', textColor: 'text-[#613622]' },
  { id: 'mauve', label: 'Mauve', previewBg: 'bg-[#ded6f1]', textColor: 'text-[#41355c]' },
]

const STATUSES = ['All', 'Active', 'Inactive']

export default function AdminCategories() {
  const [searchParams, setSearchParams] = useSearchParams()

  const searchParam = searchParams.get('search') || ''
  const statusParam = searchParams.get('status') || 'All'

  const [searchInput, setSearchInput] = useState(searchParam)
  const [prevSearch, setPrevSearch] = useState(searchParam)
  if (searchParam !== prevSearch) {
    setPrevSearch(searchParam)
    setSearchInput(searchParam)
  }

  const [categories, setCategories] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table'

  // Modals state
  const [viewingCategory, setViewingCategory] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Form states
  const initialForm = {
    name: '',
    description: '',
    colorTheme: 'lavender',
    image: '',
    alt: '',
    status: 'Active',
  }
  const [formData, setFormData] = useState(initialForm)
  const [formError, setFormError] = useState('')

  // Load categories and events to compute event counts
  useEffect(() => {
    let ignore = false

    Promise.all([
      getCategories({ search: searchParam, status: statusParam }),
      getEvents({ includeCompleted: true }),
    ])
      .then(([catsData, eventsData]) => {
        if (!ignore) {
          setCategories(catsData || [])
          setEvents(eventsData || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load categories')
          setLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [searchParam, statusParam, refreshKey])

  // Count events per category name
  const categoryEventCounts = useMemo(() => {
    const counts = {}
    events.forEach((e) => {
      if (e.category) {
        counts[e.category.toLowerCase()] = (counts[e.category.toLowerCase()] || 0) + 1
      }
    })
    return counts
  }, [events])

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = categories.length
    const active = categories.filter((c) => (c.status || 'Active') === 'Active').length
    const inactive = total - active
    const totalEvents = events.length

    return { total, active, inactive, totalEvents }
  }, [categories, events])

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

  const hasActiveFilters = Boolean(searchParam) || statusParam !== 'All'

  // Toggle category status
  const handleToggleStatus = async (cat) => {
    const newStatus = cat.status === 'Inactive' ? 'Active' : 'Inactive'
    try {
      const res = await updateCategoryStatus(cat.id, newStatus)
      if (res) {
        setFeedback({
          type: 'success',
          text: `Category "${cat.name}" is now marked as ${newStatus}.`,
        })
        setRefreshKey((k) => k + 1)
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to update category status.',
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
  const openEditModal = (cat) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      colorTheme: cat.colorTheme || 'lavender',
      image: cat.image || '',
      alt: cat.alt || '',
      status: cat.status || 'Active',
    })
    setFormError('')
  }

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormError('Please enter a category name.')
      return
    }

    setFormSubmitting(true)
    try {
      await createCategory(formData)
      setIsCreateOpen(false)
      setFeedback({
        type: 'success',
        text: `Category "${formData.name}" created successfully.`,
      })
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setFormError(err.message || 'Failed to create category.')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormError('Please enter a category name.')
      return
    }

    setFormSubmitting(true)
    try {
      await updateCategory(editingCategory.id, formData)
      setEditingCategory(null)
      setFeedback({
        type: 'success',
        text: `Category "${formData.name}" updated successfully.`,
      })
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setFormError(err.message || 'Failed to update category.')
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#d5ccdf] flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5 text-[#443851]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e1730]">Categories Management</h1>
            <p className="text-xs text-[#5a5168] mt-0.5">
              Organize campus event categories, aesthetic themes, and discovery tags
            </p>
          </div>
        </div>

        <Button
          onClick={openCreateModal}
          variant="primary"
          className="bg-[#241c35] hover:bg-[#342a4a] text-white flex items-center gap-2 text-xs py-2 px-4 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Category</span>
        </Button>
      </div>

      {/* ── Feedback Banner ───────────────────────────────────── */}
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
          <div className="w-10 h-10 rounded-xl bg-[#d5ccdf] flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5 text-[#443851]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.total}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Total Categories</p>
          </div>
        </div>

        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e5eff8] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#1e426b]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.active}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Active Categories</p>
          </div>
        </div>

        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#faede4] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-[#613622]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.inactive}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Archived / Inactive</p>
          </div>
        </div>

        <div className="bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#faeaee] flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-[#8a3852]" />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1e1730]">{metrics.totalEvents}</p>
            <p className="text-[11px] text-[#7a7088] font-medium">Total Tagged Events</p>
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
              placeholder="Search category name or description..."
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

          {/* Controls Group */}
          <div className="flex items-center gap-2">
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

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/80 border border-[#cfc7df] rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#d5ccdf] text-[#1e1730]'
                    : 'text-[#7a7088] hover:text-[#1e1730]'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-[#d5ccdf] text-[#1e1730]'
                    : 'text-[#7a7088] hover:text-[#1e1730]'
                }`}
                title="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
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
            Showing <strong className="text-[#1e1730]">{categories.length}</strong>{' '}
            {categories.length === 1 ? 'category' : 'categories'}
          </span>
          {hasActiveFilters && (
            <span className="bg-[#e4ddf0] px-2 py-0.5 rounded-full text-[#5a5168] font-medium">
              Filters Active
            </span>
          )}
        </div>
      </Card>

      {/* ── Main Data View ────────────────────────────────────── */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#7a7088]">
          <div className="w-6 h-6 border-2 border-[#7d6b97] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading categories catalog...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-xs text-[#b85b71]">
          <AlertCircle className="w-6 h-6 mx-auto mb-1 text-[#b85b71]" />
          {error}
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center text-[#7a7088] bg-[#f0ebf8] border border-[#cfc7df] rounded-2xl">
          <Tag className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#7a7088]" />
          <p className="text-sm font-medium text-[#1e1730]">No categories found</p>
          <p className="text-xs text-[#7a7088] mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try modifying your search query or filter settings.'
              : 'No categories are currently defined.'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-4 text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid Cards View ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const isActive = (cat.status || 'Active') === 'Active'
            const eventCount = categoryEventCounts[cat.name?.toLowerCase()] || 0

            return (
              <div
                key={cat.id || cat.name}
                className={`rounded-2xl border p-4.5 flex flex-col justify-between transition-all duration-200 group hover:shadow-sm ${
                  cat.bgClass || 'bg-[#ede8f8] border-[#ddd4f3]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge
                          variant={isActive ? 'powder' : 'neutral'}
                          size="sm"
                          className={isActive ? 'text-[#1e426b] font-medium' : ''}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-[10px] text-[#7a7088] font-mono">
                          {cat.id}
                        </span>
                      </div>
                      <h3
                        className={`text-base font-bold truncate ${
                          cat.textColor || 'text-[#1e1730]'
                        }`}
                      >
                        {cat.name}
                      </h3>
                    </div>

                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/70 shadow-2xs shrink-0 border border-black/5">
                      <img
                        src={
                          cat.image ||
                          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'
                        }
                        alt={cat.alt || cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-[#5a5168] mt-2.5 line-clamp-2 leading-relaxed">
                    {cat.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                  <span className="text-[11px] text-[#5a5168] font-medium flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-[#7a7088]" />
                    {eventCount} {eventCount === 1 ? 'Event' : 'Events'}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* View */}
                    <button
                      onClick={() => setViewingCategory(cat)}
                      className="p-1.5 rounded-lg text-[#5a5168] hover:text-[#1e1730] hover:bg-white/80 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 rounded-lg text-[#5a5168] hover:text-[#1e1730] hover:bg-white/80 transition-colors"
                      title="Edit Category"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Toggle Status */}
                    <button
                      onClick={() => handleToggleStatus(cat)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'text-[#7a7088] hover:text-[#b85b71] hover:bg-[#faeaee]'
                          : 'text-[#2e7d32] hover:bg-[#edf7ed]'
                      }`}
                      title={isActive ? 'Deactivate Category' : 'Activate Category'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <Card className="bg-[#f0ebf8] border-[#cfc7df] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#e4ddf0] text-[#5a5168] font-semibold border-b border-[#cfc7df]">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Tagged Events</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cfc7df]/60 text-[#1e1730]">
                {categories.map((cat) => {
                  const isActive = (cat.status || 'Active') === 'Active'
                  const eventCount = categoryEventCounts[cat.name?.toLowerCase()] || 0

                  return (
                    <tr
                      key={cat.id || cat.name}
                      className="hover:bg-white/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              cat.image ||
                              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={cat.name}
                            className="w-8 h-8 rounded-lg object-cover border border-[#cfc7df] shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-[#1e1730]">{cat.name}</p>
                            <span className="text-[10px] text-[#7a7088] font-mono">
                              {cat.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-[#5a5168]">
                        {cat.description || '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        <span className="inline-flex items-center gap-1 text-[#5a5168]">
                          <CalendarDays className="w-3 h-3 text-[#7a7088]" />
                          {eventCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={isActive ? 'powder' : 'neutral'}
                          size="sm"
                          className={isActive ? 'text-[#1e426b] font-medium' : ''}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingCategory(cat)}
                            className="p-1.5 rounded-lg text-[#5a5168] hover:text-[#1e1730] hover:bg-white/80 transition-colors"
                            title="View Category"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 rounded-lg text-[#5a5168] hover:text-[#1e1730] hover:bg-white/80 transition-colors"
                            title="Edit Category"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(cat)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? 'text-[#7a7088] hover:text-[#b85b71] hover:bg-[#faeaee]'
                                : 'text-[#2e7d32] hover:bg-[#edf7ed]'
                            }`}
                            title={isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── VIEW CATEGORY MODAL ───────────────────────────────── */}
      {viewingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#f5f1fa] border border-[#cfc7df] rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scaleIn">
            <div className="relative h-28 bg-[#e4ddf0] overflow-hidden">
              <img
                src={
                  viewingCategory.image ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
                }
                alt={viewingCategory.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setViewingCategory(null)}
                className="absolute top-3 right-3 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 text-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#1e1730]">
                    {viewingCategory.name}
                  </h2>
                  <span className="text-[11px] text-[#7a7088] font-mono">
                    ID: {viewingCategory.id}
                  </span>
                </div>
                <Badge
                  variant={
                    (viewingCategory.status || 'Active') === 'Active'
                      ? 'powder'
                      : 'neutral'
                  }
                  size="md"
                >
                  {viewingCategory.status || 'Active'}
                </Badge>
              </div>

              <div>
                <span className="text-[11px] text-[#7a7088] block font-semibold mb-1">
                  Description
                </span>
                <p className="text-[#5a5168] leading-relaxed bg-white/60 p-3 rounded-xl border border-[#cfc7df]/60">
                  {viewingCategory.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex items-center justify-between bg-white/60 p-3 rounded-xl border border-[#cfc7df]/60">
                <span className="text-[#5a5168] font-medium">Associated Events:</span>
                <Link
                  to={`/admin/events?category=${encodeURIComponent(
                    viewingCategory.name
                  )}`}
                  className="font-bold text-[#392e59] hover:underline flex items-center gap-1"
                >
                  <span>
                    {categoryEventCounts[viewingCategory.name?.toLowerCase()] || 0}{' '}
                    Events
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingCategory(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const c = viewingCategory
                    setViewingCategory(null)
                    openEditModal(c)
                  }}
                  className="bg-[#241c35] text-white"
                >
                  Edit Category
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT CATEGORY MODAL ──────────────────────── */}
      {(isCreateOpen || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#f5f1fa] border border-[#cfc7df] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between p-5 border-b border-[#cfc7df]/80 bg-[#e4ddf0]/60">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#392e59]" />
                <h2 className="text-base font-bold text-[#1e1730]">
                  {isCreateOpen
                    ? 'Add New Category'
                    : `Edit Category: ${editingCategory?.name}`}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsCreateOpen(false)
                  setEditingCategory(null)
                }}
                className="text-[#7a7088] hover:text-[#1e1730]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit}
              className="p-6 space-y-4 text-xs"
            >
              {formError && (
                <div className="p-3 bg-[#faeaee] border border-[#f0c5cf] rounded-xl text-[#b85b71] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-[#5a5168] font-semibold mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Design & Creative"
                  className="w-full px-3 py-2 bg-white/90 border border-[#cfc7df] rounded-xl focus:outline-none focus:border-[#7d6b97]"
                />
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-[#5a5168] font-semibold mb-1.5">
                  Color Theme Palette
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_THEMES.map((theme) => {
                    const isSelected = formData.colorTheme === theme.id
                    return (
                      <button
                        type="button"
                        key={theme.id}
                        onClick={() =>
                          setFormData({ ...formData, colorTheme: theme.id })
                        }
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          isSelected
                            ? 'border-[#241c35] ring-2 ring-[#7d6b97]/30 bg-white'
                            : 'border-[#cfc7df] bg-white/60 hover:bg-white'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full ${theme.previewBg} border border-black/10`}
                        />
                        <span className="text-[10px] text-[#5a5168] font-medium">
                          {theme.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[#5a5168] font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe activities and events included in this category..."
                  className="w-full px-3 py-2 bg-white/90 border border-[#cfc7df] rounded-xl focus:outline-none focus:border-[#7d6b97]"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-[#5a5168] font-semibold mb-1">
                  Thumbnail Image URL (Optional)
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

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-[#cfc7df]/80 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false)
                    setEditingCategory(null)
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
                    ? 'Add Category'
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
