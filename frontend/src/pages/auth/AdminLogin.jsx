import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { Mail, Lock, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/useAuth'

const ADMIN_DEMO_EMAIL = 'admin@iiitvadodara.ac.in'
const ADMIN_DEMO_PASSWORD = 'admin123'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login, logout } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)

    try {
      const loggedUser = await login(email, password)
      if (loggedUser.role !== 'admin') {
        logout()
        setError('Access denied. This account does not have administrator privileges.')
        return
      }
      navigate('/admin/dashboard')
    } catch (err) {
      const serverMsg =
        err.response?.data?.detail ||
        (Array.isArray(err.response?.data?.detail)
          ? err.response.data.detail[0]?.msg
          : null) ||
        err.message ||
        'Failed to sign in. Please verify your admin credentials.'
      setError(serverMsg)
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail(ADMIN_DEMO_EMAIL)
    setPassword(ADMIN_DEMO_PASSWORD)
    setError('')
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
          <p className="text-xs text-[#9890a8]">campusEventHUB • IIIT Vadodara</p>
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
            placeholder={ADMIN_DEMO_EMAIL}
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
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="font-semibold text-[#6b637d] hover:text-[#2b2438] underline transition-colors cursor-pointer"
            >
              {ADMIN_DEMO_EMAIL} / {ADMIN_DEMO_PASSWORD}
            </button>
          </p>
        </div>
      </Card>
    </div>
  )
}
