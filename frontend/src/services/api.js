import { EVENTS } from '../data/events'
import { CLUBS } from '../data/clubs'
import { USERS } from '../data/users'
import { MOCK_REGISTRATIONS } from '../data/registrations'
import { CATEGORIES_CONFIG } from '../data/categories'

/**
 * In-memory state store for frontend-only development.
 * Changes (create/update event, student registration, club/category management)
 * persist across navigation during the active browser session.
 */
let inMemoryEvents = [...EVENTS]
let inMemoryClubs = CLUBS.map((c) => ({ ...c, status: c.status || 'Active' }))
let inMemoryCategories = CATEGORIES_CONFIG.map((c) => ({ ...c, status: c.status || 'Active' }))
let inMemoryUsers = [...USERS]
let inMemoryRegistrations = { ...MOCK_REGISTRATIONS }

/* ==========================================================================
   1. STUDENT / EVENT DISCOVERY SERVICES
   ========================================================================== */

export const eventService = {
  /**
   * Fetch events with optional category, period, club, status, or search query.
   * Query params:
   *   - category: string
   *   - period: 'all' | 'current' | 'this_week' | 'this_month' | 'past' | 'completed'
   *   - clubId: string
   *   - status: 'All' | 'Upcoming' | 'This Week' | 'This Month' | 'Completed'
   *   - search: string
   */
  async getEvents({ category, period, clubId, status, search, includeCompleted = false } = {}) {
    let filtered = inMemoryEvents.filter((event) => {
      const isPastOrCompleted = event.timing === 'completed' || event.isHistorical || event.status === 'Completed'

      // Period filter
      if (period === 'past' || period === 'completed') {
        if (!isPastOrCompleted) return false
      } else if (period === 'upcoming') {
        if (isPastOrCompleted) return false
      } else if (period && period !== 'all') {
        if (isPastOrCompleted) return false
        if (event.timing !== period) return false
      } else if (!period || period === 'all') {
        // By default, general upcoming list excludes completed/historical unless specifically requested
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
   * Fetch single event details by ID.
   */
  async getEventById(id) {
    const found = inMemoryEvents.find((e) => e.id === id) || null
    return found
  },

  /**
   * Delete an event by ID (Admin safe mock mutation).
   */
  async deleteEvent(eventId) {
    const index = inMemoryEvents.findIndex((e) => e.id === eventId)
    if (index !== -1) {
      const deleted = inMemoryEvents[index]
      inMemoryEvents.splice(index, 1)
      delete inMemoryRegistrations[eventId]
      inMemoryUsers.forEach((u) => {
        if (u.registeredEvents) {
          u.registeredEvents = u.registeredEvents.filter((id) => id !== eventId)
        }
      })
      return { success: true, message: `Event "${deleted.title || deleted.name}" deleted successfully.` }
    }
    return { success: false, message: 'Event not found.' }
  },

  /**
   * Fetch completed & historical events with achievements and photos.
   */
  async getCompletedEvents() {
    return inMemoryEvents.filter((e) => e.timing === 'completed' || e.isHistorical || e.status === 'Completed')
  },

  /**
   * Fetch events organized by or affiliated with a specific club.
   */
  async getEventsByClub(clubId) {
    return inMemoryEvents.filter((e) => e.clubId === clubId)
  },
}

/* ==========================================================================
   2. CLUB & CATEGORY SERVICES
   ========================================================================== */

export const clubService = {
  /**
   * Fetch all clubs & committees with optional filters.
   */
  async getClubs({ category, search, status } = {}) {
    let list = inMemoryClubs

    if (category && category !== 'All') {
      list = list.filter(
        (c) =>
          (c.category || '').toLowerCase() === category.toLowerCase() ||
          (c.committee || '').toLowerCase() === category.toLowerCase()
      )
    }

    if (status && status !== 'All') {
      list = list.filter((c) => (c.status || 'Active').toLowerCase() === status.toLowerCase())
    }

    if (search && search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.shortName || '').toLowerCase().includes(q) ||
          (c.lead || '').toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q) ||
          (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)))
      )
    }

    return list
  },

  /**
   * Fetch a single club by ID.
   */
  async getClubById(clubId) {
    return inMemoryClubs.find((c) => c.id === clubId) || null
  },

  /**
   * Create a new club (Admin mock mutation).
   */
  async createClub(clubData) {
    const slug = (clubData.shortName || clubData.name || 'club')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
    const id = clubData.id || `club-${slug}-${Date.now().toString().slice(-4)}`

    const tags = Array.isArray(clubData.tags)
      ? clubData.tags
      : typeof clubData.tags === 'string' && clubData.tags.trim()
      ? clubData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : ['Student Activity']

    const newClub = {
      id,
      name: clubData.name || 'New Club',
      shortName: clubData.shortName || clubData.name || 'Club',
      category: clubData.category || 'Technical',
      committee: clubData.committee || 'Technical Committee',
      description: clubData.description || '',
      lead: clubData.lead || 'Student Representative',
      email: clubData.email || `${slug}@iiitvadodara.ac.in`,
      membersCount: Number(clubData.membersCount) || 1,
      tags,
      image:
        clubData.image ||
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
      coverImage:
        clubData.coverImage ||
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
      status: clubData.status || 'Active',
    }

    inMemoryClubs = [newClub, ...inMemoryClubs]
    return newClub
  },

  /**
   * Update an existing club.
   */
  async updateClub(clubId, clubData) {
    const index = inMemoryClubs.findIndex((c) => c.id === clubId)
    if (index !== -1) {
      const tags = Array.isArray(clubData.tags)
        ? clubData.tags
        : typeof clubData.tags === 'string'
        ? clubData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : inMemoryClubs[index].tags

      inMemoryClubs[index] = {
        ...inMemoryClubs[index],
        ...clubData,
        tags,
      }
      return inMemoryClubs[index]
    }
    return null
  },

  /**
   * Update club status (Active / Inactive).
   */
  async updateClubStatus(clubId, status) {
    const index = inMemoryClubs.findIndex((c) => c.id === clubId)
    if (index !== -1) {
      inMemoryClubs[index] = {
        ...inMemoryClubs[index],
        status,
      }
      return inMemoryClubs[index]
    }
    return null
  },
}

export const categoryService = {
  /**
   * Fetch all event categories with optional filters.
   */
  async getCategories({ search, status } = {}) {
    let list = inMemoryCategories

    if (status && status !== 'All') {
      list = list.filter((c) => (c.status || 'Active').toLowerCase() === status.toLowerCase())
    }

    if (search && search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
      )
    }

    return list
  },

  /**
   * Fetch single category by ID.
   */
  async getCategoryById(id) {
    return inMemoryCategories.find((c) => c.id === id) || null
  },

  /**
   * Create a new category.
   */
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

    inMemoryCategories = [...inMemoryCategories, newCategory]
    return newCategory
  },

  /**
   * Update category details.
   */
  async updateCategory(id, catData) {
    const index = inMemoryCategories.findIndex((c) => c.id === id)
    if (index !== -1) {
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

      inMemoryCategories[index] = {
        ...inMemoryCategories[index],
        ...catData,
        ...themeTokens,
      }
      return inMemoryCategories[index]
    }
    return null
  },

  /**
   * Update category status (Active / Inactive).
   */
  async updateCategoryStatus(id, status) {
    const index = inMemoryCategories.findIndex((c) => c.id === id)
    if (index !== -1) {
      inMemoryCategories[index] = {
        ...inMemoryCategories[index],
        status,
      }
      return inMemoryCategories[index]
    }
    return null
  },
}

/* ==========================================================================
   3. REGISTRATION & USER SERVICES
   ========================================================================== */

export const registrationService = {
  /**
   * Register a student for an event.
   * Body: { fullName, email, studentId, department, year }
   */
  async registerForEvent(eventId, registrationData) {
    const randomRef = `CEH-${Math.floor(1000 + Math.random() * 9000)}`
    const studentId = registrationData.studentId || '202351001'

    // Prevent duplicate registration if already registered
    const existingList = inMemoryRegistrations[eventId] || []
    const alreadyRegistered = existingList.some(
      (r) => r.studentId === studentId || r.email === registrationData.email
    )

    if (alreadyRegistered) {
      return {
        success: false,
        message: 'You are already registered for this event.',
        alreadyRegistered: true,
      }
    }

    // Increment registeredCount on the event
    const eventIndex = inMemoryEvents.findIndex((e) => e.id === eventId)
    if (eventIndex !== -1) {
      inMemoryEvents[eventIndex] = {
        ...inMemoryEvents[eventIndex],
        registeredCount: (inMemoryEvents[eventIndex].registeredCount || 0) + 1,
      }
    }

    // Append to registrations list
    if (!inMemoryRegistrations[eventId]) {
      inMemoryRegistrations[eventId] = []
    }

    const newReg = {
      id: `reg-${Date.now()}`,
      studentId,
      name: registrationData.fullName || registrationData.name || 'Registered Student',
      email: registrationData.email || 'student@iiitvadodara.ac.in',
      branch: registrationData.department || 'CSE',
      year: registrationData.year || '3rd Year',
      registeredOn: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      status: 'confirmed',
    }

    inMemoryRegistrations[eventId] = [newReg, ...inMemoryRegistrations[eventId]]

    // Update current student user's registeredEvents list
    const studentUser = inMemoryUsers.find((u) => u.id === 'user-std-1')
    if (studentUser && !studentUser.registeredEvents.includes(eventId)) {
      studentUser.registeredEvents = [...studentUser.registeredEvents, eventId]
    }

    return {
      success: true,
      message: 'Student registration recorded successfully.',
      ticketId: randomRef,
      registeredAt: new Date().toISOString(),
      participant: registrationData,
      eventId,
    }
  },
}

export const userService = {
  /**
   * Fetch current active student profile (Aryan Sharma by default).
   */
  async getCurrentStudent() {
    const student = inMemoryUsers.find((u) => u.role === 'student') || inMemoryUsers[0]
    return student
  },

  /**
   * Fetch registered events for a student by their ID.
   */
  async getStudentRegisteredEvents(studentId = 'user-std-1') {
    const user = inMemoryUsers.find((u) => u.id === studentId || u.studentId === studentId)
    if (!user || !user.registeredEvents) return []
    return inMemoryEvents.filter((e) => user.registeredEvents.includes(e.id))
  },

  /**
   * Fetch all students with optional search, branch, year, status filters.
   */
  async getStudents({ search, branch, year, status } = {}) {
    let list = inMemoryUsers.filter((u) => u.role === 'student')

    if (search && search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.studentId && s.studentId.toLowerCase().includes(q)) ||
          (s.branch && s.branch.toLowerCase().includes(q))
      )
    }

    if (branch && branch !== 'All') {
      list = list.filter((s) => s.branch.toLowerCase() === branch.toLowerCase())
    }

    if (year && year !== 'All') {
      list = list.filter((s) => s.year.toLowerCase() === year.toLowerCase())
    }

    if (status && status !== 'All') {
      list = list.filter((s) => (s.status || 'Active').toLowerCase() === status.toLowerCase())
    }

    // Attach computed registration count & ensure status
    return list.map((s) => ({
      ...s,
      status: s.status || 'Active',
      registeredCount: s.registeredEvents ? s.registeredEvents.length : 0,
    }))
  },

  /**
   * Fetch all organizers with optional search, clubId, status filters.
   */
  async getOrganizers({ search, clubId, status } = {}) {
    let list = inMemoryUsers.filter((u) => u.role === 'organizer')

    if (search && search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          (o.clubName && o.clubName.toLowerCase().includes(q)) ||
          (o.committee && o.committee.toLowerCase().includes(q)) ||
          (o.title && o.title.toLowerCase().includes(q))
      )
    }

    if (clubId && clubId !== 'All') {
      list = list.filter((o) => o.clubId === clubId)
    }

    if (status && status !== 'All') {
      list = list.filter((o) => (o.status || 'Active').toLowerCase() === status.toLowerCase())
    }

    // Calculate event statistics dynamically for each organizer
    return list.map((o) => {
      const events = inMemoryEvents.filter(
        (e) =>
          e.organizerId === o.id ||
          e.clubId === o.clubId ||
          (o.managedEvents && o.managedEvents.includes(e.id))
      )
      const upcoming = events.filter(
        (e) => !e.isHistorical && e.timing !== 'completed' && e.status !== 'Completed'
      ).length
      const completed = events.filter(
        (e) => e.isHistorical || e.timing === 'completed' || e.status === 'Completed'
      ).length
      const totalRegistrations = events.reduce((sum, e) => sum + (e.registeredCount || 0), 0)

      return {
        ...o,
        status: o.status || 'Active',
        totalEvents: events.length,
        upcomingEvents: upcoming,
        completedEvents: completed,
        totalRegistrations,
      }
    })
  },

  /**
   * Fetch a single user by ID (student, organizer, or admin).
   */
  async getUserById(id) {
    const user = inMemoryUsers.find((u) => u.id === id || u.studentId === id) || null
    if (!user) return null
    return {
      ...user,
      status: user.status || 'Active',
    }
  },

  /**
   * Fetch detailed registrations list for a student by ID.
   */
  async getStudentRegistrations(studentId) {
    const user = inMemoryUsers.find((u) => u.id === studentId || u.studentId === studentId)
    if (!user) return []

    const userEventIds = user.registeredEvents || []
    const results = []

    inMemoryEvents.forEach((event) => {
      const isRegisteredInEvent = userEventIds.includes(event.id)
      const regList = inMemoryRegistrations[event.id] || []
      const regRecord = regList.find(
        (r) => r.studentId === user.studentId || r.email === user.email
      )

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
          ticketId: regRecord?.id || `CEH-${event.id.replace('evt-', '').toUpperCase()}`,
          event,
        })
      }
    })

    return results
  },

  /**
   * Fetch all events managed by an organizer.
   * Defaults to the currently logged-in organizer ('user-org-1') when no ID is supplied.
   * Falls back to all events (consistent with getOrganizerProfile) when the organizer
   * has no organizerId/clubId scoped events in the mock data.
   */
  async getOrganizerEvents(organizerId) {
    // Default to the current organizer session when called without an explicit ID
    const resolvedId = organizerId || 'user-org-1'
    const user = inMemoryUsers.find((u) => u.id === resolvedId)
    if (!user) return []

    // Try to find events specifically linked to this organizer
    const scoped = inMemoryEvents.filter(
      (e) =>
        e.organizerId === user.id ||
        e.clubId === user.clubId ||
        (user.managedEvents && user.managedEvents.includes(e.id))
    )

    // If no scoped events found (mock data has no organizerId/clubId on events),
    // fall back to all events — consistent with getOrganizerProfile behaviour.
    return scoped.length > 0 ? scoped : inMemoryEvents
  },

  /**
   * Update user fields (e.g. status).
   */
  async updateUser(userId, updates) {
    const index = inMemoryUsers.findIndex((u) => u.id === userId || u.studentId === userId)
    if (index !== -1) {
      inMemoryUsers[index] = {
        ...inMemoryUsers[index],
        ...updates,
      }
      return { success: true, user: inMemoryUsers[index] }
    }
    return { success: false, message: 'User not found.' }
  },

  /**
   * Toggle or update user active status.
   */
  async updateUserStatus(userId, status) {
    return this.updateUser(userId, { status })
  },
}

/* ==========================================================================
   4. ORGANIZER SERVICES
   ========================================================================== */

export const organizerService = {
  /**
   * Fetch events created/managed by organizers.
   */
  async getEvents() {
    return inMemoryEvents
  },

  /**
   * Create a new event.
   */
  async createEvent(eventData) {
    const newId = `evt-${Date.now()}`
    const title = eventData.title || eventData.name || 'Untitled Event'
    const newEvent = {
      id: newId,
      name: title,
      title: title,
      category: eventData.category || 'Technical',
      date: eventData.date || 'TBA',
      time: eventData.time || 'TBA',
      venue: eventData.venue || 'TBA',
      status: 'Upcoming',
      timing: 'current',
      image:
        eventData.image ||
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
      organizer: eventData.organizer || 'Coding Club',
      organizerId: 'user-org-1',
      clubId: eventData.clubId || 'club-coding',
      registrationLimit: Number(eventData.registrationLimit) || 100,
      registeredCount: 0,
      description: eventData.description || '',
      isHistorical: false,
      winner: null,
      runnerUp: null,
      achievement: null,
      photos: [],
      tags: [eventData.category || 'General'],
    }

    inMemoryEvents = [newEvent, ...inMemoryEvents]
    return newEvent
  },

  /**
   * Update an existing event.
   */
  async updateEvent(eventId, eventData) {
    const index = inMemoryEvents.findIndex((e) => e.id === eventId)
    if (index !== -1) {
      const title = eventData.title || eventData.name || inMemoryEvents[index].title
      inMemoryEvents[index] = {
        ...inMemoryEvents[index],
        ...eventData,
        name: title,
        title: title,
      }
      return inMemoryEvents[index]
    }
    return { id: eventId, ...eventData }
  },

  /**
   * Fetch registered students list for a specific event.
   */
  async getEventRegistrations(eventId) {
    return inMemoryRegistrations[eventId] || []
  },

  /**
   * Fetch the current organizer's profile and computed stats.
   */
  async getOrganizerProfile() {
    const organizer = inMemoryUsers.find((u) => u.role === 'organizer' && u.id === 'user-org-1') || null
    if (!organizer) return null

    const allOrgEvents = inMemoryEvents
    const upcoming = allOrgEvents.filter(
      (e) => e.timing === 'current' || e.timing === 'this_week' || e.timing === 'this_month'
    ).length
    const completed = allOrgEvents.filter(
      (e) => e.timing === 'completed' || e.isHistorical || e.status === 'Completed'
    ).length
    const totalRegistrations = allOrgEvents.reduce((acc, e) => acc + (e.registeredCount || 0), 0)

    return {
      ...organizer,
      stats: {
        totalEvents: allOrgEvents.length,
        upcoming,
        completed,
        totalRegistrations,
      },
    }
  },
}

/* ==========================================================================
   5. ADMIN SERVICES
   ========================================================================== */

export const adminService = {
  /**
   * Fetch all events with optional filters (includes completed/historical events by default for admin overview).
   */
  async getEvents(filters = {}) {
    return eventService.getEvents({ ...filters, includeCompleted: true })
  },

  /**
   * Fetch single event details.
   */
  async getEventById(id) {
    return eventService.getEventById(id)
  },

  /**
   * Create an event as admin.
   */
  async createEvent(eventData) {
    return organizerService.createEvent(eventData)
  },

  /**
   * Update an existing event as admin.
   */
  async updateEvent(eventId, eventData) {
    return organizerService.updateEvent(eventId, eventData)
  },

  /**
   * Delete an event and clean up associated registrations.
   */
  async deleteEvent(eventId) {
    return eventService.deleteEvent(eventId)
  },

  /**
   * Fetch student registrations for an event.
   */
  async getEventRegistrations(eventId) {
    return organizerService.getEventRegistrations(eventId)
  },

  /**
   * Student management operations.
   */
  async getStudents(filters) {
    return userService.getStudents(filters)
  },
  async getStudentRegistrations(studentId) {
    return userService.getStudentRegistrations(studentId)
  },

  /**
   * Organizer management operations.
   */
  async getOrganizers(filters) {
    return userService.getOrganizers(filters)
  },
  async getOrganizerEvents(organizerId) {
    return userService.getOrganizerEvents(organizerId)
  },

  /**
   * User generic operations.
   */
  async getUserById(id) {
    return userService.getUserById(id)
  },
  async updateUserStatus(userId, status) {
    return userService.updateUserStatus(userId, status)
  },

  /**
   * Club management operations.
   */
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

  /**
   * Category management operations.
   */
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

// Named function exports for direct convenience imports
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

export default {
  eventService,
  clubService,
  categoryService,
  registrationService,
  userService,
  organizerService,
  adminService,
}


