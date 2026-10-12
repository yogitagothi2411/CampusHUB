import { useNavigate } from 'react-router-dom'
import LoginForm from '../../components/common/LoginForm'
import { GraduationCap } from 'lucide-react'

export default function StudentLogin() {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/student/dashboard')
  }

  return (
    <LoginForm
      role="student"
      title="Student Login"
      portalBadge="Student"
      badgeVariant="lavender"
      icon={GraduationCap}
      buttonVariant="primary"
      onSubmit={handleLogin}
    />
  )
}
