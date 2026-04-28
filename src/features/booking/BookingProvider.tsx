import React, { createContext, useContext, useMemo, useReducer } from 'react'
import { addDays, differenceInCalendarDays, formatISO, isAfter, isValid } from 'date-fns'
import type { Room } from './mock/rooms'
import { rooms } from './mock/rooms'

export type GuestCounts = { adults: number; children: number }

export type BookingSearch = {
  checkIn: string // ISO date (YYYY-MM-DD)
  checkOut: string // ISO date (YYYY-MM-DD)
  guests: GuestCounts
  promoCode?: string
}

export type SelectedRoom = {
  roomId: Room['id']
  ratePlan: 'refundable' | 'non_refundable'
  extras: {
    breakfast: boolean
    airportShuttle: boolean
    extraBed: number
  }
}

export type GuestDetails = {
  firstName: string
  lastName: string
  email: string
  phone: string
  notes?: string
}

export type BookingState = {
  search: BookingSearch
  selected?: SelectedRoom
  guest?: GuestDetails
  confirmed?: {
    reference: string
    createdAt: string
    totalCents: number
  }
}

type Action =
  | { type: 'search/set'; payload: Partial<BookingSearch> }
  | { type: 'selected/set'; payload: SelectedRoom }
  | { type: 'guest/set'; payload: GuestDetails }
  | { type: 'confirmed/set'; payload: BookingState['confirmed'] }
  | { type: 'reset' }

function makeReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = 'STH-'
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function safeIsoDate(d: Date) {
  if (!isValid(d)) return formatISO(new Date(), { representation: 'date' })
  return formatISO(d, { representation: 'date' })
}

function defaultState(): BookingState {
  const today = new Date()
  const checkIn = addDays(today, 7)
  const checkOut = addDays(today, 9)
  return {
    search: {
      checkIn: safeIsoDate(checkIn),
      checkOut: safeIsoDate(checkOut),
      guests: { adults: 2, children: 0 },
      promoCode: '',
    },
  }
}

function reducer(state: BookingState, action: Action): BookingState {
  switch (action.type) {
    case 'search/set': {
      const next = { ...state.search, ...action.payload }
      // Basic guardrails: ensure checkout after checkin
      if (!isAfter(new Date(next.checkOut), new Date(next.checkIn))) {
        next.checkOut = safeIsoDate(addDays(new Date(next.checkIn), 1))
      }
      return { ...state, search: next }
    }
    case 'selected/set':
      return { ...state, selected: action.payload }
    case 'guest/set':
      return { ...state, guest: action.payload }
    case 'confirmed/set':
      return { ...state, confirmed: action.payload }
    case 'reset':
      return defaultState()
    default:
      return state
  }
}

export type PricingLine = { label: string; amountCents: number; help?: string }
export type Pricing = {
  nights: number
  subtotalCents: number
  lines: PricingLine[]
  totalCents: number
}

function cents(n: number) {
  return Math.round(n * 100)
}

export function formatMoney(centsValue: number, currency = 'USD') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(centsValue / 100)
}

export function computePricing(state: BookingState): Pricing {
  const { checkIn, checkOut, guests, promoCode } = state.search
  const nights = Math.max(1, differenceInCalendarDays(new Date(checkOut), new Date(checkIn)))
  const selectedRoom = state.selected ? rooms.find((r) => r.id === state.selected!.roomId) : undefined

  const baseNight = selectedRoom?.baseRatePerNight ?? 120
  const guestSurcharge = Math.max(0, guests.adults - 2) * 10 + Math.max(0, guests.children) * 5

  const refundableMultiplier = state.selected?.ratePlan === 'refundable' ? 1.12 : 1
  const ratePerNight = (baseNight + guestSurcharge) * refundableMultiplier

  const extras = state.selected?.extras ?? { breakfast: true, airportShuttle: false, extraBed: 0 }
  const extrasPerNight = (extras.breakfast ? 9 : 0) * (guests.adults + guests.children) + extras.extraBed * 12
  const extrasOneOff = extras.airportShuttle ? 25 : 0

  const roomTotal = cents(ratePerNight * nights)
  const extrasTotal = cents(extrasPerNight * nights) + cents(extrasOneOff)

  const lines: PricingLine[] = [
    { label: `Room (${nights} night${nights === 1 ? '' : 's'})`, amountCents: roomTotal },
  ]
  if (extras.breakfast) lines.push({ label: 'Breakfast', amountCents: cents(extrasPerNight * nights) })
  if (extras.extraBed > 0)
    lines.push({ label: `Extra bed × ${extras.extraBed}`, amountCents: cents(extras.extraBed * 12 * nights) })
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

  return { nights, subtotalCents, lines, totalCents }
}

type BookingContextValue = {
  state: BookingState
  dispatch: React.Dispatch<Action>
  rooms: Room[]
  pricing: Pricing
  confirm: () => { reference: string; totalCents: number }
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, defaultState)
  const pricing = useMemo(() => computePricing(state), [state])

  const value = useMemo<BookingContextValue>(() => {
    return {
      state,
      dispatch,
      rooms,
      pricing,
      confirm: () => {
        const reference = makeReference()
        const createdAt = new Date().toISOString()
        dispatch({ type: 'confirmed/set', payload: { reference, createdAt, totalCents: pricing.totalCents } })
        return { reference, totalCents: pricing.totalCents }
      },
    }
  }, [pricing.totalCents, state])

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within BookingProvider')
  return ctx
}

