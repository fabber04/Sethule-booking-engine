import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { z } from 'zod'

import { sha512UpperHex } from './paynow/crypto.js'
import { buildPaynowHashMaterialFromPairs, parsePaynowBody, paynowBodyToObjectLowercase } from './paynow/message.js'
import { upsertBooking } from './bookingsStore.js'

dotenv.config()

const PAYNOW_INTEGRATION_ID = (process.env.PAYNOW_INTEGRATION_ID ?? '').trim()
const PAYNOW_INTEGRATION_KEY = (process.env.PAYNOW_INTEGRATION_KEY ?? '').trim()
const PAYNOW_INIT_URL = (process.env.PAYNOW_INIT_URL ?? 'https://www.paynow.co.zw/interface/initiatetransaction').trim()

const PUBLIC_APP_ORIGIN = (process.env.PUBLIC_APP_ORIGIN ?? 'http://localhost:5173').replace(/\/$/, '')
const PUBLIC_API_ORIGIN = (process.env.PUBLIC_API_ORIGIN ?? 'http://localhost:8787').replace(/\/$/, '')

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

function assertPaynowEnv() {
  if (!PAYNOW_INTEGRATION_ID || !PAYNOW_INTEGRATION_KEY) {
    throw new Error('Missing PAYNOW_INTEGRATION_ID / PAYNOW_INTEGRATION_KEY in server/.env')
  }
}

function verifyInboundHash(body: string, integrationKey: string) {
  const pairs = parsePaynowBody(body)
  const provided = pairs.find((p) => p.key.toLowerCase() === 'hash')?.value
  if (!provided) return { ok: false as const, reason: 'missing_hash' }

  const material = buildPaynowHashMaterialFromPairs(pairs) + integrationKey
  const expected = sha512UpperHex(material)
  return { ok: expected === provided, expected, provided }
}

const initSchema = z.object({
  reference: z.string().min(3),
  amount: z.string().regex(/^\d+(\.\d{2})$/),
  authemail: z.string().email().optional(),
  authphone: z.string().min(6).optional(),
  authname: z.string().min(2).optional(),
  additionalinfo: z.string().max(120).optional(),
})

app.post('/api/paynow/init', async (req, res) => {
  try {
    assertPaynowEnv()
    const body = initSchema.parse(req.body)

    const returnUrl = `${PUBLIC_APP_ORIGIN}/confirmation?ref=${encodeURIComponent(body.reference)}`
    const resultUrl = `${PUBLIC_API_ORIGIN}/api/paynow/callback?ref=${encodeURIComponent(body.reference)}`

    const id = Number(PAYNOW_INTEGRATION_ID)
    if (!Number.isFinite(id)) throw new Error('PAYNOW_INTEGRATION_ID must be an integer')

    const pairs = [
      { key: 'id', value: String(id) },
      { key: 'reference', value: body.reference },
      { key: 'amount', value: body.amount },
      ...(body.additionalinfo ? [{ key: 'additionalinfo', value: body.additionalinfo }] : []),
      { key: 'returnurl', value: returnUrl },
      { key: 'resulturl', value: resultUrl },
      ...(body.authemail ? [{ key: 'authemail', value: body.authemail }] : []),
      ...(body.authphone ? [{ key: 'authphone', value: body.authphone }] : []),
      ...(body.authname ? [{ key: 'authname', value: body.authname }] : []),
      { key: 'status', value: 'Message' },
    ]

    const material = buildPaynowHashMaterialFromPairs(pairs) + PAYNOW_INTEGRATION_KEY
    const hash = sha512UpperHex(material)

    const postBody = new URLSearchParams()
    for (const p of pairs) postBody.append(p.key, p.value)
    postBody.append('hash', hash)

    const paynowResp = await fetch(PAYNOW_INIT_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: postBody.toString(),
    })

    const text = await paynowResp.text()
    const verified = verifyInboundHash(text, PAYNOW_INTEGRATION_KEY)
    if (!verified.ok) {
      res.status(502).json({ ok: false, error: 'Invalid Paynow response hash', debug: { text } })
      return
    }

    const map = paynowBodyToObjectLowercase(text)
    const status = (map.status ?? '').toLowerCase()

    if (status === 'error') {
      res.status(400).json({ ok: false, error: map.error ?? 'Paynow rejected initiate request', raw: text })
      return
    }

    if (status !== 'ok') {
      res.status(502).json({ ok: false, error: `Unexpected Paynow status: ${map.status ?? 'unknown'}`, raw: text })
      return
    }

    const browserUrl = map.browserurl
    const pollUrl = map.pollurl
    if (!browserUrl || !pollUrl) {
      res.status(502).json({ ok: false, error: 'Missing browserurl/pollurl in Paynow response', raw: text })
      return
    }

    await upsertBooking({
      reference: body.reference,
      amount: body.amount,
      authemail: body.authemail,
      pollUrl,
      browserUrl,
    })

    res.json({ ok: true, browserUrl, pollUrl })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    res.status(400).json({ ok: false, error: msg })
  }
})

app.post(
  '/api/paynow/callback',
  express.raw({
    type: ['application/x-www-form-urlencoded', 'application/json', 'text/plain', '*/*'],
    limit: '1mb',
  }),
  async (req, res) => {
    try {
      assertPaynowEnv()
      const ref = typeof req.query.ref === 'string' ? req.query.ref : ''

      const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body ?? '')

      const verified = verifyInboundHash(raw, PAYNOW_INTEGRATION_KEY)
      if (!verified.ok) {
        res.status(400).send('invalid hash')
        return
      }

      if (ref) {
        await upsertBooking({ reference: ref, amount: '', lastCallback: raw })
      }

      res.status(200).send('OK')
    } catch {
      res.status(500).send('ERROR')
    }
  },
)

const pollSchema = z.object({
  pollUrl: z.string().url(),
})

app.post('/api/paynow/poll', async (req, res) => {
  try {
    assertPaynowEnv()
    const { pollUrl } = pollSchema.parse(req.body)
    const r = await fetch(pollUrl, { method: 'GET' })
    const text = await r.text()
    const verified = verifyInboundHash(text, PAYNOW_INTEGRATION_KEY)
    if (!verified.ok) {
      res.status(502).json({ ok: false, error: 'Invalid Paynow poll hash', raw: text })
      return
    }
    res.json({ ok: true, raw: text, map: paynowBodyToObjectLowercase(text) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    res.status(400).json({ ok: false, error: msg })
  }
})

const port = Number(process.env.PORT ?? '8787')
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
