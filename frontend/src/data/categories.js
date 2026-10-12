/**
 * Category configuration and constants for campusEventHUB
 * Central source of truth for event categories across student, organizer, and admin portals.
 */

export const CATEGORIES_CONFIG = [
  {
    id: 'cultural',
    name: 'Cultural',
    bgClass: 'bg-[#faeaee] border-[#eed2d9]',
    activeBg: 'bg-[#eed2d9] border-[#dfabb8]',
    textColor: 'text-[#5f2e3c]',
    image:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    alt: 'Cultural & music events',
    description: 'Drama, music, dance performances, fine arts, and cultural celebrations',
  },
  {
    id: 'hackathon',
    name: 'Hackathon',
    bgClass: 'bg-[#ede8f8] border-[#ddd4f3]',
    activeBg: 'bg-[#ded4f5] border-[#8c7fb4]',
    textColor: 'text-[#392e59]',
    image:
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=300&auto=format&fit=crop&q=80',
    alt: 'Coding and hackathon events',
    description: 'Time-bounded coding marathons, ideathons, and software innovation sprints',
  },
  {
    id: 'sports',
    name: 'Sports',
    bgClass: 'bg-[#faede4] border-[#ebd6c7]',
    activeBg: 'bg-[#f4ded0] border-[#dfa891]',
    textColor: 'text-[#613622]',
    image:
      'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=300&auto=format&fit=crop&q=80',
    alt: 'Sports tournaments & matches',
    description: 'Inter-batch championships, athletic tournaments, and indoor/outdoor games',
  },
  {
    id: 'workshop',
    name: 'Workshop',
    bgClass: 'bg-[#e7eff9] border-[#d2e2f3]',
    activeBg: 'bg-[#d8e7f7] border-[#78a2cb]',
    textColor: 'text-[#23456b]',
    image:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80',
    alt: 'Interactive hands-on workshops',
    description: 'Hands-on technical, design, and practical skills development sessions',
  },
  {
    id: 'seminar',
    name: 'Seminar',
    bgClass: 'bg-[#eeebf6] border-[#dad4ea]',
    activeBg: 'bg-[#ded6f1] border-[#8c7fb4]',
    textColor: 'text-[#41355c]',
    image:
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=300&auto=format&fit=crop&q=80',
    alt: 'Keynote seminars & talks',
    description: 'Expert talks, research seminars, panel discussions, and founder keynotes',
  },
  {
    id: 'placement',
    name: 'Placement',
    bgClass: 'bg-[#eaf1f8] border-[#d2e1f2]',
    activeBg: 'bg-[#d5e6f7] border-[#6898cb]',
    textColor: 'text-[#204368]',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    alt: 'Career & placement drives',
    description: 'Pre-placement talks, resume reviews, interview preps, and recruitment drives',
  },
  {
    id: 'fest',
    name: 'Fest',
    bgClass: 'bg-[#fbe8ef] border-[#f0cddc]',
    activeBg: 'bg-[#f4d0e1] border-[#dfabb8]',
    textColor: 'text-[#622941]',
    image:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&auto=format&fit=crop&q=80',
    alt: 'College fests & concerts',
    description: 'Flagship annual festivals, cultural galas, and technical symposiums',
  },
  {
    id: 'technical',
    name: 'Technical',
    bgClass: 'bg-[#e5eff8] border-[#cee0f3]',
    activeBg: 'bg-[#d3e6f7] border-[#6a99ce]',
    textColor: 'text-[#1e426b]',
    image:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&auto=format&fit=crop&q=80',
    alt: 'Robotics and technical symposiums',
    description: 'Coding challenges, robotics competitions, and technology showcases',
  },
  {
    id: 'club-activities',
    name: 'Club Activities',
    bgClass: 'bg-[#f7efe6] border-[#e8d9c7]',
    activeBg: 'bg-[#f2e1cf] border-[#cca986]',
    textColor: 'text-[#5b3d1f]',
    image:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&auto=format&fit=crop&q=80',
    alt: 'Student club meetups & activities',
    description: 'Weekly club meetups, orientation sessions, and internal interest group events',
  },
]

/**
 * Standard list of category names as strings
 */
export const CATEGORIES = CATEGORIES_CONFIG.map((c) => c.name)
