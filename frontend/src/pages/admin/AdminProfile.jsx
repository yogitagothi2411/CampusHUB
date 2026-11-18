import { USERS } from '../../data/users'
import Badge from '../../components/common/Badge'
import { UserCircle2, Mail, ShieldCheck } from 'lucide-react'

const adminUser = USERS.find((u) => u.role === 'admin')

export default function AdminProfile() {
  const initials = adminUser?.name
    ? adminUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'A'

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Page heading */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#d5ccdf] flex items-center justify-center shrink-0">
          <UserCircle2 className="w-5 h-5 text-[#443851]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1e1730]">Admin Profile</h1>
          <p className="text-xs text-[#5a5168] mt-0.5">Your administrator account</p>
        </div>
      </div>

      {/* Identity card */}
      <div className="bg-[#dcd6ea] border border-[#c4bacf] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-[#d5ccdf] flex items-center justify-center shrink-0">
          {adminUser?.avatar ? (
            <img
              src={adminUser.avatar}
              alt={adminUser?.name || 'Admin'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          ) : (
            <span className="text-2xl font-bold text-[#443851]">{initials}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h2 className="text-lg font-bold text-[#1e1730]">
              {adminUser?.name || 'Campus Administrator'}
            </h2>
            <Badge variant="mauve" icon={ShieldCheck}>Admin</Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-[#5a5168]">
              <Mail className="w-3.5 h-3.5 text-[#7a7088] shrink-0" />
              <span className="truncate">{adminUser?.email || 'admin@iiitvadodara.ac.in'}</span>
            </div>
            {adminUser?.title && (
              <div className="flex items-center gap-2 text-xs text-[#7a7088]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{adminUser.title}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="bg-[#dcd6ea] border border-[#c4bacf] rounded-2xl p-6 space-y-4">
        <h3 className="text-xs uppercase font-bold tracking-wider text-[#7a7088]">Account Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088] mb-1">Name</p>
            <p className="text-[#1e1730] font-medium">{adminUser?.name || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088] mb-1">Email</p>
            <p className="text-[#1e1730] font-medium truncate">{adminUser?.email || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088] mb-1">Role</p>
            <p className="text-[#1e1730] font-medium capitalize">{adminUser?.role || 'admin'}</p>
          </div>
          {adminUser?.title && (
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088] mb-1">Title</p>
              <p className="text-[#1e1730] font-medium">{adminUser.title}</p>
            </div>
          )}
        </div>
      </div>

      {/* Phase note */}
      <div className="bg-[#dcd6ea] border border-[#c4bacf] rounded-2xl p-5 text-center">
        <p className="text-xs text-[#7a7088] font-semibold">
          Profile editing will be implemented in a later phase.
        </p>
      </div>
    </div>
  )
}
