'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut, Menu, X } from 'lucide-react'

import { clearTokens } from '@/lib/auth'

const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/applications', label: 'Applications' },
    { href: '/optimizer', label: 'Analyzer' },
    { href: '/resume', label: 'Resumes' },
    { href: '/copilot', label: 'Tailor' },
    { href: '/jobs', label: 'Jobs' },
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
                className="fixed top-4 left-4 z-40 p-2 md:hidden"
                onClick={() => setOpen(!open)}
                style={{ background: '#1A1A1A', color: '#FFFFFF' }}
            >
                {open ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-20 bg-black/40 md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${open ? 'open' : ''}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Logo */}
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-mark">
                            <span>J</span>
                        </div>
                        <span className="sidebar-logo-text">JOBAI</span>
                    </div>

                    {/* Navigation */}
                    <nav className="sidebar-nav">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                                >
                                    <span className="nav-label">{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    {/* User Section */}
                    <div className="sidebar-user">
                        <div className="user-avatar">
                            <span>R</span>
                        </div>
                        <span className="user-name">Raghu</span>
                        <button className="logout-btn" onClick={logout} title="Sign out">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
