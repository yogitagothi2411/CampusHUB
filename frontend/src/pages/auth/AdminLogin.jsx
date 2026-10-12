import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { USERS } from '../../data/users'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { Mail, Lock, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react'

// Mock demo credentials for the admin user
const ADMIN_DEMO_EMAIL = 'admin@iiitvadodara.ac.in'
const ADMIN_DEMO_PASSWORD = 'admin123'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)

    // Simulate brief auth check
    setTimeout(() => {
      const adminUser = USERS.find((u) => u.role === 'admin')
      const emailMatch = email.trim().toLowerCase() === (adminUser?.email || ADMIN_DEMO_EMAIL).toLowerCase()
      const passwordMatch = password === ADMIN_DEMO_PASSWORD

      if (emailMatch && passwordMatch) {
        navigate('/admin/dashboard')
      } else {
        setError(
          `Invalid credentials. Use demo credentials: ${ADMIN_DEMO_EMAIL} / ${ADMIN_DEMO_PASSWORD}`
        )
        setLoading(false)
      }
    }, 300)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md p-8 shadow-sm">
        {/* Back link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b637d] hover:text-[#2b2438] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to selection</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#2b2438]">Admin Login</h1>
            <Badge variant="mauve" icon={ShieldCheck} size="md">
              Admin
            </Badge>
          </div>
          <p className="text-xs text-[#9890a8]">campusEventHUB</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-[#faeaee] border border-[#f0c5cf] text-[#b85b71]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="admin-email"
            label="Admin Email"
            type="email"
            placeholder="admin@iiitvadodara.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            required
            autoComplete="email"
          />

          <Input
            id="admin-password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            required
            autoComplete="current-password"
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Login'}
            </Button>
          </div>
        </form>

        {/* Demo hint */}
        <div className="mt-6 pt-5 border-t border-[#cfc7df]">
          <p className="text-[11px] text-[#9890a8] text-center leading-relaxed">
            Demo credentials:{' '}
            <span className="font-semibold text-[#6b637d]">{ADMIN_DEMO_EMAIL}</span>
            {' / '}
            <span className="font-semibold text-[#6b637d]">{ADMIN_DEMO_PASSWORD}</span>
          </p>
        </div>
      </Card>
    </div>
  )
}
