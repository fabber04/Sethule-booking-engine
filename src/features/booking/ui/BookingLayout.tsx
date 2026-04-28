import { Link, Outlet, useLocation } from 'react-router-dom'
import { useBooking, formatMoney } from '../BookingProvider'
import { format, parseISO } from 'date-fns'

function StepPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={[
        'rounded-full px-3 py-1 text-xs font-medium',
        active ? 'bg-black text-white' : 'bg-black/5 text-black/70',
      ].join(' ')}
    >
      {label}
    </div>
  )
}

export function BookingLayout() {
  const { state, pricing } = useBooking()
  const loc = useLocation()

  const step =
    loc.pathname.endsWith('/results') || loc.pathname === '/results'
      ? 2
      : loc.pathname.endsWith('/checkout') || loc.pathname === '/checkout'
        ? 3
        : loc.pathname.endsWith('/confirmation') || loc.pathname === '/confirmation'
          ? 4
          : 1

  const checkIn = parseISO(state.search.checkIn)
  const checkOut = parseISO(state.search.checkOut)
  const dateLabel = `${format(checkIn, 'EEE, d MMM')} → ${format(checkOut, 'EEE, d MMM')}`

  return (
    <div className="min-h-dvh bg-white text-neutral-900">
      <header className="sticky top-0 z-20 border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-baseline gap-2">
            <div className="text-sm font-semibold tracking-wide text-neutral-900">Sethule</div>
            <div className="text-xs text-neutral-500">Booking</div>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <StepPill label="Search" active={step === 1} />
            <StepPill label="Rooms" active={step === 2} />
            <StepPill label="Details" active={step === 3} />
            <StepPill label="Confirm" active={step === 4} />
          </div>

          <div className="text-right">
            <div className="text-xs text-neutral-500">{dateLabel}</div>
            <div className="text-sm font-semibold">{formatMoney(pricing.totalCents)}</div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-black/10">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-neutral-500">
          Prototype booking engine for demonstration purposes. Promo codes: <span className="font-mono">WELCOME10</span>,{' '}
          <span className="font-mono">LONGSTAY</span>.
        </div>
      </footer>
    </div>
  )
}

