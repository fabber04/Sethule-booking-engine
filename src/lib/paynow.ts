function base64UrlEncode(input: string) {
  // Paynow docs recommend URL safe Base64 encoding.
  // We avoid Unicode issues by encoding as UTF-8 first.
  const utf8 = new TextEncoder().encode(input)
  let binary = ''
  for (const b of utf8) binary += String.fromCharCode(b)
  const b64 = btoa(binary)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function buildPaynowLink(opts: {
  merchantEmail: string
  amount: string // "99.99"
  reference: string
  customerEmail?: string
  locked?: boolean
  additionalInfo?: string
}) {
  const params = new URLSearchParams()
  params.set('search', opts.merchantEmail)
  params.set('amount', opts.amount)
  params.set('reference', opts.reference)
  if (opts.locked) params.set('l', '1')
  if (opts.additionalInfo) params.set('additionalinfo', opts.additionalInfo)

  const q = base64UrlEncode(params.toString())
  const customerPart = opts.customerEmail ? `/${encodeURIComponent(opts.customerEmail)}` : ''
  return `https://www.paynow.co.zw/payment/link${customerPart}?q=${encodeURIComponent(q)}`
}

