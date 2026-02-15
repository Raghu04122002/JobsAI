'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { API_BASE_URL } from '@/lib/config'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    const res = await fetch(`${API_BASE_URL}/auth/signup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password, confirm_password: confirmPassword }),
    })

    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      setError(payload?.email?.[0] || payload?.username?.[0] || payload?.password?.[0] || 'Signup failed. Please try again.')
      return
    }

    router.push('/login')
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
          Your AI-powered<br />career assistant.
        </h2>
        <p className="text-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Join thousands of job seekers using AI to land their dream role, faster.
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

          <h1 className="text-2xl font-bold mb-1" style={{ color: '#0F172A' }}>Create your account</h1>
          <p className="text-sm mb-8" style={{ color: '#64748B' }}>Start tailoring your career with AI</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Email</label>
              <input className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Username</label>
              <input className="input" placeholder="johndoe" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Password</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Confirm password</label>
              <input className="input" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2 text-sm" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                {error}
              </div>
            )}

            <button className="btn w-full" type="submit">Create account</button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: '#64748B' }}>
            Already have an account?{' '}
            <Link className="font-medium hover:underline" href="/login" style={{ color: '#4F46E5' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
