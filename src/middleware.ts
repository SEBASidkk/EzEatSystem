import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const ADMIN_ONLY = ['/accounts', '/audit']
const PUBLIC = ['/login']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    if (session) return NextResponse.redirect(new URL('/dashboard', req.url))
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = (session.user as Record<string, unknown>)?.role as string | undefined
  if (ADMIN_ONLY.some((p) => pathname.startsWith(p)) && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
