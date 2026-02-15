'use client'

import Cookies from 'js-cookie'

const ACCESS = 'accessToken'
const REFRESH = 'refreshToken'

export function setTokens(access: string, refresh: string): void {
  Cookies.set(ACCESS, access, { expires: 1, sameSite: 'lax' })
  Cookies.set(REFRESH, refresh, { expires: 14, sameSite: 'lax' })
}

export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS)
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH)
}

export function clearTokens(): void {
  Cookies.remove(ACCESS)
  Cookies.remove(REFRESH)
}
