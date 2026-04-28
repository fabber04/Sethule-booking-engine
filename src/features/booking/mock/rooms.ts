export type Room = {
  id: string
  name: string
  description: string
  maxAdults: number
  maxChildren: number
  baseRatePerNight: number
  beds: string
  sizeSqm: number
  amenities: string[]
  photos: string[]
}

export const rooms: Room[] = [
  {
    id: 'standard-queen',
    name: 'Standard Room',
    description:
      'Comfortable ensuite room with air-conditioning, satellite TV, fridge, and tea/coffee facilities. Ideal for short stays and business travel.',
    maxAdults: 2,
    maxChildren: 1,
    baseRatePerNight: 110,
    beds: '1 × Queen',
    sizeSqm: 22,
    amenities: ['Free Wi‑Fi', 'Air-conditioning', 'Fridge', 'Satellite TV', 'Tea/Coffee', 'Workspace'],
    photos: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80'],
  },
  {
    id: 'executive-king',
    name: 'Executive Room',
    description:
      'A refined space with upgraded finishes, more room to unwind, and a king bed. Great for longer stays and guests who want extra comfort.',
    maxAdults: 2,
    maxChildren: 2,
    baseRatePerNight: 145,
    beds: '1 × King',
    sizeSqm: 28,
    amenities: ['Free Wi‑Fi', 'Air-conditioning', 'Fridge', 'Satellite TV', 'Tea/Coffee', 'Lounge chair'],
    photos: ['https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1400&q=80'],
  },
  {
    id: 'family-suite',
    name: 'Family Suite',
    description:
      'Extra space for families with flexible bedding, more storage, and comfortable seating. A smart pick for weekend getaways.',
    maxAdults: 3,
    maxChildren: 2,
    baseRatePerNight: 175,
    beds: '1 × Queen + 1 × Single',
    sizeSqm: 36,
    amenities: ['Free Wi‑Fi', 'Air-conditioning', 'Fridge', 'Satellite TV', 'Tea/Coffee', 'Extra storage'],
    photos: ['https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1400&q=80'],
  },
]

