/**
 * IIIT Vadodara Clubs and Committees Dataset
 * Based on documented public information and SRS domain model.
 * Single source of truth for student club discovery and organizer affiliations.
 */

export const CLUBS = [
  {
    id: 'club-coding',
    name: 'Coding Club',
    shortName: 'Coding Club',
    category: 'Technical',
    committee: 'Technical Committee',
    description:
      'The premier competitive programming and algorithmic problem-solving society of IIIT Vadodara. Organizes regular contest series, ICPC mentorship, and technical challenges.',
    lead: 'Arjun Mehta',
    email: 'codingclub@iiitvadodara.ac.in',
    membersCount: 140,
    tags: ['Competitive Programming', 'Algorithms', 'Data Structures', 'ICPC'],
    image:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'club-enigma',
    name: 'Enigma',
    shortName: 'Enigma',
    category: 'Technical',
    committee: 'Technical Committee',
    description:
      'The Web, App, and Open Source development community at IIIT Vadodara. Mentors students in full-stack engineering, cloud technologies, devops, and open source contributions.',
    lead: 'Rohan Sharma',
    email: 'enigma@iiitvadodara.ac.in',
    membersCount: 125,
    tags: ['Web Development', 'Open Source', 'DevOps', 'Mobile Apps'],
    image:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'club-dot',
    name: 'DOT',
    shortName: 'DOT',
    category: 'Design',
    committee: 'Technical Committee',
    description:
      'The UI/UX and product design club of IIIT Vadodara. Focuses on interface design, design systems, visual arts, 3D modeling, and creative digital experiences.',
    lead: 'Sneha Kulkarni',
    email: 'dot@iiitvadodara.ac.in',
    membersCount: 85,
    tags: ['UI/UX', 'Figma', 'Product Design', 'Visual Arts'],
    image:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&auto=format&fit=crop&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'club-finance',
    name: 'Finance & Consulting Club',
    shortName: 'Finance & Consulting',
    category: 'Management',
    committee: 'Technical Committee',
    description:
      'Promotes understanding of financial markets, quantitative analysis, venture capital, case interviews, and management consulting for future tech leaders.',
    lead: 'Dhruv Kapoor',
    email: 'fcc@iiitvadodara.ac.in',
    membersCount: 70,
    tags: ['FinTech', 'Case Studies', 'Consulting', 'Venture Capital'],
    image:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'club-mod5',
    name: 'MOD5',
    shortName: 'MOD5',
    category: 'Gaming',
    committee: 'Cultural Committee',
    description:
      'The gaming, eSports, and game development society of IIIT Vadodara. Hosts gaming tournaments and game design workshops.',
    lead: 'Aditya Kumar',
    email: 'mod5@iiitvadodara.ac.in',
    membersCount: 95,
    tags: ['eSports', 'Game Dev', 'Gaming', 'Unity'],
    image:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'club-encore',
    name: 'Encore',
    shortName: 'Encore',
    category: 'Cultural',
    committee: 'Cultural Committee',
    description:
      'The official music club of IIIT Vadodara. Unites vocalists, instrumentalists, and composers across classical, acoustic, rock, and fusion genres.',
    lead: 'Meera Pillai',
    email: 'encore@iiitvadodara.ac.in',
    membersCount: 65,
    tags: ['Music', 'Vocal', 'Instruments', 'Band Performances'],
    image:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'club-masquerade',
    name: 'Masquerade',
    shortName: 'Masquerade',
    category: 'Cultural',
    committee: 'Cultural Committee',
    description:
      'The dramatics and street theatre society. Produces stage plays, street plays (Nukkad Natak), and dramatic acts reflecting social consciousness and art.',
    lead: 'Vikram Rao',
    email: 'masquerade@iiitvadodara.ac.in',
    membersCount: 50,
    tags: ['Theatre', 'Dramatics', 'Street Play', 'Acting'],
    image:
      'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&auto=format&fit=crop&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'club-obscura',
    name: 'Obscura',
    shortName: 'Obscura',
    category: 'Cultural',
    committee: 'Cultural Committee',
    description:
      'The photography and cinematography club of IIIT Vadodara. Captures campus moments, fest coverage, documentary filmmaking, and photo walks.',
    lead: 'Tanvi Shah',
    email: 'obscura@iiitvadodara.ac.in',
    membersCount: 55,
    tags: ['Photography', 'Filmmaking', 'Visual Media', 'Video Editing'],
    image:
      'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&auto=format&fit=crop&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'club-shades',
    name: 'Shades',
    shortName: 'Shades',
    category: 'Cultural',
    committee: 'Cultural Committee',
    description:
      'The fine arts and sketching society. Brings together painters, sketch artists, digital illustrators, and sculptors to create campus visual exhibits.',
    lead: 'Pooja Desai',
    email: 'shades@iiitvadodara.ac.in',
    membersCount: 45,
    tags: ['Fine Arts', 'Painting', 'Sketching', 'Illustration'],
    image:
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&auto=format&fit=crop&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'club-pensieve',
    name: 'Pensieve',
    shortName: 'Pensieve',
    category: 'Literature',
    committee: 'Cultural Committee',
    description:
      'The literary and debating society of IIIT Vadodara. Hosts parliamentary debates, model UN, poetry slams, elocutions, and book discussion panels.',
    lead: 'Harshit Malhotra',
    email: 'pensieve@iiitvadodara.ac.in',
    membersCount: 60,
    tags: ['Debating', 'Literature', 'Poetry', 'Public Speaking'],
    image:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'club-editorial',
    name: 'Editorial Board',
    shortName: 'Editorial',
    category: 'Literature',
    committee: 'Cultural Committee',
    description:
      'The official campus journalism and newsletter editorial board. Publishes student articles, interview features with alumni, and the annual institute magazine.',
    lead: 'Riya Bhatt',
    email: 'editorial@iiitvadodara.ac.in',
    membersCount: 40,
    tags: ['Journalism', 'Newsletter', 'Writing', 'Campus Media'],
    image:
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'comm-technical',
    name: 'Technical Committee',
    shortName: 'Tech Committee',
    category: 'Technical',
    committee: 'Technical Committee',
    description:
      'The apex student technical council responsible for organizing Cerebro, institute-wide hackathons, technical symposiums, and overseeing all technical clubs.',
    lead: 'Ananya Sen',
    email: 'techcomm@iiitvadodara.ac.in',
    membersCount: 30,
    tags: ['Cerebro', 'Technical Council', 'Symposiums', 'Leadership'],
    image:
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'comm-cultural',
    name: 'Cultural Committee',
    shortName: 'Cultural Committee',
    category: 'Cultural',
    committee: 'Cultural Committee',
    description:
      'The apex student cultural council responsible for organizing Kreiva, Alfaaz, festive celebrations, and coordinating all cultural performing arts societies.',
    lead: 'Aarav Patel',
    email: 'cultcomm@iiitvadodara.ac.in',
    membersCount: 35,
    tags: ['Kreiva', 'Cultural Council', 'Festivals', 'Performing Arts'],
    image:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'comm-sports',
    name: 'Sports Committee',
    shortName: 'Sports Committee',
    category: 'Sports',
    committee: 'Sports Committee',
    description:
      'The student sports council responsible for organizing OLYMPUS, inter-batch leagues, fitness initiatives, and training varsity teams for inter-IIIT tournaments.',
    lead: 'Karthik Nair',
    email: 'sportscomm@iiitvadodara.ac.in',
    membersCount: 40,
    tags: ['OLYMPUS', 'Inter-IIIT', 'Athletics', 'Tournaments'],
    image:
      'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80',
    coverImage:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80',
  },
]
