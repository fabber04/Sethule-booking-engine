import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useBooking } from '../BookingProvider'
import { formatMoney } from '../../../lib/money'

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-black/5 px-2 py-1 text-xs font-medium text-black/70">
      {children}
    </span>
  )
}

export function RoomDetailsPage() {
  const nav = useNavigate()
  const { roomId } = useParams()
  const { state, dispatch, rooms } = useBooking()
  const room = rooms.find((r) => r.id === roomId)

  const [ratePlan, setRatePlan] = useState<'refundable' | 'non_refundable'>(state.selected?.ratePlan ?? 'refundable')

  const fitsGuests = useMemo(() => {
    if (!room) return false
    return state.search.guests.adults <= room.maxAdults && state.search.guests.children <= room.maxChildren
  }, [room, state.search.guests.adults, state.search.guests.children])

  if (!room) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="text-lg font-semibold">Room not found</div>
        <div className="mt-1 text-sm text-neutral-600">Go back to results and choose another room.</div>
        <Link
          to="/results"
          className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
        >
          Back to rooms
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{room.name}</h2>
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge>{room.beds}</Badge>
              <Badge>{room.sizeSqm} m²</Badge>
              <Badge>
                Up to {room.maxAdults} adult{room.maxAdults === 1 ? '' : 's'}
                {room.maxChildren ? `, ${room.maxChildren} child` : ''}
              </Badge>
            </div>
          </div>

          <Link to="/results" className="text-sm text-neutral-600 hover:text-neutral-900">
            ← Back to results
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
          <div className="grid md:grid-cols-2">
            <img src={room.photos[0]} alt="" className="h-64 w-full object-cover md:h-full" />
            <div className="p-4 md:p-6">
              <div className="text-sm font-semibold">About this room</div>
              <p className="mt-2 text-sm text-neutral-700">{room.description}</p>

              <div className="mt-5">
                <div className="text-sm font-semibold">Amenities</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {room.amenities.map((a) => (
                    <Badge key={a}>{a}</Badge>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-black/10 bg-neutral-50 p-4">
                <div className="text-sm font-semibold">Policies</div>
                <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                  <li>Check-in from 14:00 • Check-out by 10:00</li>
                  <li>Non‑smoking rooms</li>
                  <li>ID required at check‑in</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside className="rounded-2xl border border-black/10 bg-neutral-50 p-4 md:p-6">
        <div className="text-sm font-semibold">Choose your rate</div>
        <div className="mt-3 grid gap-2">
          <button
            type="button"
            className={[
              'rounded-xl border px-3 py-3 text-left',
              ratePlan === 'refundable' ? 'border-black bg-black text-white' : 'border-black/10 bg-white hover:bg-black/5',
            ].join(' ')}
            onClick={() => setRatePlan('refundable')}
          >
            <div className="text-sm font-semibold">Refundable</div>
            <div className="mt-1 text-xs opacity-80">Free cancellation until 48 hours before check‑in.</div>
          </button>
          <button
            type="button"
            className={[
              'rounded-xl border px-3 py-3 text-left',
              ratePlan === 'non_refundable'
                ? 'border-black bg-black text-white'
                : 'border-black/10 bg-white hover:bg-black/5',
            ].join(' ')}
            onClick={() => setRatePlan('non_refundable')}
          >
            <div className="text-sm font-semibold">Non‑refundable</div>
            <div className="mt-1 text-xs opacity-80">Best price • No changes.</div>
          </button>
        </div>

        {!fitsGuests ? (
          <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            This room may not fit your guest count. Reduce guests or choose another room.
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs text-neutral-500">from</div>
                <div className="text-2xl font-semibold">{formatMoney(room.baseRatePerNight * 100)}</div>
                <div className="text-xs text-neutral-500">per night</div>
              </div>
              <button
                type="button"
                className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-black/90"
                onClick={() => {
                  dispatch({
                    type: 'selected/set',
                    payload: {
                      roomId: room.id,
                      ratePlan,
                      extras: state.selected?.extras ?? { breakfast: true, airportShuttle: false, extraBed: 0 },
                    },
                  })
                  nav('/checkout')
                }}
              >
                Continue to checkout
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

