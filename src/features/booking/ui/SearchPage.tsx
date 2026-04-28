import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDays, format, parseISO } from 'date-fns'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { useBooking } from '../BookingProvider'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function SearchPage() {
  const nav = useNavigate()
  const { state, dispatch } = useBooking()

  const range = useMemo<DateRange>(() => {
    return { from: parseISO(state.search.checkIn), to: parseISO(state.search.checkOut) }
  }, [state.search.checkIn, state.search.checkOut])

  const adults = state.search.guests.adults
  const children = state.search.guests.children

  const nights =
    range.from && range.to ? Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / 86400000)) : 1

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Book your stay</h1>
            <p className="mt-1 text-sm text-neutral-600">Select dates, guests, and promo code. Availability is simulated.</p>
          </div>
          <div className="hidden rounded-xl bg-black px-3 py-2 text-xs font-medium text-white md:block">
            Mobile-first • Fast • Realistic
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-black/10 p-3">
            <div className="text-xs font-medium text-neutral-600">Destination</div>
            <div className="mt-1 text-sm font-semibold">Sethule Guest Lodge, Bulawayo</div>
            <div className="mt-2 text-xs text-neutral-500">Hillside • Quiet neighborhood • Conference centre</div>
          </div>

          <div className="rounded-xl border border-black/10 p-3">
            <div className="text-xs font-medium text-neutral-600">Guests</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">
                {adults} adult{adults === 1 ? '' : 's'}
                {children > 0 ? `, ${children} child${children === 1 ? '' : 'ren'}` : ''}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-black/5"
                  onClick={() =>
                    dispatch({
                      type: 'search/set',
                      payload: { guests: { adults: clamp(adults - 1, 1, 6), children } },
                    })
                  }
                  type="button"
                >
                  −
                </button>
                <button
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-black/5"
                  onClick={() =>
                    dispatch({
                      type: 'search/set',
                      payload: { guests: { adults: clamp(adults + 1, 1, 6), children } },
                    })
                  }
                  type="button"
                >
                  +
                </button>
                <button
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm hover:bg-black/5"
                  onClick={() =>
                    dispatch({
                      type: 'search/set',
                      payload: { guests: { adults, children: clamp(children + 1, 0, 6) } },
                    })
                  }
                  type="button"
                  title="Add a child"
                >
                  + child
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-black/10 p-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-neutral-600">Dates</div>
              <div className="mt-1 text-sm font-semibold">
                {range.from ? format(range.from, 'EEE, d MMM yyyy') : '—'} →{' '}
                {range.to ? format(range.to, 'EEE, d MMM yyyy') : '—'} • {nights} night{nights === 1 ? '' : 's'}
              </div>
              <div className="mt-1 text-xs text-neutral-500">Tip: weekends are priced slightly higher.</div>
            </div>
            <button
              type="button"
              className="hidden rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 md:block"
              onClick={() => nav('/results')}
            >
              Search rooms
            </button>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl bg-black/2 p-2">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={(r) => {
                const from = r?.from ?? range.from ?? addDays(new Date(), 7)
                const to = r?.to ?? r?.from ?? addDays(from, 2)
                dispatch({
                  type: 'search/set',
                  payload: {
                    checkIn: format(from, 'yyyy-MM-dd'),
                    checkOut: format(to, 'yyyy-MM-dd'),
                  },
                })
              }}
              numberOfMonths={1}
              captionLayout="dropdown"
              fromYear={new Date().getFullYear()}
              toYear={new Date().getFullYear() + 1}
              weekStartsOn={1}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-600">Promo code (optional)</span>
            <input
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none ring-0 focus:border-black/30"
              value={state.search.promoCode ?? ''}
              onChange={(e) => dispatch({ type: 'search/set', payload: { promoCode: e.target.value } })}
              placeholder="WELCOME10"
            />
          </label>

          <button
            type="button"
            className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-black/90 md:hidden"
            onClick={() => nav('/results')}
          >
            Search rooms
          </button>
        </div>
      </section>

      <aside className="rounded-2xl border border-black/10 bg-neutral-50 p-4 md:p-6">
        <div className="text-sm font-semibold">What makes this feel “real”</div>
        <ul className="mt-3 space-y-2 text-sm text-neutral-700">
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/60" />
            Nightly breakdown, fees, taxes, and promo codes
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/60" />
            Add-ons like breakfast, extra bed, and shuttle
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/60" />
            Paynow initiation via local API when you configure Integration ID/key
          </li>
        </ul>

        <div className="mt-5 rounded-xl border border-black/10 bg-white p-4">
          <div className="text-xs font-medium text-neutral-600">Popular dates</div>
          <div className="mt-2 text-sm font-semibold">Next weekend</div>
          <div className="mt-1 text-xs text-neutral-500">Tip: try promo code LONGSTAY for 5+ nights.</div>
        </div>
      </aside>
    </div>
  )
}

