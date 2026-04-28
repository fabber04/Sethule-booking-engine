export type PaynowKv = { key: string; value: string }

function normalizePlusToSpace(s: string) {
  // application/x-www-form-urlencoded uses + for space
  return s.replace(/\+/g, ' ')
}

export function parsePaynowBody(body: string): PaynowKv[] {
  const out: PaynowKv[] = []
  const parts = body.split('&')
  for (const p of parts) {
    if (!p) continue
    const idx = p.indexOf('=')
    if (idx === -1) {
      out.push({ key: decodeURIComponent(normalizePlusToSpace(p)), value: '' })
    } else {
      const k = decodeURIComponent(normalizePlusToSpace(p.slice(0, idx)))
      const v = decodeURIComponent(normalizePlusToSpace(p.slice(idx + 1)))
      out.push({ key: k.toLowerCase(), value: v })
    }
  }
  return out
}

export function paynowBodyToObjectLowercase(body: string) {
  const map: Record<string, string> = {}
  for (const { key, value } of parsePaynowBody(body)) map[key.toLowerCase()] = value
  return map
}

export function buildPaynowHashMaterialFromPairs(pairs: PaynowKv[]) {
  let s = ''
  for (const { key, value } of pairs) {
    if (key.toLowerCase() === 'hash') continue
    s += value ?? ''
  }
  return s
}
