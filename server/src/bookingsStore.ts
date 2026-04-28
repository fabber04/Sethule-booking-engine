import fs from 'node:fs/promises'
import path from 'node:path'

export type BookingPaymentRecord = {
  reference: string
  amount: string
  authemail?: string
  pollUrl?: string
  browserUrl?: string
  lastCallback?: string
  lastPoll?: string
}

const filePath = path.join(process.cwd(), 'data', 'booking-payments.json')

async function ensureDir() {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}

export async function loadStore(): Promise<Record<string, BookingPaymentRecord>> {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw) as Record<string, BookingPaymentRecord>
  } catch {
    return {}
  }
}

export async function upsertBooking(patch: BookingPaymentRecord) {
  await ensureDir()
  const store = await loadStore()
  const prev = store[patch.reference] ?? { reference: patch.reference, amount: patch.amount }
  store[patch.reference] = { ...prev, ...patch }
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), 'utf8')
}
