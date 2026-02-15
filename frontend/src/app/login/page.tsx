'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { api } from '@/lib/api'
import { setTokens } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await api.post('/api/token/', { login, password })
      setTokens(res.data.access, res.data.refresh)
      router.push('/dashboard')
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError('Invalid credentials. Please check your email and password.')
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)' }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold" style={{ background: 'rgba(255,255,255,0.2)', color: '#FFF' }}>
            J
          </div>
          <span className="text-2xl font-bold text-white">JobAI</span>
        </div>
        <h2 className="text-4xl font-bold text-white leading-tight mb-4">
          Land your dream job<br />with AI precision.
        </h2>
        <p className="text-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Upload your resume, analyze job matches, and generate tailored applications — all powered by AI.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12" style={{ background: '#F8FAFC' }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: '#4F46E5' }}>
              J
            </div>
            <span className="text-lg font-bold" style={{ color: '#0F172A' }}>JobAI</span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: '#0F172A' }}>Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: '#64748B' }}>Sign in to your account to continue</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Email or username</label>
              <input
                className="input"
                placeholder="you@example.com"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2 text-sm" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                {error}
              </div>
            )}

            <button className="btn w-full" type="submit">Sign in</button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#64748B' }}>
            Don&apos;t have an account?{' '}
            <Link className="font-medium hover:underline" href="/signup" style={{ color: '#4F46E5' }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
