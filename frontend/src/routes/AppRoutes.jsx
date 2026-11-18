import { Routes, Route, Navigate, Link } from 'react-router-dom'
import LoginSelection from '../pages/auth/LoginSelection'
import StudentLogin from '../pages/auth/StudentLogin'
import OrganizerLogin from '../pages/auth/OrganizerLogin'
import AdminLogin from '../pages/auth/AdminLogin'

// Student
import StudentLayout from '../layouts/StudentLayout'
import Dashboard from '../pages/student/Dashboard'
import Events from '../pages/student/Events'
import EventDetails from '../pages/student/EventDetails'
import Clubs from '../pages/student/Clubs'
import ClubDetails from '../pages/student/ClubDetails'
import Categories from '../pages/student/Categories'
import PastEvents from '../pages/student/PastEvents'
import Profile from '../pages/student/Profile'

// Organizer
import OrganizerLayout from '../layouts/OrganizerLayout'
import OrganizerDashboard from '../pages/organizer/OrganizerDashboard'
import OrganizerEvents from '../pages/organizer/OrganizerEvents'
import CreateEvent from '../pages/organizer/CreateEvent'
import EditEvent from '../pages/organizer/EditEvent'
import ManageEvent from '../pages/organizer/ManageEvent'
import EventRegistrations from '../pages/organizer/EventRegistrations'
import OrganizerProfile from '../pages/organizer/OrganizerProfile'

// Admin
import AdminLayout from '../layouts/AdminLayout'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminEvents from '../pages/admin/AdminEvents'
import AdminStudents from '../pages/admin/AdminStudents'
import AdminStudentDetails from '../pages/admin/AdminStudentDetails'
import AdminOrganizers from '../pages/admin/AdminOrganizers'
import AdminOrganizerDetails from '../pages/admin/AdminOrganizerDetails'
import AdminClubs from '../pages/admin/AdminClubs'
import AdminCategories from '../pages/admin/AdminCategories'
import AdminReports from '../pages/admin/AdminReports'
import AdminProfile from '../pages/admin/AdminProfile'

import Announcements from '../pages/common/Announcements'

import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { Sparkles, ArrowLeft } from 'lucide-react'

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md text-center py-10 px-8 bg-[#f0ebf8] border-[#cfc7df]">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#e8e3f7] flex items-center justify-center text-[#8c7fb4] mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-[#1e1730]">Page Not Found</h1>
        <p className="mt-2 text-sm text-[#5a5168]">
          The page you are looking for does not exist or is under construction.
        </p>
        <div className="mt-6">
          <Link to="/">
            <Button variant="primary" icon={ArrowLeft}>
              Back to Selection
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/" element={<LoginSelection />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/student/login" element={<StudentLogin />} />
      <Route path="/organizer/login" element={<OrganizerLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/auth/student" element={<Navigate to="/student/login" replace />} />
      <Route path="/auth/organizer" element={<Navigate to="/organizer/login" replace />} />
      <Route path="/auth/admin" element={<Navigate to="/admin/login" replace />} />

      {/* Student Portal routes */}
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="home" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:eventId" element={<EventDetails />} />
        <Route path="clubs" element={<Clubs />} />
        <Route path="clubs/:clubId" element={<ClubDetails />} />
        <Route path="categories" element={<Categories />} />
        <Route path="past-events" element={<PastEvents />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Organizer Portal routes */}
      <Route path="/organizer" element={<OrganizerLayout />}>
        <Route index element={<Navigate to="/organizer/dashboard" replace />} />
        <Route path="dashboard" element={<OrganizerDashboard />} />
        <Route path="events" element={<OrganizerEvents />} />
        <Route path="events/create" element={<CreateEvent />} />
        <Route path="events/:eventId/edit" element={<EditEvent />} />
        <Route path="events/:eventId/manage" element={<ManageEvent />} />
        <Route path="events/:eventId/registrations" element={<EventRegistrations />} />
        <Route path="registrations" element={<Navigate to="/organizer/events" replace />} />
        <Route path="profile" element={<OrganizerProfile />} />
      </Route>

      {/* Admin Portal routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="events/create" element={<CreateEvent />} />
        <Route path="events/:eventId" element={<EventDetails />} />
        <Route path="events/:eventId/edit" element={<EditEvent />} />
        <Route path="events/:eventId/manage" element={<ManageEvent />} />
        <Route path="events/:eventId/registrations" element={<EventRegistrations />} />
        <Route path="registrations" element={<Navigate to="/admin/events" replace />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="students/:studentId" element={<AdminStudentDetails />} />
        <Route path="organizers" element={<AdminOrganizers />} />
        <Route path="organizers/:organizerId" element={<AdminOrganizerDetails />} />
        <Route path="clubs" element={<AdminClubs />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
