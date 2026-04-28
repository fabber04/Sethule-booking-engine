/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react'
import { addDays, formatISO, isAfter, isValid } from 'date-fns'
import type { Room } from './mock/rooms'
import { rooms } from './mock/rooms'
import { computePricing } from '../../lib/pricing'

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
  /** Used for Paynow reference before final confirmation/payment reconciliation */
  bookingRef?: string
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
  | { type: 'bookingRef/set'; payload: string | undefined }
  | { type: 'confirmed/set'; payload: BookingState['confirmed'] }
  | { type: 'reset' }

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
      return { ...state, search: next, bookingRef: undefined, confirmed: undefined }
    }
    case 'selected/set':
      return { ...state, selected: action.payload, bookingRef: undefined, confirmed: undefined }
    case 'guest/set':
      return { ...state, guest: action.payload }
    case 'bookingRef/set':
      return { ...state, bookingRef: action.payload }
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
  nightly: { date: string; label: string; amountCents: number }[]
  lines: PricingLine[]
  totalCents: number
}

type BookingContextValue = {
  state: BookingState
  dispatch: React.Dispatch<Action>
  rooms: Room[]
  pricing: Pricing
  ensureBookingRef: () => string
  confirm: () => { reference: string; totalCents: number }
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, defaultState)
  const pricing = useMemo(() => computePricing(state), [state])

  const makeReference = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let out = 'STH-'
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
    return out
  }, [])

  const ensureBookingRef = useCallback(() => {
    if (state.bookingRef) return state.bookingRef
    const reference = makeReference()
    dispatch({ type: 'bookingRef/set', payload: reference })
    return reference
  }, [dispatch, makeReference, state.bookingRef])

  const confirm = useCallback(() => {
    const reference = state.bookingRef ?? makeReference()
    if (!state.bookingRef) dispatch({ type: 'bookingRef/set', payload: reference })
    const createdAt = new Date().toISOString()
    dispatch({ type: 'confirmed/set', payload: { reference, createdAt, totalCents: pricing.totalCents } })
    return { reference, totalCents: pricing.totalCents }
  }, [dispatch, makeReference, pricing.totalCents, state.bookingRef])

  const value = useMemo<BookingContextValue>(
    () => ({ state, dispatch, rooms, pricing, ensureBookingRef, confirm }),
    [state, dispatch, pricing, confirm, ensureBookingRef],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within BookingProvider')
  return ctx
}

