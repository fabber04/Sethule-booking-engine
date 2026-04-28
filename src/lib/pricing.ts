import { addDays, differenceInCalendarDays, format, isWeekend, parseISO } from 'date-fns'
import type { BookingState, Pricing, PricingLine } from '../features/booking/BookingProvider'
import { rooms } from '../features/booking/mock/rooms'

function cents(n: number) {
  return Math.round(n * 100)
}

export function computePricing(state: BookingState): Pricing {
  const { checkIn, checkOut, guests, promoCode } = state.search
  const checkInDate = parseISO(checkIn)
  const checkOutDate = parseISO(checkOut)
  const nights = Math.max(1, differenceInCalendarDays(checkOutDate, checkInDate))
  const selectedRoom = state.selected ? rooms.find((r) => r.id === state.selected!.roomId) : undefined

  const baseNight = selectedRoom?.baseRatePerNight ?? 120
  const guestSurchargePerNight = Math.max(0, guests.adults - 2) * 10 + Math.max(0, guests.children) * 5

  const refundableMultiplier = state.selected?.ratePlan === 'refundable' ? 1.12 : 1

  const seasonalMultiplier = (d: Date) => {
    const m = d.getMonth() + 1
    if (m >= 6 && m <= 8) return 1.15
    if (m === 12) return 1.2
    if (m === 2) return 1.05
    return 1
  }

  const nightly: { date: string; label: string; amountCents: number }[] = []
  let roomTotalFloat = 0
  for (let i = 0; i < nights; i++) {
    const d = addDays(checkInDate, i)
    const weekendMultiplier = isWeekend(d) ? 1.08 : 1
    const nightRate =
      (baseNight + guestSurchargePerNight) * refundableMultiplier * seasonalMultiplier(d) * weekendMultiplier
    roomTotalFloat += nightRate
    nightly.push({
      date: format(d, 'yyyy-MM-dd'),
      label: format(d, 'EEE, d MMM'),
      amountCents: cents(nightRate),
    })
  }

  const extras = state.selected?.extras ?? { breakfast: true, airportShuttle: false, extraBed: 0 }
  const extrasPerNight = (extras.breakfast ? 9 : 0) * (guests.adults + guests.children) + extras.extraBed * 12
  const extrasOneOff = extras.airportShuttle ? 25 : 0

  const roomTotal = cents(roomTotalFloat)
  const extrasTotal = cents(extrasPerNight * nights) + cents(extrasOneOff)

  const lines: PricingLine[] = [{ label: `Room (${nights} night${nights === 1 ? '' : 's'})`, amountCents: roomTotal }]
  if (extras.breakfast) lines.push({ label: 'Breakfast', amountCents: cents(extrasPerNight * nights) })
  if (extras.extraBed > 0) lines.push({ label: `Extra bed × ${extras.extraBed}`, amountCents: cents(extras.extraBed * 12 * nights) })
  if (extras.airportShuttle) lines.push({ label: 'Airport shuttle (one-way)', amountCents: cents(extrasOneOff) })

  const subtotalCents = roomTotal + extrasTotal

  let discountCents = 0
  const code = (promoCode ?? '').trim().toUpperCase()
  if (code === 'WELCOME10') discountCents = Math.round(subtotalCents * 0.1)
  if (code === 'LONGSTAY' && nights >= 5) discountCents = Math.round(subtotalCents * 0.12)
  if (discountCents > 0) lines.push({ label: `Promo (${code})`, amountCents: -discountCents })

  const serviceFeeCents = Math.round((subtotalCents - discountCents) * 0.04)
  const taxesCents = Math.round((subtotalCents - discountCents + serviceFeeCents) * 0.08)
  lines.push({ label: 'Service fee', amountCents: serviceFeeCents })
  lines.push({ label: 'Taxes & VAT', amountCents: taxesCents })

  const totalCents = subtotalCents - discountCents + serviceFeeCents + taxesCents

  return { nights, subtotalCents, nightly, lines, totalCents }
}

