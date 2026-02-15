'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'

import { Sidebar } from '@/components/Sidebar'
import { PageHeader } from '@/components/PageHeader'
import { api } from '@/lib/api'

type Resume = { id: number; title: string; created_at: string }

export default function ResumePage() {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      const res = await api.get('/api/resumes/')
      setResumes(res.data.results || [])
    } catch (err) {
      console.error('Failed to load resumes', err)
    }
  }

  useEffect(() => { load() }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!file) return
    setUploading(true)

    const resolvedTitle = title.trim() || file.name.replace(/\.[^/.]+$/, '')
    const form = new FormData()
    form.append('title', resolvedTitle)
    form.append('file', file)

    try {
      await api.post('/api/resumes/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setTitle('')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const payload = err.response?.data
      setError(payload?.detail || payload?.title?.[0] || 'Resume upload failed.')
    } finally {
      setUploading(false)
    }

    setTitle('')
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''

  }

  const deleteResume = async (id: number) => {
    try {
      await api.delete(`/api/resumes/${id}/`)
      await load()
    } catch (err) {
      console.error('Failed to delete resume', err)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content p-6 md:p-10">
        <PageHeader title="Resumes" subtitle="Upload and manage your resumes" />

        {/* Upload area */}
        <div className="panel mb-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>Upload Resume</h2>
          <form onSubmit={onSubmit}>
            <div className="upload-area mb-4" onClick={() => fileRef.current?.click()}>
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm font-medium" style={{ color: '#475569' }}>
                {file ? file.name : 'Click to select a PDF or DOCX file'}
              </p>
              <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Supports PDF, DOCX</p>
              <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Title (optional)</label>
                <input className="input" placeholder="e.g. Software Engineer Resume" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <button className="btn" type="submit" disabled={!file || uploading}>
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </button>
            </div>
            {error && <p className="mt-2 text-sm" style={{ color: '#DC2626' }}>{error}</p>}
          </form>
        </div>

        {/* Resume grid */}
        <div className="panel">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>My Resumes</h2>
          {resumes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📂</div>
              <p className="text-sm font-medium" style={{ color: '#475569' }}>No resumes uploaded yet</p>
              <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Upload your first resume to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resumes.map((r) => (
                <div key={r.id} className="rounded-xl border p-4 hover:shadow-md transition-shadow" style={{ borderColor: '#E2E8F0' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: '#EEF2FF' }}>
                      <span className="text-lg">📄</span>
                    </div>
                    <button className="btn-danger text-xs" onClick={() => deleteResume(r.id)}>Delete</button>
                  </div>
                  <p className="text-sm font-semibold truncate" style={{ color: '#0F172A' }}>{r.title}</p>
                  <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Uploaded {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
