import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { parseISO, format } from 'date-fns'
import { useBooking, formatMoney } from '../BookingProvider'

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-black/5 px-2 py-1 text-xs font-medium text-black/70">
      {children}
    </span>
  )
}

export function ResultsPage() {
  const nav = useNavigate()
  const { state, dispatch, rooms, pricing } = useBooking()
  const [ratePlan, setRatePlan] = useState<'refundable' | 'non_refundable'>('refundable')

  const checkIn = parseISO(state.search.checkIn)
  const checkOut = parseISO(state.search.checkOut)
  const dateLabel = `${format(checkIn, 'd MMM')} → ${format(checkOut, 'd MMM')}`

  const selectedRoomId = state.selected?.roomId

  const occupancyOk = useMemo(() => {
    const a = state.search.guests.adults
    const c = state.search.guests.children
    return new Set(
      rooms
        .filter((r) => a <= r.maxAdults && c <= r.maxChildren)
        .map((r) => r.id),
    )
  }, [rooms, state.search.guests.adults, state.search.guests.children])

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Available rooms</h2>
            <div className="mt-1 text-sm text-neutral-600">
              {dateLabel} • {state.search.guests.adults} adults{state.search.guests.children ? `, ${state.search.guests.children} children` : ''}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={[
                'rounded-xl border px-3 py-2 text-sm',
                ratePlan === 'refundable' ? 'border-black bg-black text-white' : 'border-black/10 hover:bg-black/5',
              ].join(' ')}
              onClick={() => setRatePlan('refundable')}
            >
              Refundable
            </button>
            <button
              type="button"
              className={[
                'rounded-xl border px-3 py-2 text-sm',
                ratePlan === 'non_refundable'
                  ? 'border-black bg-black text-white'
                  : 'border-black/10 hover:bg-black/5',
              ].join(' ')}
              onClick={() => setRatePlan('non_refundable')}
            >
              Non‑refundable
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {rooms.map((room) => {
            const ok = occupancyOk.has(room.id)
            const selected = selectedRoomId === room.id
            return (
              <article
                key={room.id}
                className={[
                  'overflow-hidden rounded-2xl border bg-white shadow-sm',
                  selected ? 'border-black/40 ring-1 ring-black/20' : 'border-black/10',
                  ok ? '' : 'opacity-60',
                ].join(' ')}
              >
                <div className="grid md:grid-cols-[220px_1fr]">
                  <div className="relative h-48 md:h-full">
                    <img src={room.photos[0]} alt="" className="h-full w-full object-cover" />
                    <div className="absolute left-3 top-3 flex gap-2">
                      <Badge>{room.beds}</Badge>
                      <Badge>{room.sizeSqm} m²</Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold">{room.name}</div>
                        <div className="mt-1 text-sm text-neutral-600">{room.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-neutral-500">from</div>
                        <div className="text-lg font-semibold">{formatMoney(room.baseRatePerNight * 100)}</div>
                        <div className="text-xs text-neutral-500">per night</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {room.amenities.slice(0, 5).map((a) => (
                        <Badge key={a}>{a}</Badge>
                      ))}
                    </div>

                    {!ok ? (
                      <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        This room may not fit your guest count. Try reducing guests.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-neutral-500">
                          {ratePlan === 'refundable'
                            ? 'Free cancellation until 48 hours before check-in.'
                            : 'Non-refundable; best price.'}
                        </div>
                        <button
                          type="button"
                          className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5"
                          onClick={() => nav(`/room/${encodeURIComponent(room.id)}`)}
                        >
                          View details
                        </button>
                        <button
                          type="button"
                          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
                          onClick={() => {
                            dispatch({
                              type: 'selected/set',
                              payload: {
                                roomId: room.id,
                                ratePlan,
                                extras: {
                                  breakfast: true,
                                  airportShuttle: false,
                                  extraBed: 0,
                                },
                              },
                            })
                            nav(`/room/${encodeURIComponent(room.id)}`)
                          }}
                        >
                          Select rate
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-neutral-600 hover:text-neutral-900">
            ← Change search
          </Link>
        </div>
      </section>

      <aside className="rounded-2xl border border-black/10 bg-neutral-50 p-4 md:p-6">
        <div className="text-sm font-semibold">Your estimate</div>
        <div className="mt-1 text-xs text-neutral-500">Final total shown at checkout.</div>

        <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="font-medium">Dates</div>
            <div className="text-neutral-600">{dateLabel}</div>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <div className="font-medium">Guests</div>
            <div className="text-neutral-600">
              {state.search.guests.adults} adults{state.search.guests.children ? `, ${state.search.guests.children} children` : ''}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
          <div className="text-xs font-medium text-neutral-600">Preview total</div>
          <div className="mt-1 text-2xl font-semibold">{formatMoney(pricing.totalCents)}</div>
          <div className="mt-2 text-xs text-neutral-500">
            Includes taxes/fees. Promo codes apply automatically when valid.
          </div>
        </div>
      </aside>
    </div>
  )
}

