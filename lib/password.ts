import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 32)
  return { salt, hash: derived.toString('hex') }
}

export function verifyPassword(password: string, salt: string, expectedHashHex: string): boolean {
  const derived = scryptSync(password, salt, 32)
  const expected = Buffer.from(expectedHashHex, 'hex')
  if (expected.length !== derived.length) return false
  return timingSafeEqual(expected, derived)
}



