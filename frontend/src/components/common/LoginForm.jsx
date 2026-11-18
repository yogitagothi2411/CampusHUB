import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from './Card'
import Input from './Input'
import Button from './Button'
import Badge from './Badge'
import { Mail, Lock, User, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/useAuth'

/**
 * Reusable Authentication Form for Student and Organizer portals.
 * Connects directly to FastAPI backend (/auth/login and /auth/register).
 */
export default function LoginForm({
  role = 'student',
  title,
  portalBadge,
  badgeVariant = 'lavender',
  icon: RoleIcon,
  buttonVariant = 'primary',
  onSubmit,
}) {
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const defaultDemoEmail = role === 'organizer' ? 'organizer@iiitvadodara.ac.in' : 'student@iiitvadodara.ac.in'
  const defaultDemoPassword = role === 'organizer' ? 'organizer123' : 'student123'
  const targetDashboard = role === 'organizer' ? '/organizer/dashboard' : '/student/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (mode === 'register' && !name.trim()) {
      setError('Please provide your full name.')
      return
    }

    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.')
      return
    }

    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)

    try {
      if (onSubmit) {
        await onSubmit({ email, password, name, mode, role })
      } else if (mode === 'register') {
        await register({ name, email, password, role })
        setSuccessMsg('Account created successfully! Redirecting...')
        setTimeout(() => {
          navigate(targetDashboard)
        }, 500)
      } else {
        await login(email, password)
        navigate(targetDashboard)
      }
    } catch (err) {
      const serverMsg =
        err.response?.data?.detail ||
        (Array.isArray(err.response?.data?.detail)
          ? err.response.data.detail[0]?.msg
          : null) ||
        err.message ||
        (mode === 'register' ? 'Registration failed.' : 'Login failed.')
      setError(serverMsg)
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail(defaultDemoEmail)
    setPassword(defaultDemoPassword)
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md p-8 shadow-sm">
        {/* Back navigation */}
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
            <h1 className="text-2xl font-bold tracking-tight text-[#2b2438]">
              {mode === 'login' ? title : `Register as ${portalBadge || 'User'}`}
            </h1>
            {portalBadge && (
              <Badge variant={badgeVariant} icon={RoleIcon} size="md">
                {portalBadge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#9890a8]">
            campusEventHUB • IIIT Vadodara
          </p>
        </div>

        {/* Mode Toggle (Sign In / Register) */}
        <div className="flex rounded-xl bg-[#e8e2f2] p-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError('')
              setSuccessMsg('')
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-[#1e1730] shadow-sm'
                : 'text-[#6b637d] hover:text-[#1e1730]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setError('')
              setSuccessMsg('')
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-[#1e1730] shadow-sm'
                : 'text-[#6b637d] hover:text-[#1e1730]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-[#faeaee] border border-[#f0c5cf] text-[#b85b71]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-[#e8f8f0] border border-[#c4e8d3] text-[#227447]">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">{successMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === 'register' && (
            <Input
              id={`${role}-name`}
              label="Full Name"
              type="text"
              placeholder={role === 'organizer' ? 'Coding Club Lead' : 'Aryan Sharma'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={User}
              required
              autoComplete="name"
            />
          )}

          <Input
            id={`${role}-email`}
            label="College Email"
            type="email"
            placeholder={defaultDemoEmail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            required
            autoComplete="email"
          />

          <Input
            id={`${role}-password`}
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            required
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant={buttonVariant}
              size="lg"
              className="w-full justify-center"
              disabled={loading}
            >
              {loading
                ? mode === 'register'
                  ? 'Creating Account…'
                  : 'Signing In…'
                : mode === 'register'
                ? 'Register & Continue'
                : 'Login'}
            </Button>
          </div>
        </form>

        {/* Demo Credentials Helper */}
        {mode === 'login' && (
          <div className="mt-6 pt-5 border-t border-[#cfc7df]">
            <p className="text-[11px] text-[#9890a8] text-center leading-relaxed">
              Demo credentials:{' '}
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="font-semibold text-[#6b637d] hover:text-[#2b2438] underline transition-colors cursor-pointer"
              >
                {defaultDemoEmail} / {defaultDemoPassword}
              </button>
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
