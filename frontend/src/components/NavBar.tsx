'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { clearTokens } from '@/lib/auth'

export function NavBar() {
  const router = useRouter()

  const logout = () => {
    clearTokens()
    router.push('/login')
  }

  return (
    <nav className="mb-6 flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-sm">
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/optimizer">Analyzer</Link>
      <Link href="/applications">Applications</Link>
      <Link href="/copilot">Tailor</Link>
      <button onClick={logout} className="ml-auto rounded bg-red-500 px-3 py-1 text-black">
        Logout
      </button>
    </nav>
  )
}
