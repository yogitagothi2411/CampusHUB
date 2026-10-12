import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from './Card'
import Input from './Input'
import Button from './Button'
import Badge from './Badge'
import { Mail, Lock, ArrowLeft } from 'lucide-react'

/**
 * Reusable Login Form for Student and Organizer authentication UI
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit({ email, password })
    } else {
      // Mock login — navigate to the correct portal
      if (role === 'organizer') {
        navigate('/organizer/dashboard')
      } else {
        navigate('/student/dashboard')
      }
    }
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
              {title}
            </h1>
            {portalBadge && (
              <Badge variant={badgeVariant} icon={RoleIcon} size="md">
                {portalBadge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#9890a8]">
            campusEventHUB
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id={`${role}-email`}
            label="College Email"
            type="email"
            placeholder="student@college.edu"
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
            autoComplete="current-password"
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant={buttonVariant}
              size="lg"
              className="w-full justify-center"
            >
              Login
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
