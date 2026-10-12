import { Link } from 'react-router-dom'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { GraduationCap, CalendarDays, Sparkles, ShieldCheck } from 'lucide-react'

export default function LoginSelection() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#e8e3f7] flex items-center justify-center text-[#8c7fb4]">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2b2438]">
            campusEventHUB
          </h1>
        </div>

        <p className="text-sm text-[#6b637d]">
          College-wide event & activity discovery platform
        </p>

        <div className="mt-8 space-y-3.5">
          <Link to="/student/login" className="block w-full">
            <Button
              variant="primary"
              size="lg"
              icon={GraduationCap}
              className="w-full justify-center"
            >
              Student Login
            </Button>
          </Link>

          <Link to="/organizer/login" className="block w-full">
            <Button
              variant="secondary"
              size="lg"
              icon={CalendarDays}
              className="w-full justify-center"
            >
              Organizer Login
            </Button>
          </Link>

          <Link to="/admin/login" className="block w-full">
            <Button
              variant="ghost"
              size="lg"
              icon={ShieldCheck}
              className="w-full justify-center border border-[#d5ccdf] hover:bg-[#d5ccdf]/40 text-[#443851]"
            >
              Admin Login
            </Button>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-[#cfc7df] text-center">
          <p className="text-xs text-[#9890a8]">
            Discover workshops, fests, hackathons, and sports activities
          </p>
        </div>
      </Card>
    </div>
  )
}