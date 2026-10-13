import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Badge from '../components/common/Badge'
import { useAuth } from '../context/useAuth'
import {
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  Users,
  LogOut,
  Menu,
  X,
  UserCircle2,
  Megaphone,
} from 'lucide-react'
import NotificationBell from '../components/common/NotificationBell'

const navLinks = [
  { name: 'Dashboard',     to: '/organizer/dashboard',     icon: LayoutDashboard, end: true },
  { name: 'My Events',     to: '/organizer/events',        icon: ListChecks,      end: true },
  { name: 'Create Event',  to: '/organizer/events/create', icon: PlusCircle,      end: true },
  { name: 'Registrations', to: '/organizer/registrations', icon: Users,           end: false },
  { name: 'Announcements', to: '/organizer/announcements', icon: Megaphone,       end: true },
  { name: 'Profile',       to: '/organizer/profile',       icon: UserCircle2,     end: true },
]

function NavItems({ onNavigate }) {
  return (
    <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
      {navLinks.map(({ name, to, icon: Icon, end }) => (
        <NavLink
          key={name}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-[#f0c8d4] text-[#5c2d3c] font-semibold shadow-sm'
                : 'text-[#5a5168] hover:bg-[#f0c8d4]/60 hover:text-[#5c2d3c]'
            }`
          }
          onClick={onNavigate}
        >
          <Icon className="w-4 h-4 shrink-0" />
          {name}
        </NavLink>
      ))}
    </nav>
  )
}

export default function OrganizerLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const displayName = user?.name || 'Organizer'
  const initial = displayName[0]?.toUpperCase() || 'O'

  return (
    /* Full viewport, no page-level scroll — only the main content scrolls */
    <div className="h-screen flex overflow-hidden bg-[#e8e2f2]">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-full bg-[#e2d8e8] border-r border-[#c8bcd2] overflow-hidden">

        {/* Brand */}
        <div className="px-5 py-4 border-b border-[#c8bcd2] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f0c8d4] flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-[#7a2840]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1e1730] leading-tight">campusEventHUB</p>
              <p className="text-[10px] text-[#7a7088]">Organizer Portal</p>
            </div>
          </div>
          <NotificationBell />
        </div>

        {/* Organizer identity */}
        <div className="px-5 py-4 border-b border-[#c8bcd2] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#f5d4c0] flex items-center justify-center text-sm font-bold text-[#5c3520] shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1e1730] truncate">{displayName}</p>
              <Badge variant="blush" size="sm">Event Manager</Badge>
            </div>
          </div>
        </div>

        {/* Nav + Logout */}
        <div className="flex-1 flex flex-col py-4 justify-between overflow-y-auto min-h-0">
          <NavItems />

          <div className="px-3 pb-3 pt-2 border-t border-[#c8bcd2] shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#5a5168] hover:bg-[#f0c8d4]/70 hover:text-[#5c2d3c] transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#1e1730]/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#e2d8e8] border-r border-[#c8bcd2] z-50 flex flex-col transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-4 border-b border-[#c8bcd2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#f0c8d4] flex items-center justify-center shrink-0">
              <CalendarDays className="w-3.5 h-3.5 text-[#7a2840]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1e1730]">campusEventHUB</p>
              <p className="text-[10px] text-[#7a7088]">Organizer Portal</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#d4c8dc] text-[#5a5168]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 flex flex-col py-4 justify-between overflow-y-auto min-h-0">
          <NavItems onNavigate={() => setMobileOpen(false)} />
          <div className="px-3 pb-3 pt-2 border-t border-[#c8bcd2] shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#5a5168] hover:bg-[#f0c8d4]/70 hover:text-[#5c2d3c] transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content — scrollable ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#e2d8e8] border-b border-[#c8bcd2] shrink-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#d4c8dc] text-[#5a5168]"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#7a2840]" />
            <span className="text-sm font-bold text-[#1e1730]">campusEventHUB</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Badge variant="blush" size="sm">Organizer</Badge>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
