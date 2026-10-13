import LoginForm from '../../components/common/LoginForm'
import { GraduationCap } from 'lucide-react'

export default function StudentLogin() {
  return (
    <LoginForm
      role="student"
      title="Student Login"
      portalBadge="Student"
      badgeVariant="lavender"
      icon={GraduationCap}
      buttonVariant="primary"
    />
  )
}
