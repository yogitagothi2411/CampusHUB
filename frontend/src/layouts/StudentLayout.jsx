import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import Badge from '../components/common/Badge'
import {
  Sparkles,
  LayoutDashboard,
  CalendarDays,
  Users,
  Grid,
  History,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const navLinks = [
  { name: 'Dashboard',  to: '/student/dashboard',    icon: LayoutDashboard, end: true },
  { name: 'Events',     to: '/student/events',        icon: CalendarDays,    end: false },
  { name: 'Clubs',      to: '/student/clubs',         icon: Users,           end: false },
  { name: 'Categories', to: '/student/categories',    icon: Grid,            end: true },
  { name: 'Past Events',to: '/student/past-events',   icon: History,         end: true },
  { name: 'Profile',    to: '/student/profile',       icon: User,            end: true },
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
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-[#d9d2f0] text-[#3e3568] font-semibold shadow-sm'
                : 'text-[#5a5168] hover:bg-[#d9d2f0]/60 hover:text-[#1e1730]'
            }`
          }
          onClick={onNavigate}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span>{name}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default function StudentLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/')
  }

  return (
    /* Full viewport — sidebar is fixed, only main area scrolls */
    <div className="h-screen flex overflow-hidden bg-[#e8e2f2]">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-full bg-[#ddd6ec] border-r border-[#c8c0d8] overflow-hidden">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-[#c8c0d8] shrink-0">
          <Link to="/student/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d9d2f0] flex items-center justify-center shrink-0 text-[#5a4d88]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1e1730] leading-tight">campusEventHUB</p>
              <p className="text-[10px] text-[#7a7088]">IIIT Vadodara</p>
            </div>
          </Link>
        </div>

        {/* Student identity */}
        <div className="px-5 py-4 border-b border-[#c8c0d8] shrink-0">
          <Link to="/student/profile" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-[#d9d2f0] flex items-center justify-center text-sm font-bold text-[#3e3568] shrink-0 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                alt="Aryan Sharma"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1e1730] truncate group-hover:text-[#5a4d88] transition-colors">
                Aryan Sharma
              </p>
              <Badge variant="lavender" size="sm">
                Student
              </Badge>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col py-4 justify-between overflow-y-auto min-h-0">
          <NavItems />

          {/* Logout */}
          <div className="px-3 pb-3 pt-2 border-t border-[#c8c0d8] shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#5a5168] hover:bg-[#f0c8d4]/70 hover:text-[#5c2d3c] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Overlay & Drawer ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#1e1730]/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#ddd6ec] border-r border-[#c8c0d8] z-50 flex flex-col transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-4 border-b border-[#c8c0d8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#d9d2f0] flex items-center justify-center shrink-0 text-[#5a4d88]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1e1730]">campusEventHUB</p>
              <p className="text-[10px] text-[#7a7088]">Student Portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#cfc8dc] text-[#5a5168]"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-[#c8c0d8] shrink-0">
          <Link
            to="/student/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-[#d9d2f0] flex items-center justify-center text-xs font-bold text-[#3e3568] shrink-0 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                alt="Aryan Sharma"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1e1730] truncate">Aryan Sharma</p>
              <Badge variant="lavender" size="sm">
                Student
              </Badge>
            </div>
          </Link>
        </div>

        <div className="flex-1 flex flex-col py-4 justify-between overflow-y-auto min-h-0">
          <NavItems onNavigate={() => setMobileOpen(false)} />
          <div className="px-3 pb-3 pt-2 border-t border-[#c8c0d8] shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#5a5168] hover:bg-[#f0c8d4]/70 hover:text-[#5c2d3c] transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content Area — scrollable ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile / Tablet Top Header */}
        <header className="lg:hidden shrink-0 z-30 bg-[#ddd6ec] border-b border-[#c8c0d8] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg hover:bg-[#cfc8dc] text-[#1e1730] transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#d9d2f0] flex items-center justify-center text-[#5a4d88]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm text-[#1e1730]">campusEventHUB</span>
            </div>
          </div>
          <Link to="/student/profile">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-[#d9d2f0]">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="shrink-0 border-t border-[#c8c0d8] bg-[#ddd6ec]/70 py-4 px-6 text-center text-xs text-[#7a7088]">
          campusEventHUB • IIIT Vadodara Student Event & Activity Discovery
        </footer>
      </div>
    </div>
  )
}
