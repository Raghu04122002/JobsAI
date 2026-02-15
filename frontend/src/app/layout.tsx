import './globals.css'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JobAI — AI-Powered Career Assistant',
  description: 'Upload your resume, analyze job matches, and tailor your applications with AI.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
