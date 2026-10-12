import { useNavigate } from 'react-router-dom'
import Badge from '../common/Badge'
import { Calendar, MapPin, Trophy, Image } from 'lucide-react'

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

export default function PastEventCard({ event }) {
  const navigate = useNavigate()
  if (!event) return null

  const categoryVariant = categoryBadgeMap[event.category] || 'lavender'
  const photoCount = event.photos?.length || 0

  const handleClick = () => {
    navigate(`/student/events/${event.id}`)
  }

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer rounded-2xl border border-[#cfc7df] bg-[#f0ebf8] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-[#8c7fb4]/40 flex flex-col h-full"
    >
      {/* Cover + photo strip */}
      <div className="relative w-full h-44 sm:h-48 bg-[#ede7f5] overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a2337]/70 via-[#2a2337]/10 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant={categoryVariant} size="sm" className="shadow-xs backdrop-blur-sm">
            {event.category}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant="neutral" size="sm" className="bg-[#2a2337]/60 text-white border-transparent backdrop-blur-sm font-semibold">
            Completed
          </Badge>
        </div>

        {/* Photo count pill */}
        {photoCount > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-lg text-white text-[10px] font-semibold">
            <Image className="w-3 h-3" />
            <span>{photoCount} photos</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-[#1e1730] line-clamp-2 group-hover:text-[#8c7fb4] transition-colors leading-snug">
            {event.title}
          </h3>

          <div className="mt-2.5 space-y-1.5 text-xs text-[#5a5168]">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#7a7088] shrink-0" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#7a7088] shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>
        </div>

        {/* Achievement or open exhibition note */}
        <div className="pt-3 border-t border-[#cfc7df]">
          {event.winner ? (
            <div className="flex items-start gap-2">
              <Trophy className="w-3.5 h-3.5 text-[#a97c2f] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#7a7088]">
                  Winner
                </p>
                <p className="text-xs font-semibold text-[#1e1730] truncate">
                  {event.winner}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-[#7a7088] italic">
              Open exhibition · No competitive ranking
            </p>
          )}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleClick}
          className="w-full text-center text-xs font-semibold text-[#8c7fb4] bg-[#ede7f5] hover:bg-[#e0d8f0] py-2 rounded-xl transition-colors cursor-pointer"
        >
          View Outcomes & Gallery →
        </button>
      </div>
    </div>
  )
}
