import axios from 'axios'
import { CLUBS } from '../data/clubs'
import { USERS } from '../data/users'
import { MOCK_REGISTRATIONS } from '../data/registrations'
import { CATEGORIES_CONFIG } from '../data/categories'

/* ==========================================================================
   1. AXIOS CLIENT & CONFIGURATION
   ========================================================================== */

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
export const API_BASE_URL = RAW_BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '')

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Request Interceptor: Attach JWT Bearer Token if present
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('ceh_token')
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      // localStorage may fail in restricted sandboxes
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Unified error handling and expired session cleanup
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status
      // 401 Unauthorized: token expired or invalid credentials
      if (status === 401) {
        try {
          localStorage.removeItem('ceh_token')
          localStorage.removeItem('ceh_user')
        } catch (e) {
          void e
        }
      }
      // Note: 403 Forbidden is intentionally NOT redirected, as it indicates
      // insufficient permissions for a specific action (e.g. modifying another organizer's event)
    }
    return Promise.reject(error)
  }
)

/* ==========================================================================
   2. FIELD NORMALIZATION & CONVERSION HELPERS
   ========================================================================== */

const CATEGORY_IMAGE_MAP = {
  Cultural: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
  Technical: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
  Hackathon: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
  Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80',
  Workshop: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
  Seminar: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80',
  Placement: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=80',
  Fest: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
  'Club Activities': 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=80',
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80'

export function normalizeBackendEvent(item) {
  if (!item) return null

  let dateStr = 'TBA'
  let timeStr = 'TBA'
  let timing = 'upcoming'
  const isCompletedStatus = item.status?.toLowerCase() === 'completed'

  if (item.date_time) {
    const d = new Date(item.date_time)
    if (!isNaN(d.getTime())) {
      dateStr = d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
      timeStr = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })

      const now = new Date()
      const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (d < now || isCompletedStatus) {
        timing = 'completed'
      } else if (diffDays <= 7) {
        timing = 'this_week'
      } else if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        timing = 'this_month'
      } else {
        timing = 'upcoming'
      }
    }
  } else if (isCompletedStatus) {
    timing = 'completed'
  }

  const category = item.category || 'General'
  const fallbackImage = CATEGORY_IMAGE_MAP[category] || DEFAULT_IMAGE

  return {
    id: item.id,
    name: item.name,
    title: item.name,
    category,
    venue: item.venue || 'IIIT Vadodara',
    description: item.description || '',
    date: dateStr,
    time: timeStr,
    rawDateTime: item.date_time || null,
    timing,
    status: item.status || (timing === 'completed' ? 'Completed' : 'Upcoming'),
    registrationLimit: item.capacity ?? 100,
    capacity: item.capacity ?? 100,
    registeredCount: item.registeredCount ?? 0,
    owner_id: item.owner_id ?? null,
    organizerId: item.owner_id ? `user-org-${item.owner_id}` : 'user-org-1',
    organizer: item.organizer || 'Coding Club',
    clubId: item.clubId || 'club-coding',
    image: item.image || fallbackImage,
    isHistorical: isCompletedStatus || timing === 'completed',
    tags: [category],
    winner: item.winner || null,
    runnerUp: item.runnerUp || null,
    achievement: item.achievement || null,
    photos: item.photos || [],
  }
}

export function toBackendEventPayload(formData) {
  const name = (formData.title || formData.name || '').trim() || 'Untitled Event'
  const category = formData.category || 'General'
  const venue = (formData.venue || '').trim() || 'IIIT Vadodara'
  const description = (formData.description || '').trim() || null
  const capacity = formData.registrationLimit
    ? Number(formData.registrationLimit)
    : formData.capacity
    ? Number(formData.capacity)
    : null
  const status = formData.status || 'Upcoming'

  let date_time = null
  if (formData.date) {
    let datePart = formData.date
    let timePart = '10:00:00'
    if (formData.time) {
      // Parse HH:MM or 12h format
      const match = formData.time.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i)
      if (match) {
        let hours = parseInt(match[1], 10)
        const minutes = match[2]
        const ampm = match[3]?.toUpperCase()
        if (ampm === 'PM' && hours < 12) hours += 12
        if (ampm === 'AM' && hours === 12) hours = 0
        timePart = `${String(hours).padStart(2, '0')}:${minutes}:00`
      }
    }
    // Handle standard YYYY-MM-DD
    const isoCandidate = `${datePart}T${timePart}`
    const parsed = new Date(isoCandidate)
    if (!isNaN(parsed.getTime())) {
      date_time = parsed.toISOString()
    }
  }

  return {
    name,
    category,
    venue,
    description,
    capacity: capacity && capacity > 0 ? capacity : null,
    status,
    date_time,
  }
}

/* ==========================================================================
   3. IN-MEMORY STATE FOR NON-BACKEND SERVICES (Clubs, Categories, Local Users)
   ========================================================================== */

let inMemoryClubs = CLUBS.map((c) => ({ ...c, status: c.status || 'Active' }))
let inMemoryCategories = CATEGORIES_CONFIG.map((c) => ({ ...c, status: c.status || 'Active' }))
let inMemoryUsers = [...USERS]
let inMemoryRegistrations = { ...MOCK_REGISTRATIONS }

/* ==========================================================================
   4. AUTHENTICATION SERVICES (FastAPI Backend)
   ========================================================================== */

export const authService = {
  /**
   * Log in via POST /auth/login (OAuth2 form-urlencoded: username + password)
   */
  
async login(email, password, expectedRole) {
  const response = await apiClient.post('/auth/login', {
    email: email.trim().toLowerCase(),
    password,
  })

  const { access_token } = response.data.data || {}

  if (!access_token) {
    throw new Error('No access token received from server')
  }

  localStorage.setItem('ceh_token', access_token)

  // Fetch authenticated user profile
  const profile = await this.getProfile(access_token)

  if (expectedRole && profile.role !== expectedRole) {
    this.logout()
    throw new Error(
      `This account is registered as ${profile.role}. Please use the ${profile.role} login.`
    )
  }

  localStorage.setItem('ceh_user', JSON.stringify(profile))

  return { token: access_token, user: profile }
},


  /**
   * Register a new user via POST /auth/register
   * Only 'student' and 'organizer' roles are permitted by backend
   */
  async register({ name, email, password, role = 'student' }) {
    if (role === 'admin') {
      throw new Error('Public registration cannot create admin accounts.')
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
    }

    const response = await apiClient.post('/auth/register', payload)
    return response.data
  },

  /**
   * Get authenticated user profile via GET /auth/me
   */
  

async getProfile(token) {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  const response = await apiClient.get('/auth/me', { headers })

  const body = response.data

  // Support the possible API response formats
  const profile =
    body?.data?.user ??
    body?.data ??
    body?.user ??
    body

  if (!profile || typeof profile !== 'object' || !profile.role) {
    console.error('Unexpected profile response:', body)
    throw new Error('User profile is missing or has an invalid response format.')
  }

  return profile
},



  async updateProfile(updates) {
    const current = this.getCurrentUser()
    if (!current?.id) throw new Error('You must be logged in to edit your profile.')
    const response = await apiClient.patch(`/users/${current.id}`, updates)
    const saved = response.data?.data ?? response.data
    const updated = {
      ...current,
      ...saved,
      studentId: saved.student_id ?? saved.studentId ?? current.studentId,
      clubName: saved.club_name ?? saved.clubName ?? current.clubName,
    }
    localStorage.setItem('ceh_user', JSON.stringify(updated))
    return updated
  },

  /**
   * Clear session credentials
   */
  logout() {
    try {
      localStorage.removeItem('ceh_token')
      localStorage.removeItem('ceh_user')
    } catch (e) {
      void e
    }
  },

  getToken() {
    try {
      return localStorage.getItem('ceh_token')
    } catch {
      return null
    }
  },

  getCurrentUser() {
    try {
      const stored = localStorage.getItem('ceh_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  },
}

/* ==========================================================================
   5. EVENT SERVICES (FastAPI Backend: GET, POST, PUT, PATCH, DELETE)
   ========================================================================== */

export const eventService = {
  /**
   * Fetch events from GET /events with client-side filtering support
   */
  async getEvents({ category, period, clubId, status, search, includeCompleted = false } = {}) {
    const response = await apiClient.get('/events')

// Backend response: { success: true, data: [...] }
const rawEvents = response.data?.data ?? response.data

if (!Array.isArray(rawEvents)) {
  throw new Error('Event API returned an invalid response')
}

const events = rawEvents
  .map(normalizeBackendEvent)
  .filter(Boolean)

    let filtered = events.filter((event) => {
      const isPastOrCompleted =
        event.timing === 'completed' || event.isHistorical || event.status === 'Completed'

      // Period filter
      if (period === 'past' || period === 'completed') {
        if (!isPastOrCompleted) return false
      } else if (period === 'upcoming') {
        if (isPastOrCompleted) return false
      } else if (period && period !== 'all') {
        if (isPastOrCompleted) return false
        if (event.timing !== period) return false
      } else if (!period || period === 'all') {
        if (!includeCompleted && status !== 'Completed' && isPastOrCompleted) return false
      }

      // Status filter
      if (status && status !== 'All') {
        if (event.status.toLowerCase() !== status.toLowerCase()) return false
      }

      // Club filter
      if (clubId && clubId !== 'All') {
        if (event.clubId !== clubId) return false
      }

      // Category filter
      if (category && category !== 'All') {
        if (event.category.toLowerCase() !== category.toLowerCase()) return false
      }

      // Search query filter
      if (search && search.trim()) {
        const q = search.toLowerCase()
        const matchTitle = (event.title || event.name || '').toLowerCase().includes(q)
        const matchCategory = (event.category || '').toLowerCase().includes(q)
        const matchVenue = (event.venue || '').toLowerCase().includes(q)
        const matchOrganizer = (event.organizer || '').toLowerCase().includes(q)
        const matchDesc = (event.description || '').toLowerCase().includes(q)
        if (!matchTitle && !matchCategory && !matchVenue && !matchOrganizer && !matchDesc) {
          return false
        }
      }

      return true
    })

    return filtered
  },

  /**
   * Fetch single event details by ID from GET /events/{id}
   */
  async getEventById(id) {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) {
      // If a non-numeric string ID is passed (e.g. legacy mock ID), query all and find match
      const all = await this.getEvents({ includeCompleted: true })
      return all.find((e) => String(e.id) === String(id)) || null
    }

    const response = await apiClient.get(`/events/${numericId}`)
    return normalizeBackendEvent(response.data)
  },

  /**
   * Delete event by ID via DELETE /events/{id}
   */
  async deleteEvent(eventId) {
    const numericId = parseInt(eventId, 10)
    await apiClient.delete(`/events/${numericId}`)
    delete inMemoryRegistrations[eventId]
    return { success: true, message: 'Event deleted successfully.' }
  },

  /**
   * Fetch completed & historical events
   */
  async getCompletedEvents() {
    const all = await this.getEvents({ includeCompleted: true })
    return all.filter((e) => e.timing === 'completed' || e.isHistorical || e.status === 'Completed')
  },

  /**
   * Fetch events by club
   */
  async getEventsByClub(clubId) {
    const all = await this.getEvents({ includeCompleted: true })
    return all.filter((e) => e.clubId === clubId)
  },
}

/* ==========================================================================
   6. ORGANIZER SERVICES (FastAPI Backend + Local Context)
   ========================================================================== */

export const organizerService = {
  /**
   * Fetch organizer portal events
   */
  async getEvents() {
    const currentUser = authService.getCurrentUser()
    const allEvents = await eventService.getEvents({ includeCompleted: true })
    if (currentUser?.role === 'admin') {
  return allEvents
}

if (currentUser?.role === 'organizer') {
  return allEvents.filter(
    (event) => String(event.owner_id) === String(currentUser.id)
  )
}

return []
  },

  /**
   * Create a new event via POST /events
   */
  async createEvent(eventData) {
    const payload = toBackendEventPayload(eventData)
    const response = await apiClient.post('/events', payload)
    return normalizeBackendEvent(response.data)
  },

  /**
   * Update an existing event via PUT /events/{id}
   */
  async updateEvent(eventId, eventData) {
    const numericId = parseInt(eventId, 10)
    const payload = toBackendEventPayload(eventData)
    const response = await apiClient.put(`/events/${numericId}`, payload)
    return normalizeBackendEvent(response.data)
  },

  /**
   * Fetch registered students for an event via GET /events/{id}/registrations
   */
  async getEventRegistrations(eventId) {
    return registrationService.getEventRegistrations(eventId)
  },

  /**
   * Fetch organizer profile and live computed stats from database
   */
  async getOrganizerProfile() {
    let currentUser = authService.getCurrentUser()
    const allEvents = await eventService.getEvents({ includeCompleted: true })
    const orgEvents = currentUser?.id
      ? allEvents.filter((e) => e.owner_id === currentUser.id)
      : allEvents

    const upcoming = orgEvents.filter(
      (e) => e.timing === 'current' || e.timing === 'this_week' || e.timing === 'this_month' || e.timing === 'upcoming'
    ).length
    const completed = orgEvents.filter(
      (e) => e.timing === 'completed' || e.isHistorical || e.status === 'Completed'
    ).length
    const totalRegistrations = orgEvents.reduce((acc, e) => acc + (e.registeredCount || 0), 0)

    const baseOrganizer = inMemoryUsers.find((u) => u.role === 'organizer') || {
      id: 'user-org-1',
      name: currentUser?.name || 'Coding Club Lead',
      email: currentUser?.email || 'organizer@iiitvadodara.ac.in',
      role: 'organizer',
      clubName: 'Coding Club',
      committee: 'Technical Committee',
      title: 'Lead Coordinator',
    }

    return {
      ...baseOrganizer,
      name: currentUser?.name || baseOrganizer.name,
      email: currentUser?.email || baseOrganizer.email,
      stats: {
        totalEvents: orgEvents.length,
        upcoming,
        completed,
        totalRegistrations,
      },
    }
  },
}

/* ==========================================================================
   7. ADMIN SERVICES (FastAPI Backend + Extended Management)
   ========================================================================== */

export const adminService = {
  
async getDashboardStats() {
  const [students, organizers, events, clubs] =
    await Promise.all([
      userService.getStudents(),
      userService.getOrganizers(),
      eventService.getEvents({ includeCompleted: true }),
      clubService.getClubs()
    ]);

  return {
    totalStudents: students.length,
    totalOrganizers: organizers.length,
    totalUsers: students.length + organizers.length,
    totalEvents: events.length,
    totalClubs: clubs.length
  };
},

  async getEvents(filters = {}) {
    return eventService.getEvents({ ...filters, includeCompleted: true })
  },
  async getEventById(id) {
    return eventService.getEventById(id)
  },
  async createEvent(eventData) {
    return organizerService.createEvent(eventData)
  },
  async updateEvent(eventId, eventData) {
    return organizerService.updateEvent(eventId, eventData)
  },
  async deleteEvent(eventId) {
    return eventService.deleteEvent(eventId)
  },
  async getEventRegistrations(eventId) {
    return organizerService.getEventRegistrations(eventId)
  },
  async getStudents(filters) {
    return userService.getStudents(filters)
  },
  async getStudentRegistrations(studentId) {
    return userService.getStudentRegistrations(studentId)
  },
  async getOrganizers(filters) {
    return userService.getOrganizers(filters)
  },
  async getOrganizerEvents(organizerId) {
    return userService.getOrganizerEvents(organizerId)
  },
  async getUserById(id) {
    return userService.getUserById(id)
  },
  async updateUserStatus(userId, status) {
    return userService.updateUserStatus(userId, status)
  },
  async getClubs(filters) {
    return clubService.getClubs(filters)
  },
  async getClubById(clubId) {
    return clubService.getClubById(clubId)
  },
  async createClub(clubData) {
    return clubService.createClub(clubData)
  },
  async updateClub(clubId, clubData) {
    return clubService.updateClub(clubId, clubData)
  },
  async updateClubStatus(clubId, status) {
    return clubService.updateClubStatus(clubId, status)
  },
  async getCategories(filters) {
    return categoryService.getCategories(filters)
  },
  async getCategoryById(id) {
    return categoryService.getCategoryById(id)
  },
  async createCategory(catData) {
    return categoryService.createCategory(catData)
  },
  async updateCategory(id, catData) {
    return categoryService.updateCategory(id, catData)
  },
  async updateCategoryStatus(id, status) {
    return categoryService.updateCategoryStatus(id, status)
  },
}

/* ==========================================================================
/* ==========================================================================
   8. CLUB & CATEGORY SERVICES (FastAPI Backend + Preserved IIIT Vadodara Catalog)
   ========================================================================== */

export function normalizeBackendClub(item) {
  if (!item) return null
  return {
    id: item.id,
    name: item.name,
    shortName: item.short_name || item.name,
    category: item.category || 'Technical',
    committee: item.committee || 'Technical Committee',
    description: item.description || '',
    lead: item.lead || 'Student Representative',
    email: item.contact_email || 'info@iiitvadodara.ac.in',
    contact_email: item.contact_email,
    membersCount: item.members_count ?? 50,
    tags: Array.isArray(item.tags) ? item.tags : [],
    image: item.image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
    coverImage: item.cover_image || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
    status: item.status || 'Active',
  }
}

export const clubService = {
  async getClubs({ category, search, status } = {}) {
    const params = {}
    if (category && category !== 'All') params.category = category
    if (search && search.trim()) params.search = search.trim()
    if (status && status !== 'All') params.status = status
    const res = await apiClient.get('/clubs', { params })
    const clubs = res.data?.data ?? res.data

if (!Array.isArray(clubs))
  throw new Error('Club API returned an invalid response')

return clubs.map(normalizeBackendClub)
  },

  async getClubById(clubId) {
    try {
      const res = await apiClient.get(`/clubs/${clubId}`)
      if (res.data) return normalizeBackendClub(res.data)
    } catch (e) {
      // A 404 means the club is inactive/hidden or does not exist; never show stale local data.
      if (e?.response?.status === 404) return null
    }
    return inMemoryClubs.find((c) => String(c.id) === String(clubId) && (c.status || 'Active').toLowerCase() === 'active') || null
  },

  async createClub(clubData) {
    const payload = {
      id: clubData.id,
      name: clubData.name,
      short_name: clubData.shortName || clubData.name,
      category: clubData.category || 'Technical',
      committee: clubData.committee || 'Technical Committee',
      description: clubData.description || '',
      lead: clubData.lead || 'Student Representative',
      contact_email: clubData.email || clubData.contact_email || 'info@iiitvadodara.ac.in',
      members_count: Number(clubData.membersCount) || 1,
      tags: Array.isArray(clubData.tags)
        ? clubData.tags
        : typeof clubData.tags === 'string' && clubData.tags.trim()
        ? clubData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : ['Student Activity'],
      image: clubData.image,
      cover_image: clubData.coverImage,
      status: clubData.status || 'Active',
    }
    const res = await apiClient.post('/clubs', payload)
    return normalizeBackendClub(res.data)
  },

  async updateClub(clubId, clubData) {
    const payload = {
      name: clubData.name,
      short_name: clubData.shortName,
      category: clubData.category,
      committee: clubData.committee,
      description: clubData.description,
      lead: clubData.lead,
      contact_email: clubData.email || clubData.contact_email,
      members_count: clubData.membersCount ? Number(clubData.membersCount) : undefined,
      tags: Array.isArray(clubData.tags)
        ? clubData.tags
        : typeof clubData.tags === 'string'
        ? clubData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : clubData.tags,
      image: clubData.image,
      cover_image: clubData.coverImage,
      status: clubData.status,
    }
    const res = await apiClient.put(`/clubs/${clubId}`, payload)
    return normalizeBackendClub(res.data)
  },

  async updateClubStatus(clubId, status) {
    return this.updateClub(clubId, { status })
  },

  async deleteClub(clubId) {
    await apiClient.delete(`/clubs/${clubId}`)
    return true
  },
}

export const categoryService = {
  async getCategories({ search, status } = {}) {
    const params = {}
    if (status && status !== 'All') params.status = status
    if (search && search.trim()) params.search = search.trim()
    const res = await apiClient.get('/categories', { params })
    const categories = Array.isArray(res.data) ? res.data : res.data?.data
    if (!Array.isArray(categories)) throw new Error('Category API returned an invalid response')
    return categories
  },

  async getCategoryById(id) {
    try {
      const res = await apiClient.get(`/categories/${id}`)
      const cat = res.data?.data ?? res.data
      if (cat) return cat
    } catch (e) {
      void e
    }
    return inMemoryCategories.find((c) => c.id === id) || null
  },

  async createCategory(catData) {
    const slug = (catData.name || 'category')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
    const id = catData.id || `cat-${slug}-${Date.now().toString().slice(-4)}`
    const themeMap = {
      lavender: { bgClass: 'bg-[#ede8f8] border-[#ddd4f3]', activeBg: 'bg-[#ded4f5] border-[#8c7fb4]', textColor: 'text-[#392e59]' },
      blush: { bgClass: 'bg-[#faeaee] border-[#eed2d9]', activeBg: 'bg-[#eed2d9] border-[#dfabb8]', textColor: 'text-[#5f2e3c]' },
      powder: { bgClass: 'bg-[#e5eff8] border-[#cee0f3]', activeBg: 'bg-[#d3e6f7] border-[#6a99ce]', textColor: 'text-[#1e426b]' },
      peach: { bgClass: 'bg-[#faede4] border-[#ebd6c7]', activeBg: 'bg-[#f4ded0] border-[#dfa891]', textColor: 'text-[#613622]' },
      mauve: { bgClass: 'bg-[#eeebf6] border-[#dad4ea]', activeBg: 'bg-[#ded6f1] border-[#8c7fb4]', textColor: 'text-[#41355c]' },
    }
    const theme = themeMap[catData.colorTheme] || themeMap.lavender
    const newCategory = {
      id,
      name: catData.name || 'New Category',
      ...theme,
      image:
        catData.image ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
      alt: catData.alt || `${catData.name || 'Category'} events`,
      description: catData.description || '',
      status: catData.status || 'Active',
    }
    const res = await apiClient.post('/categories', newCategory)
    return res.data?.data ?? res.data
  },

  async updateCategory(id, catData) {
    let themeTokens = {}
    if (catData.colorTheme) {
        const themeMap = {
          lavender: { bgClass: 'bg-[#ede8f8] border-[#ddd4f3]', activeBg: 'bg-[#ded4f5] border-[#8c7fb4]', textColor: 'text-[#392e59]' },
          blush: { bgClass: 'bg-[#faeaee] border-[#eed2d9]', activeBg: 'bg-[#eed2d9] border-[#dfabb8]', textColor: 'text-[#5f2e3c]' },
          powder: { bgClass: 'bg-[#e5eff8] border-[#cee0f3]', activeBg: 'bg-[#d3e6f7] border-[#6a99ce]', textColor: 'text-[#1e426b]' },
          peach: { bgClass: 'bg-[#faede4] border-[#ebd6c7]', activeBg: 'bg-[#f4ded0] border-[#dfa891]', textColor: 'text-[#613622]' },
          mauve: { bgClass: 'bg-[#eeebf6] border-[#dad4ea]', activeBg: 'bg-[#ded6f1] border-[#8c7fb4]', textColor: 'text-[#41355c]' },
        }
        themeTokens = themeMap[catData.colorTheme] || {}
    }
    const { colorTheme, ...rest } = catData
    void colorTheme
    const res = await apiClient.put(`/categories/${id}`, { ...rest, ...themeTokens })
    return res.data?.data ?? res.data
  },

  async updateCategoryStatus(id, status) {
    const res = await apiClient.put(`/categories/${id}`, { status })
    return res.data?.data ?? res.data
  },
}

/* ==========================================================================
   9. REGISTRATION & USER SERVICES (FastAPI Backend)
   ========================================================================== */

export const registrationService = {
  /**
   * Register authenticated student via POST /events/{id}/registrations
   */
  async registerForEvent(eventId, registrationData = {}) {
    const numericId = parseInt(eventId, 10)
    const payload = {
      student_roll: registrationData.studentRoll || registrationData.studentId || null,
      department: registrationData.department || registrationData.branch || null,
      student_name: registrationData.fullName || registrationData.name || null,
    }

    try {
      const res = await apiClient.post(`/events/${numericId}/registrations`, payload)
      return {
        success: true,
        message: 'Student registration recorded successfully.',
        ticketId: res.data.ticket_id,
        registeredAt: res.data.registered_at,
        status: res.data.status,
        id: res.data.id,
        eventId: res.data.event_id,
        ...res.data,
      }
    } catch (err) {
      if (err.response?.status === 409) {
        const registrationError = new Error(err.response.data?.detail || 'Already registered or event is full.')
        registrationError.response = err.response
        throw registrationError
      }
      throw err
    }
  },

  /**
   * Get current student registration status via GET /events/{id}/registrations/me
   */
  async getMyEventRegistration(eventId) {
    const numericId = parseInt(eventId, 10)
    const res = await apiClient.get(`/events/${numericId}/registrations/me`)
    return res.data
  },

  /**
   * Cancel student registration via DELETE /events/{id}/registrations/me
   */
  async cancelMyEventRegistration(eventId) {
    const numericId = parseInt(eventId, 10)
    const res = await apiClient.delete(`/events/${numericId}/registrations/me`)
    return res.data
  },

  /**
   * List current student's registrations via GET /registrations/me
   */
  async getMyRegistrations() {
    const res = await apiClient.get('/registrations/me')
    return res.data
  },

  /**
   * List attendees for event (organizer/admin) via GET /events/{id}/registrations
   */
  async getEventRegistrations(eventId) {
    const numericId = parseInt(eventId, 10)
    const res = await apiClient.get(`/events/${numericId}/registrations`)
    return res.data.map((r) => ({
      id: r.id,
      studentId: r.student_roll || String(r.student_id),
      name: r.student_name || 'Registered Student',
      email: r.student_email || 'student@iiitvadodara.ac.in',
      branch: r.department || 'CSE',
      ticketId: r.ticket_id,
      status: r.status || 'registered',
      registeredOn: r.registered_at
        ? new Date(r.registered_at).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          })
        : 'Recent',
    }))
  },
}

export const userService = {
  async getCurrentStudent() {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      return {
        ...currentUser,
        id: currentUser.id,
        studentId: currentUser.studentId || '',
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        branch: currentUser.branch || '',
        year: currentUser.year || '',
        batch: currentUser.batch || '',
        avatar: currentUser.avatar || '',
        registeredEvents: [],
      }
    }
    try {
      const response = await apiClient.get('/clubs', { params: { category, search, status } })
      if (Array.isArray(response.data)) return response.data.map(normalizeBackendClub)
    } catch (error) { throw error }
    return []
  },

  async getStudentRegisteredEvents(studentId = 'user-std-1') {
    try {
      const myRegs = await registrationService.getMyRegistrations()
      if (Array.isArray(myRegs) && myRegs.length > 0) {
        return myRegs.map((r) => ({
          id: r.event_id,
          name: r.event_name,
          title: r.event_name,
          category: r.event_category || 'General',
          venue: r.event_venue || 'IIIT Vadodara',
          rawDateTime: r.event_date_time,
          ticketId: r.ticket_id,
          status: r.status,
        }))
      }
    } catch {
      // Fallback
    }
    const events = await eventService.getEvents({ includeCompleted: true })
    const user = inMemoryUsers.find((u) => u.id === studentId || u.studentId === studentId)
    if (!user || !user.registeredEvents) return []
    return events.filter((e) => user.registeredEvents.includes(e.id))
  },

  
async getStudents({ search, branch, year, status } = {}) {
  const params = {};

  if (search?.trim()) params.search = search.trim();
  if (branch && branch !== 'All') params.branch = branch;
  if (year && year !== 'All') params.year = year;
  if (status && status !== 'All') params.status = status;

  const res = await apiClient.get('/users/students', { params });

  const students = res.data?.data ?? res.data;

  if (!Array.isArray(students)) {
    throw new Error('Student API returned an invalid response');
  }

  return students;
},


  
async getOrganizers({ search, clubId, status } = {}) {
  const params = {};

  if (search?.trim()) params.search = search.trim();
  if (clubId && clubId !== 'All') params.club_id = clubId;
  if (status && status !== 'All') params.status = status;

  const res = await apiClient.get('/users/organizers', { params });

  const organizers = res.data?.data ?? res.data;

  if (!Array.isArray(organizers)) {
    throw new Error('Organizer API returned an invalid response');
  }

  const allEvents = await eventService.getEvents({
    includeCompleted: true
  });

  return organizers.map((organizer) => {
    const events = allEvents.filter(
      (event) =>
        String(event.owner_id) === String(organizer.id)
    );

    return {
      ...organizer,
      totalEvents: events.length,
      upcomingEvents: events.filter(
        (event) => !event.isHistorical && event.status !== 'Completed'
      ).length,
      completedEvents: events.filter(
        (event) => event.isHistorical || event.status === 'Completed'
      ).length,
      totalRegistrations: events.reduce(
        (sum, event) => sum + (event.registeredCount || 0),
        0
      )
    };
  });
},


  async getUserById(id) {
    try {
      const res = await apiClient.get(`/users/${id}`)
      if (res.data) return { ...res.data, status: res.data.status || 'Active' }
    } catch (e) {
      void e
    }
    const user = inMemoryUsers.find((u) => u.id === id || u.studentId === id) || null
    if (!user) return null
    return { ...user, status: user.status || 'Active' }
  },

  async getStudentRegistrations(studentId) {
    try {
      // Admins look at a specific student; students look at their own list.
      const isAdmin = authService.getCurrentUser()?.role === 'admin'
      const myRegs = isAdmin
        ? (await apiClient.get(`/users/${studentId}/registrations`)).data
        : await registrationService.getMyRegistrations()
      if (Array.isArray(myRegs) && myRegs.length > 0) {
        return myRegs.map((r) => ({
          id: r.id,
          eventId: r.event_id,
          eventTitle: r.event_name,
          date: r.event_date_time
            ? new Date(r.event_date_time).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              })
            : 'Upcoming',
          time: r.event_date_time
            ? new Date(r.event_date_time).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '10:00 AM',
          venue: r.event_venue || 'IIIT Vadodara',
          category: r.event_category || 'General',
          registeredOn: r.registered_at
            ? new Date(r.registered_at).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              })
            : 'Recently',
          status: r.status,
          ticketId: r.ticket_id,
        }))
      }
    } catch {
      // Fallback
    }

    const user = inMemoryUsers.find((u) => u.id === studentId || u.studentId === studentId)
    if (!user) return []
    const events = await eventService.getEvents({ includeCompleted: true })
    const userEventIds = user.registeredEvents || []
    const results = []

    events.forEach((event) => {
      const isRegisteredInEvent = userEventIds.includes(event.id)
      const regList = inMemoryRegistrations[event.id] || []
      const regRecord = regList.find((r) => r.studentId === user.studentId || r.email === user.email)
      if (isRegisteredInEvent || regRecord) {
        results.push({
          id: regRecord?.id || `reg-auto-${event.id}`,
          eventId: event.id,
          eventTitle: event.title || event.name,
          date: event.date,
          time: event.time,
          venue: event.venue,
          category: event.category,
          registeredOn: regRecord?.registeredOn || 'Recently',
          status: regRecord?.status || 'confirmed',
          ticketId: regRecord?.id || `CEH-${String(event.id).replace('evt-', '').toUpperCase()}`,
          event,
        })
      }
    })
    return results
  },

  
async getOrganizerEvents(organizerId) {
  const all = await eventService.getEvents({
    includeCompleted: true,
  })

  const currentUser = authService.getCurrentUser()

  // Organizers can only see their own events.
  if (currentUser?.role === 'organizer' && currentUser.id) {
    return all.filter(
      (event) =>
        String(event.owner_id) === String(currentUser.id)
    )
  }

  // Admins can see all events or filter by a selected organizer.
  if (currentUser?.role === 'admin') {
    if (organizerId) {
      return all.filter(
        (event) =>
          String(event.owner_id) === String(organizerId)
      )
    }

    return all
  }

  return []
},


  async updateUser(userId, updates) {
    const index = inMemoryUsers.findIndex((u) => u.id === userId || u.studentId === userId)
    if (index !== -1) {
      inMemoryUsers[index] = { ...inMemoryUsers[index], ...updates }
      return { success: true, user: inMemoryUsers[index] }
    }
    return { success: false, message: 'User not found.' }
  },

  async updateUserStatus(userId, status) {
    try {
      const res = await apiClient.patch(`/users/${userId}/status`, { status })
      return { success: true, user: res.data }
    } catch (err) {
      if (err.response) {
        return { success: false, message: err.response.data?.detail || 'Could not update user status.' }
      }
      return this.updateUser(userId, { status })
    }
  },
}

/* ==========================================================================
   10. NOTIFICATION & ANNOUNCEMENT SERVICES (FastAPI Backend)
   ========================================================================== */

export const notificationService = {
  async getMyNotifications({ unreadOnly = false, limit = 50 } = {}) {
    const res = await apiClient.get('/notifications/me', {
      params: { unread_only: unreadOnly, limit },
    })
    return Array.isArray(res.data) ? res.data : []
  },

  async getUnreadCount() {
    try {
      const res = await apiClient.get('/notifications/me/unread-count')
      return res.data?.unread_count ?? 0
    } catch {
      return 0
    }
  },

  async markAsRead(notificationId) {
    const res = await apiClient.patch(`/notifications/${notificationId}/read`)
    return res.data
  },

  async markAllAsRead() {
    const res = await apiClient.post('/notifications/me/read-all')
    return res.data
  },

  async deleteNotification(notificationId) {
    await apiClient.delete(`/notifications/${notificationId}`)
    return true
  },

  async triggerReminders() {
    const res = await apiClient.post('/notifications/trigger-reminders')
    return res.data
  },
}

export const announcementService = {
  async getAnnouncements({ category, search } = {}) {
    const params = {}
    if (category && category !== 'All') params.category = category
    if (search && search.trim()) params.search = search.trim()
    const res = await apiClient.get('/announcements', { params })
    const list = res.data?.data ?? res.data
    return Array.isArray(list) ? list : []
  },

  async getAnnouncementById(id) {
    const res = await apiClient.get(`/announcements/${id}`)
    return res.data?.data ?? res.data
  },

  async createAnnouncement(data) {
    const res = await apiClient.post('/announcements', data)
    return res.data?.data ?? res.data
  },

  async updateAnnouncement(id, data) {
    const res = await apiClient.put(`/announcements/${id}`, data)
    return res.data?.data ?? res.data
  },

  async deleteAnnouncement(id) {
    await apiClient.delete(`/announcements/${id}`)
    return true
  },
}

/* ==========================================================================
   11. NAMED EXPORTS FOR DIRECT CONVENIENCE IMPORTS
   ========================================================================== */

export const getEvents = eventService.getEvents.bind(eventService)
export const getEventById = eventService.getEventById.bind(eventService)
export const deleteEvent = eventService.deleteEvent.bind(eventService)
export const getCompletedEvents = eventService.getCompletedEvents.bind(eventService)
export const getEventsByClub = eventService.getEventsByClub.bind(eventService)

export const getClubs = clubService.getClubs.bind(clubService)
export const getClubById = clubService.getClubById.bind(clubService)
export const createClub = clubService.createClub.bind(clubService)
export const updateClub = clubService.updateClub.bind(clubService)
export const updateClubStatus = clubService.updateClubStatus.bind(clubService)

export const getCategories = categoryService.getCategories.bind(categoryService)
export const getCategoryById = categoryService.getCategoryById.bind(categoryService)
export const createCategory = categoryService.createCategory.bind(categoryService)
export const updateCategory = categoryService.updateCategory.bind(categoryService)
export const updateCategoryStatus = categoryService.updateCategoryStatus.bind(categoryService)

export const registerForEvent = registrationService.registerForEvent.bind(registrationService)
export const getMyEventRegistration = registrationService.getMyEventRegistration.bind(registrationService)
export const cancelMyEventRegistration = registrationService.cancelMyEventRegistration.bind(registrationService)
export const getMyRegistrations = registrationService.getMyRegistrations.bind(registrationService)

export const getCurrentStudent = userService.getCurrentStudent.bind(userService)
export const getStudentRegisteredEvents = userService.getStudentRegisteredEvents.bind(userService)
export const getStudents = userService.getStudents.bind(userService)
export const getOrganizers = userService.getOrganizers.bind(userService)
export const getUserById = userService.getUserById.bind(userService)
export const getStudentRegistrations = userService.getStudentRegistrations.bind(userService)
export const getOrganizerEvents = userService.getOrganizerEvents.bind(userService)
export const updateUserStatus = userService.updateUserStatus.bind(userService)

export const getOrganizerPortalEvents = organizerService.getEvents.bind(organizerService)
export const createEvent = organizerService.createEvent.bind(organizerService)
export const updateEvent = organizerService.updateEvent.bind(organizerService)
export const getEventRegistrations = organizerService.getEventRegistrations.bind(organizerService)
export const getOrganizerProfile = organizerService.getOrganizerProfile.bind(organizerService)

export const adminGetEvents = adminService.getEvents.bind(adminService)

export const loginUser = authService.login.bind(authService)
export const registerUser = authService.register.bind(authService)
export const logoutUser = authService.logout.bind(authService)
export const getCurrentUser = authService.getCurrentUser.bind(authService)

export const getMyNotifications = notificationService.getMyNotifications.bind(notificationService)
export const getUnreadNotificationCount = notificationService.getUnreadCount.bind(notificationService)
export const markNotificationAsRead = notificationService.markAsRead.bind(notificationService)
export const markAllNotificationsAsRead = notificationService.markAllAsRead.bind(notificationService)

export const getAnnouncements = announcementService.getAnnouncements.bind(announcementService)
export const createAnnouncement = announcementService.createAnnouncement.bind(announcementService)

export default {
  apiClient,
  authService,
  eventService,
  clubService,
  categoryService,
  registrationService,
  userService,
  organizerService,
  adminService,
  notificationService,
  announcementService,
}