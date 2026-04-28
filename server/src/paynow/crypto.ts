import crypto from 'node:crypto'

export function sha512UpperHex(input: string) {
  return crypto.createHash('sha512').update(input, 'utf8').digest('hex').toUpperCase()
}
