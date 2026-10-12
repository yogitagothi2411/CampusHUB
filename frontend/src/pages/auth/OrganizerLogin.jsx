import LoginForm from '../../components/common/LoginForm'
import { CalendarDays } from 'lucide-react'

export default function OrganizerLogin() {
  return (
    <LoginForm
      role="organizer"
      title="Organizer Login"
      portalBadge="Organizer"
      badgeVariant="blush"
      icon={CalendarDays}
      buttonVariant="secondary"
    />
  )
}
