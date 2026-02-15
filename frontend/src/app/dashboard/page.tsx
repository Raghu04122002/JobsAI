'use client'

import { useEffect, useRef, useState } from 'react'

import { Sidebar } from '@/components/Sidebar'
import { PageHeader } from '@/components/PageHeader'
import { api } from '@/lib/api'

type Resume = { id: number; title: string; created_at: string }
type Job = { id: number; company: string; role: string }
type App = { id: number; company: string; role: string; status: string }

export default function DashboardPage() {
  const [apps, setApps] = useState<App[]>([])
  const [resumes, setResumes] = useState<Resume[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    try {
      const [aRes, rRes, jRes] = await Promise.all([
        api.get('/api/applications/'),
        api.get('/api/resumes/'),
        api.get('/api/jobs/'),
      ])

      setApps(aRes.data.results || [])
      setResumes(rRes.data.results || [])
      setJobs(jRes.data.results || [])
    } catch (err) {
      console.error('Failed to load dashboard data', err)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('title', uploadTitle.trim() || file.name.replace(/\.[^/.]+$/, ''))
    form.append('file', file)

    try {
      await api.post('/api/resumes/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploadTitle('')
      if (fileRef.current) fileRef.current.value = ''
      await loadData()
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  const startEdit = (r: Resume) => { setEditingId(r.id); setEditTitle(r.title) }

  const saveEdit = async (id: number) => {
    try {
      await api.patch(`/api/resumes/${id}/`, { title: editTitle })
      setEditingId(null)
      await loadData()
    } catch (err) {
      console.error('Failed to save edit', err)
    }
  }

  const deleteResume = async (id: number) => {
    try {
      await api.delete(`/api/resumes/${id}/`)
      setConfirmingDeleteId(null)
      await loadData()
    } catch (err) {
      console.error('Failed to delete resume', err)
    }
  }

  const interviews = apps.filter(a => a.status === 'interview').length
  const offers = apps.filter(a => a.status === 'offer').length

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content p-6 md:p-10">
        <PageHeader title="Dashboard" subtitle="Your career overview at a glance" />

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: '#EEF2FF' }}>
                <span className="text-lg">📋</span>
              </div>
              <div>
                <p className="stat-value">{apps.length}</p>
                <p className="stat-label">Applications</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: '#FFFBEB' }}>
                <span className="text-lg">🎯</span>
              </div>
              <div>
                <p className="stat-value">{interviews}</p>
                <p className="stat-label">Interviews</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: '#F0FDF4' }}>
                <span className="text-lg">🏆</span>
              </div>
              <div>
                <p className="stat-value">{offers}</p>
                <p className="stat-label">Offers</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: '#EFF6FF' }}>
                <span className="text-lg">📄</span>
              </div>
              <div>
                <p className="stat-value">{resumes.length}</p>
                <p className="stat-label">Resumes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Resume */}
        <div className="panel mb-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>Upload Resume</h2>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Title (optional)</label>
              <input className="input" placeholder="e.g. Software Engineer Resume" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>File</label>
              <input className="input" type="file" accept=".pdf,.docx" ref={fileRef} />
            </div>
            <button className="btn" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>

        {/* Resumes List */}
        <div className="panel mb-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>My Resumes</h2>
          {resumes.length === 0 ? (
            <p className="text-sm" style={{ color: '#94A3B8' }}>No resumes uploaded yet. Upload your first resume above.</p>
          ) : (
            <div className="space-y-3">
              {resumes.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border px-4 py-3" style={{ borderColor: '#E2E8F0' }}>
                  {editingId === r.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ maxWidth: 300 }} />
                      <button className="btn text-xs" onClick={() => saveEdit(r.id)}>Save</button>
                      <button className="btn-secondary text-xs" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{r.title}</p>
                        <p className="text-xs" style={{ color: '#94A3B8' }}>{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="btn-secondary text-xs" onClick={() => startEdit(r)}>Rename</button>
                        {confirmingDeleteId === r.id ? (
                          <>
                            <button className="btn-danger text-xs" onClick={() => deleteResume(r.id)}>Confirm</button>
                            <button className="btn-secondary text-xs" onClick={() => setConfirmingDeleteId(null)}>Cancel</button>
                          </>
                        ) : (
                          <button className="btn-danger text-xs" onClick={() => setConfirmingDeleteId(r.id)}>Delete</button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Jobs */}
        <div className="panel">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>Recent Jobs</h2>
          {jobs.length === 0 ? (
            <p className="text-sm" style={{ color: '#94A3B8' }}>No jobs saved yet.</p>
          ) : (
            <div className="space-y-2">
              {jobs.slice(0, 5).map((j) => (
                <div key={j.id} className="flex items-center gap-3 rounded-lg border px-4 py-3" style={{ borderColor: '#E2E8F0' }}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                    {j.company.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{j.role}</p>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>{j.company}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
