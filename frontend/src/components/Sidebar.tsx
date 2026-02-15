'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
    LayoutDashboard,
    FileText,
    Briefcase,
    Sparkles,
    Scissors,
    ClipboardList,
    LogOut,
    Menu,
    X
} from 'lucide-react'

import { clearTokens } from '@/lib/auth'

const navGroups = [
    {
        title: 'Main',
        items: [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
        ]
    },
    {
        title: 'Career',
        items: [
            { href: '/resume', label: 'Resumes', icon: FileText },
            { href: '/jobs', label: 'Jobs', icon: Briefcase }
        ]
    },
    {
        title: 'AI Copilot',
        items: [
            { href: '/optimizer', label: 'Analyzer', icon: Sparkles, special: true },
            { href: '/copilot', label: 'Tailor', icon: Scissors }
        ]
    },
    {
        title: 'Tracking',
        items: [
            { href: '/applications', label: 'Applications', icon: ClipboardList }
        ]
    }
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
                className="fixed top-4 left-4 z-40 rounded-xl border bg-white/80 p-2 shadow-sm backdrop-blur-md md:hidden"
                onClick={() => setOpen(!open)}
                style={{ borderColor: '#E2E8F0' }}
            >
                {open ? <X size={20} className="text-gray-600" /> : <Menu size={20} className="text-gray-600" />}
            </button>

            {/* Overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-white/70 backdrop-blur-xl border-r border-slate-200 transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                        <span className="text-lg font-bold">J</span>
                    </div>
                    <span className="text-xl font-bold text-slate-900 tracking-tight">JobAI</span>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                    {navGroups.map((group) => (
                        <div key={group.title}>
                            <h3 className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                                {group.title}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href
                                    const Icon = item.icon

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setOpen(false)}
                                            className={`
                        group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                        ${isActive
                                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                }
                        ${item.special && !isActive ? 'hover:bg-indigo-50/50 hover:text-indigo-600' : ''}
                      `}
                                        >
                                            {/* Active Indicator Bar */}
                                            {isActive && (
                                                <div className="absolute left-0 h-8 w-1 rounded-r-lg bg-indigo-600" />
                                            )}

                                            {/* Icon */}
                                            <Icon
                                                size={20}
                                                className={`
                          ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}
                          ${item.special ? 'text-indigo-500' : ''}
                        `}
                                            />

                                            {/* Label */}
                                            <span>{item.label}</span>

                                            {/* Special Badge/Effect */}
                                            {item.special && (
                                                <div className="ml-auto flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5">
                                                    <Sparkles size={12} className="text-indigo-600" />
                                                    <span className="text-[10px] font-bold uppercase text-indigo-700">AI</span>
                                                </div>
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                        <LogOut size={20} className="text-red-500" />
                        Sign out
                    </button>
                </div>
            </aside>
        </>
    )
}
