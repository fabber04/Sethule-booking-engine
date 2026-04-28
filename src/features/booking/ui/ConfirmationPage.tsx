import { Link, useLocation } from 'react-router-dom'
import { useBooking } from '../BookingProvider'
import { formatMoney } from '../../../lib/money'
import { format } from 'date-fns'

function useQuery() {
  const loc = useLocation()
  return new URLSearchParams(loc.search)
}

export function ConfirmationPage() {
  const q = useQuery()
  const { state, pricing } = useBooking()
  const ref = q.get('ref') ?? state.confirmed?.reference ?? '—'

  const createdAt = state.confirmed?.createdAt ? new Date(state.confirmed.createdAt) : new Date()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="border-b border-black/10 bg-neutral-50 px-5 py-4">
          <div className="text-xs font-medium text-neutral-600">Booking confirmed</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">Reference {ref}</div>
          <div className="mt-1 text-sm text-neutral-600">Created {format(createdAt, 'EEE, d MMM yyyy • HH:mm')}</div>
        </div>

        <div className="px-5 py-5">
          <div className="grid gap-3 rounded-xl border border-black/10 bg-white p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="text-neutral-600">Check-in</div>
              <div className="font-medium">{state.search.checkIn}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-neutral-600">Check-out</div>
              <div className="font-medium">{state.search.checkOut}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-neutral-600">Guests</div>
              <div className="font-medium">
                {state.search.guests.adults} adults{state.search.guests.children ? `, ${state.search.guests.children} children` : ''}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-neutral-600">Total</div>
              <div className="text-lg font-semibold">{formatMoney(pricing.totalCents)}</div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            This is a prototype confirmation screen. In a production setup, this would email the guest and sync inventory.
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/"
              className="rounded-xl border border-black/10 px-4 py-3 text-center text-sm font-medium hover:bg-black/5"
            >
              Make another booking
            </Link>
            <a
              className="rounded-xl bg-black px-4 py-3 text-center text-sm font-medium text-white hover:bg-black/90"
              href="mailto:customercare@sethulelodge.com?subject=Booking%20enquiry"
            >
              Email the lodge
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

