import { useNavigate } from 'react-router-dom'
import Card from '../common/Card'
import Badge from '../common/Badge'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'

const categoryBadgeMap = {
  Cultural: 'blush',
  Hackathon: 'lavender',
  Sports: 'peach',
  Workshop: 'powder',
  Seminar: 'mauve',
  Placement: 'lavender',
  Fest: 'blush',
  Technical: 'powder',
  'Club Activities': 'peach',
}

const statusBadgeMap = {
  Upcoming: 'lavender',
  'This Week': 'peach',
  'This Month': 'powder',
  Completed: 'neutral',
}

export default function EventCard({ event, onClick }) {
  const navigate = useNavigate()
  if (!event) return null

  const categoryVariant = categoryBadgeMap[event.category] || 'lavender'
  const statusVariant = statusBadgeMap[event.status] || 'neutral'

  const handleClick = (e) => {
    if (onClick) {
      onClick(e)
    } else {
      navigate(`/student/events/${event.id}`)
    }
  }

  return (
    <Card
      interactive
      padding="p-0"
      className="overflow-hidden flex flex-col h-full cursor-pointer group bg-[#f0ebf8] border-[#cfc7df]"
      onClick={handleClick}
    >
      {/* Event image container */}
      <div className="relative w-full h-44 sm:h-48 bg-[#dcd6ea] overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Category badge overlay */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <Badge variant={categoryVariant} size="sm" className="shadow-xs backdrop-blur-sm">
            {event.category}
          </Badge>
        </div>
        {/* Status pill overlay */}
        {event.status && (
          <div className="absolute top-3 right-3">
            <Badge variant={statusVariant} size="sm" className="shadow-xs backdrop-blur-sm font-semibold">
              {event.status}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#2b2438] line-clamp-2 group-hover:text-[#8c7fb4] transition-colors leading-snug">
            {event.title}
          </h3>

          <div className="mt-3 space-y-1.5 text-xs text-[#6b637d]">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#9890a8] shrink-0" />
              <span>{event.date}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#9890a8] shrink-0" />
              <span className="truncate">{event.time}</span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#9890a8] shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>

            {event.organizer && (
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#9890a8] shrink-0" />
                <span className="truncate">{event.organizer}</span>
              </div>
            )}
          </div>
        </div>

        {event.achievement && (
          <div className="mt-3 pt-3 border-t border-[#e5ddeee8]">
            <p className="text-xs font-medium text-[#544964] bg-[#ede7f5] px-2.5 py-1.5 rounded-lg truncate">
              🏆 {event.achievement}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
