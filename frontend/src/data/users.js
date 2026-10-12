/**
 * Centralized mock user directory for campusEventHUB
 * Covers students, organizers, and admins for authentication and session simulation.
 */

export const USERS = [
  // Students
  {
    id: 'user-std-1',
    name: 'Riya Jain',
    email: '202351001@iiitvadodara.ac.in',
    role: 'student',
    studentId: '202351001',
    batch: '2023-2027',
    branch: 'Computer Science and Engineering',
    year: '3rd Year',
    status: 'Active',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    registeredEvents: ['evt-kreiva-2026', 'evt-hackiiitv-2026', 'evt-tesseract-2026'],
  },
  {
    id: 'user-std-2',
    name: 'Priya Patel',
    email: '202452015@iiitvadodara.ac.in',
    role: 'student',
    studentId: '202452015',
    batch: '2024-2028',
    branch: 'Information Technology',
    year: '2nd Year',
    status: 'Active',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    registeredEvents: ['evt-cerebro-2026', 'evt-design-sprint-2026'],
  },
  {
    id: 'user-std-3',
    name: 'Rohan Verma',
    email: '202351089@iiitvadodara.ac.in',
    role: 'student',
    studentId: '202351089',
    batch: '2023-2027',
    branch: 'Computer Science and Engineering',
    year: '3rd Year',
    status: 'Active',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    registeredEvents: ['evt-olympus-2026', 'evt-ideathon-2026'],
  },

  // Organizers
  {
    id: 'user-org-1',
    name: 'Arjun Mehta',
    email: 'organizer@college.edu', // Default organizer demo login
    alternateEmail: 'techlead@iiitvadodara.ac.in',
    role: 'organizer',
    title: 'Lead Coordinator',
    clubId: 'club-coding',
    clubName: 'Coding Club',
    committee: 'Technical Committee',
    status: 'Active',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    managedEvents: [
      'evt-hackiiitv-2026',
      'evt-cerebro-2026',
      'evt-tesseract-2026',
      'evt-cerebro-2025',
    ],
  },
  {
    id: 'user-org-2',
    name: 'Aarav Patel',
    email: 'cultural.lead@iiitvadodara.ac.in',
    role: 'organizer',
    title: 'Cultural Secretary',
    clubId: 'comm-cultural',
    clubName: 'Cultural Committee',
    committee: 'Cultural Committee',
    status: 'Active',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    managedEvents: ['evt-kreiva-2026', 'evt-alfaaz-2026', 'evt-kreiva-2025'],
  },
  {
    id: 'user-org-3',
    name: 'Karthik Nair',
    email: 'sports.lead@iiitvadodara.ac.in',
    role: 'organizer',
    title: 'Sports Secretary',
    clubId: 'comm-sports',
    clubName: 'Sports Committee',
    committee: 'Sports Committee',
    status: 'Active',
    avatar:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    managedEvents: ['evt-olympus-2026', 'evt-olympus-2025'],
  },

  // Admins
  {
    id: 'user-adm-1',
    name: 'Campus Administrator',
    email: 'admin@iiitvadodara.ac.in',
    role: 'admin',
    title: 'Dean of Student Affairs Office',
    status: 'Active',
    avatar:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
  },
]
