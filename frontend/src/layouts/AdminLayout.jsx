import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { USERS } from '../data/users'
import Badge from '../components/common/Badge'
import { useAuth } from '../context/useAuth'
import {
  CalendarDays,
  LayoutDashboard,
  Calendar,
  GraduationCap,
  Users,
  Building2,
  Tag,
  BarChart3,
  UserCircle2,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Megaphone,
} from 'lucide-react'
import NotificationBell from '../components/common/NotificationBell'

const navLinks = [
  { name: 'Dashboard',     to: '/admin/dashboard',     icon: LayoutDashboard, end: true },
  { name: 'Events',        to: '/admin/events',        icon: Calendar,        end: true },
  { name: 'Announcements', to: '/admin/announcements', icon: Megaphone,       end: true },
  { name: 'Students',      to: '/admin/students',      icon: GraduationCap,   end: true },
  { name: 'Organizers',    to: '/admin/organizers',    icon: Users,           end: true },
  { name: 'Clubs',         to: '/admin/clubs',         icon: Building2,       end: true },
  { name: 'Categories',    to: '/admin/categories',    icon: Tag,             end: true },
  { name: 'Reports',       to: '/admin/reports',       icon: BarChart3,       end: true },
  { name: 'Profile',       to: '/admin/profile',       icon: UserCircle2,     end: true },
]

const adminUser = USERS.find((u) => u.role === 'admin')

function NavItems({ onNavigate }) {
  return (
    <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
      {navLinks.map(({ name, to, icon: Icon, end }) => (
        <NavLink
          key={name}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-[#c8bdd6] text-[#1e1730] font-semibold shadow-sm'
                : 'text-[#5a5168] hover:bg-[#d4cade] hover:text-[#1e1730]'
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

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const displayName = user?.name || adminUser?.name || 'Administrator'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'A'

  return (
    /* Outer shell: full viewport height, no overflow — only inner panels scroll */
    <div className="h-screen flex overflow-hidden bg-[#e8e2f2]">

      {/* ── Desktop Sidebar — fixed height, independent scroll ── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-full bg-[#ddd7ea] border-r border-[#c4bacf] overflow-hidden">

        {/* Brand */}
        <div className="px-5 py-4 border-b border-[#c4bacf] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c8bdd6] flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-[#3a2d4b]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1e1730] leading-tight">campusEventHUB</p>
              <p className="text-[10px] text-[#7a7088]">Admin Console</p>
            </div>
          </div>
          <NotificationBell />
        </div>

        {/* Admin identity */}
        <div className="px-5 py-4 border-b border-[#c4bacf] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#c8bdd6] flex items-center justify-center text-sm font-bold text-[#3a2d4b] shrink-0">
              {adminUser?.avatar ? (
                <img
                  src={adminUser.avatar}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1e1730] truncate">
                {displayName}
              </p>
              <Badge variant="mauve" size="sm" icon={ShieldCheck}>
                Admin
              </Badge>
            </div>
          </div>
        </div>

        {/* Nav links — scrolls independently if items overflow */}
        <div className="flex-1 flex flex-col py-4 justify-between overflow-y-auto min-h-0">
          <NavItems />

          <div className="px-3 pb-3 pt-2 border-t border-[#c4bacf] shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#5a5168] hover:bg-[#f0c8d4]/60 hover:text-[#5c2d3c] transition-colors"
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
        className={`fixed top-0 left-0 h-full w-64 bg-[#ddd7ea] border-r border-[#c4bacf] z-50 flex flex-col transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="px-5 py-4 border-b border-[#c4bacf] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#c8bdd6] flex items-center justify-center shrink-0">
              <CalendarDays className="w-3.5 h-3.5 text-[#3a2d4b]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1e1730]">campusEventHUB</p>
              <p className="text-[10px] text-[#7a7088]">Admin Console</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#cfc7df] text-[#5a5168]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer admin identity */}
        <div className="px-5 py-3.5 border-b border-[#c4bacf] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#c8bdd6] flex items-center justify-center text-sm font-bold text-[#3a2d4b] shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1e1730] truncate">
                {adminUser?.name || 'Administrator'}
              </p>
              <Badge variant="mauve" size="sm">Admin</Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col py-4 justify-between overflow-y-auto min-h-0">
          <NavItems onNavigate={() => setMobileOpen(false)} />
          <div className="px-3 pb-3 pt-2 border-t border-[#c4bacf] shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#5a5168] hover:bg-[#f0c8d4]/60 hover:text-[#5c2d3c] transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content — this div scrolls, sidebar does not ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#ddd7ea] border-b border-[#c4bacf] shrink-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#cfc7df] text-[#5a5168]"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#3a2d4b]" />
            <span className="text-sm font-bold text-[#1e1730]">campusEventHUB</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Badge variant="mauve" size="sm">Admin</Badge>
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
