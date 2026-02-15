'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

import { clearTokens } from '@/lib/auth'

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/resume', label: 'Resumes', icon: '📄' },
    { href: '/jobs', label: 'Jobs', icon: '💼' },
    { href: '/optimizer', label: 'Analyzer', icon: '🔍' },
    { href: '/copilot', label: 'Tailor', icon: '✂️' },
    { href: '/applications', label: 'Applications', icon: '📋' },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [open, setOpen] = useState(false)

    const logout = () => {
        clearTokens()
        router.push('/login')
    }

    return (
        <>
            {/* Mobile toggle */}
            <button
                className="fixed top-4 left-4 z-40 rounded-lg border bg-white p-2 shadow-md md:hidden"
                onClick={() => setOpen(!open)}
                style={{ borderColor: '#E2E8F0' }}
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 5h14M3 10h14M3 15h14" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </button>

            {/* Overlay */}
            {open && (
                <div className="fixed inset-0 z-20 bg-black/20 md:hidden" onClick={() => setOpen(false)} />
            )}

            <aside className={`sidebar ${open ? 'open' : ''}`}>
                {/* Logo */}
                <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: '#E2E8F0' }}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: '#4F46E5' }}>
                        J
                    </div>
                    <span className="text-lg font-bold" style={{ color: '#0F172A' }}>JobAI</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                            onClick={() => setOpen(false)}
                        >
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-3 py-4 border-t" style={{ borderColor: '#E2E8F0' }}>
                    <button
                        onClick={logout}
                        className="sidebar-link w-full text-left"
                        style={{ color: '#DC2626' }}
                    >
                        <span className="text-base">🚪</span>
                        Log out
                    </button>
                </div>
            </aside>
        </>
    )
}
