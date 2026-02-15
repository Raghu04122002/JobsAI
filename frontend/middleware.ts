import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard', '/resume', '/jobs', '/applications', '/copilot', '/optimizer']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!isProtected) return NextResponse.next()

  const token = request.cookies.get('accessToken')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/resume/:path*', '/jobs/:path*', '/applications/:path*', '/copilot/:path*', '/optimizer/:path*'],
}
