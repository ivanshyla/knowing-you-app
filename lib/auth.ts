import { randomUUID } from 'crypto'
import type { NextRequest } from 'next/server'

export const USER_COOKIE = 'kykm_uid'

export function getUserIdFromRequest(request: NextRequest): string | null {
  return request.cookies.get(USER_COOKIE)?.value ?? null
}

export function createUserId(): string {
  return randomUUID()
}


