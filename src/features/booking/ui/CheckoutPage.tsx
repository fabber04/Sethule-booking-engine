import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useBooking } from '../BookingProvider'
import { parseISO, format } from 'date-fns'
import { buildPaynowLink } from '../../../lib/paynow'
import { formatMoney } from '../../../lib/money'

const guestSchema = z.object({
  firstName: z.string().min(2, 'Please enter a first name'),
  lastName: z.string().min(2, 'Please enter a last name'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(7, 'Please enter a phone number'),
  notes: z.string().optional(),
})

type GuestForm = z.infer<typeof guestSchema>

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-neutral-600">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  )
}

export function CheckoutPage() {
  const nav = useNavigate()
  const { state, dispatch, rooms, pricing, ensureBookingRef, confirm } = useBooking()

  const selectedRoom = rooms.find((r) => r.id === state.selected?.roomId)
  const checkIn = parseISO(state.search.checkIn)
  const checkOut = parseISO(state.search.checkOut)

  const paynowMerchantEmail = (import.meta.env.VITE_PAYNOW_MERCHANT_EMAIL as string | undefined)?.trim()

  const form = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      firstName: state.guest?.firstName ?? '',
      lastName: state.guest?.lastName ?? '',
      email: state.guest?.email ?? '',
      phone: state.guest?.phone ?? '',
      notes: state.guest?.notes ?? '',
    },
    mode: 'onTouched',
  })

  const canContinue = !!selectedRoom && !!state.selected

  useEffect(() => {
    if (!canContinue) return
    ensureBookingRef()
  }, [canContinue, ensureBookingRef, pricing.totalCents])

  const paymentHref = useMemo(() => {
    if (!paynowMerchantEmail) return undefined
    if (!state.bookingRef) return undefined
    const email = form.getValues('email')?.trim()
    const amount = (pricing.totalCents / 100).toFixed(2)
    return buildPaynowLink({
      merchantEmail: paynowMerchantEmail,
      amount,
      reference: state.bookingRef,
      customerEmail: email || undefined,
      locked: true,
      additionalInfo: 'Sethule booking (prototype)',
    })
  }, [paynowMerchantEmail, pricing.totalCents, form, state.bookingRef])

  if (!canContinue) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6">
        <div className="text-lg font-semibold">Select a room first</div>
        <div className="mt-1 text-sm text-neutral-600">Go back to results and pick a room to continue.</div>
        <button
          type="button"
          className="mt-4 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
          onClick={() => nav('/results')}
        >
          Back to rooms
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Guest details</h2>
            <p className="mt-1 text-sm text-neutral-600">These details appear on the confirmation.</p>
          </div>
          <div className="rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
            {format(checkIn, 'd MMM')} → {format(checkOut, 'd MMM')}
          </div>
        </div>

        <form
          className="mt-5 grid gap-4 md:grid-cols-2"
          onSubmit={form.handleSubmit((values) => {
            dispatch({ type: 'guest/set', payload: values })
          })}
        >
          <Field label="First name" error={form.formState.errors.firstName?.message}>
            <input
              className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30"
              {...form.register('firstName')}
              placeholder="Felix"
            />
          </Field>
          <Field label="Last name" error={form.formState.errors.lastName?.message}>
            <input
              className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30"
              {...form.register('lastName')}
              placeholder="Tshuma"
            />
          </Field>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <input
              className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30"
              {...form.register('email')}
              placeholder="you@example.com"
              inputMode="email"
            />
          </Field>
          <Field label="Phone" error={form.formState.errors.phone?.message}>
            <input
              className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30"
              {...form.register('phone')}
              placeholder="+263 ..."
              inputMode="tel"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Special requests (optional)" error={form.formState.errors.notes?.message}>
              <textarea
                className="min-h-24 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30"
                {...form.register('notes')}
                placeholder="Late check-in, dietary requirements, etc."
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <div className="rounded-xl border border-black/10 bg-neutral-50 p-4">
              <div className="text-sm font-semibold">Add-ons</div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-3">
                  <input
                    type="checkbox"
                    checked={state.selected?.extras.breakfast ?? true}
                    onChange={(e) =>
                      dispatch({
                        type: 'selected/set',
                        payload: {
                          ...(state.selected!),
                          extras: { ...(state.selected!.extras), breakfast: e.target.checked },
                        },
                      })
                    }
                  />
                  <div className="text-sm">
                    <div className="font-medium">Breakfast</div>
                    <div className="text-xs text-neutral-500">Per guest/night</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-3">
                  <input
                    type="checkbox"
                    checked={state.selected?.extras.airportShuttle ?? false}
                    onChange={(e) =>
                      dispatch({
                        type: 'selected/set',
                        payload: {
                          ...(state.selected!),
                          extras: { ...(state.selected!.extras), airportShuttle: e.target.checked },
                        },
                      })
                    }
                  />
                  <div className="text-sm">
                    <div className="font-medium">Airport shuttle</div>
                    <div className="text-xs text-neutral-500">One-way</div>
                  </div>
                </label>

                <label className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-white px-3 py-3">
                  <div className="text-sm">
                    <div className="font-medium">Extra bed</div>
                    <div className="text-xs text-neutral-500">Per night</div>
                  </div>
                  <select
                    className="rounded-lg border border-black/10 px-2 py-1 text-sm"
                    value={state.selected?.extras.extraBed ?? 0}
                    onChange={(e) =>
                      dispatch({
                        type: 'selected/set',
                        payload: {
                          ...(state.selected!),
                          extras: { ...(state.selected!.extras), extraBed: Number(e.target.value) },
                        },
                      })
                    }
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="rounded-xl border border-black/10 px-4 py-3 text-sm font-medium hover:bg-black/5"
              onClick={() => nav('/results')}
            >
              Back to rooms
            </button>

            <button
              type="submit"
              className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white hover:bg-black/90"
            >
              Save details
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Payment (Paynow)</div>
              <div className="mt-1 text-xs text-neutral-500">
                This prototype uses a Paynow hosted payment link (works on GitHub Pages — no backend required).
              </div>
            </div>
          </div>

          {!paymentHref ? (
            <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Add your Paynow merchant email in <span className="font-mono">VITE_PAYNOW_MERCHANT_EMAIL</span> to enable
              the “Pay with Paynow” button.
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <a
                className="rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-emerald-500"
                href={paymentHref}
                target="_blank"
                rel="noreferrer"
              >
                Pay with Paynow
              </a>
              <button
                type="button"
                className="rounded-xl border border-black/10 px-4 py-3 text-sm font-medium hover:bg-black/5"
                onClick={() => {
                  if (!state.guest) {
                    form.trigger()
                    return
                  }
                  const { reference } = confirm()
                  nav(`/confirmation?ref=${encodeURIComponent(reference)}`)
                }}
              >
                Skip payment → Confirm booking
              </button>
            </div>
          )}

          <div className="mt-3 text-xs text-neutral-500">
            Recommended flow: save guest details → open Paynow → complete payment → return and confirm booking.
          </div>
        </div>
      </section>

      <aside className="rounded-2xl border border-black/10 bg-neutral-50 p-4 md:p-6">
        <div className="text-sm font-semibold">Reservation summary</div>
        <div className="mt-3 rounded-xl border border-black/10 bg-white p-4">
          <div className="text-sm font-semibold">{selectedRoom?.name}</div>
          <div className="mt-1 text-xs text-neutral-500">
            {format(checkIn, 'EEE, d MMM')} → {format(checkOut, 'EEE, d MMM')} • {pricing.nights} night
            {pricing.nights === 1 ? '' : 's'}
          </div>
          {state.bookingRef ? (
            <div className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
              Booking ref (Paynow): <span className="font-mono">{state.bookingRef}</span>
            </div>
          ) : null}
          <div className="mt-3 space-y-2">
            {pricing.lines.map((l) => (
              <div key={l.label} className="flex items-center justify-between text-sm">
                <div className="text-neutral-700">{l.label}</div>
                <div className="font-medium">{formatMoney(l.amountCents)}</div>
              </div>
            ))}
          </div>

          <details className="mt-4 rounded-xl border border-black/10 bg-neutral-50 px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium text-neutral-800">
              Nightly breakdown
              <span className="ml-2 text-xs font-normal text-neutral-500">(varies by season/weekend)</span>
            </summary>
            <div className="mt-3 space-y-2">
              {pricing.nightly.map((n) => (
                <div key={n.date} className="flex items-center justify-between text-sm">
                  <div className="text-neutral-700">{n.label}</div>
                  <div className="font-medium">{formatMoney(n.amountCents)}</div>
                </div>
              ))}
            </div>
          </details>

          <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
            <div className="text-sm font-semibold">Total</div>
            <div className="text-lg font-semibold">{formatMoney(pricing.totalCents)}</div>
          </div>
        </div>
      </aside>
    </div>
  )
}

