'use client'

import { useEffect, useRef, useState } from 'react'

import { Sidebar } from '@/components/Sidebar'
import { PageHeader } from '@/components/PageHeader'
// ... existing imports
import { api, AnalysisResult } from '@/lib/api'

type Resume = { id: number; title: string; created_at: string }
type Job = { id: number; company: string; role: string }
type App = { id: number; company: string; role: string; status: string }

export default function DashboardPage() {
  const [apps, setApps] = useState<App[]>([])
  const [resumes, setResumes] = useState<Resume[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([])

  const [uploadTitle, setUploadTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null)
  const [viewingAnalysis, setViewingAnalysis] = useState<AnalysisResult | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)



  // ... existing methods ...

  const deleteAnalysis = async (id: number) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return
    try {
      await api.delete(`/api/analysis-results/${id}/`)
      setAnalyses(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('Failed to delete analysis', err)
    }
  }

  const loadData = async () => {
    try {
      const [aRes, rRes, jRes, anRes] = await Promise.all([
        api.get('/api/applications/'),
        api.get('/api/resumes/'),
        api.get('/api/jobs/'),
        api.get('/api/analysis-results/'),
      ])

      setApps(aRes.data.results || [])
      setResumes(rRes.data.results || [])
      setJobs(jRes.data.results || [])
      setAnalyses(anRes.data.results || [])
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

        {/* Past Analyses */}
        <div className="panel mb-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>Past Analyses</h2>
          {analyses.length === 0 ? (
            <p className="text-sm" style={{ color: '#94A3B8' }}>No analyses run yet. Go to Optimizer to start.</p>
          ) : (
            <div className="space-y-3">
              {analyses.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border px-4 py-3 bg-white hover:bg-slate-50 transition-colors" style={{ borderColor: '#E2E8F0' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm"
                      style={{
                        background: a.match_score >= 75 ? '#DCFCE7' : a.match_score >= 50 ? '#FEF3C7' : '#FEE2E2',
                        color: a.match_score >= 75 ? '#16A34A' : a.match_score >= 50 ? '#D97706' : '#DC2626'
                      }}>
                      {a.match_score}%
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#0F172A' }}>{a.job_title}</p>
                      <p className="text-xs" style={{ color: '#94A3B8' }}>{a.company} • {new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingAnalysis(a)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <span className="text-lg">👁️</span>
                    </button>
                    <button
                      onClick={() => deleteAnalysis(a.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Analysis"
                    >
                      <span className="text-lg">🗑️</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analysis Details Modal */}
        {viewingAnalysis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setViewingAnalysis(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{viewingAnalysis.job_title} at {viewingAnalysis.company}</h3>
                  <p className="text-sm text-slate-500">Analysis from {new Date(viewingAnalysis.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => setViewingAnalysis(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <span className="text-xl">✕</span>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-6">

                {/* Score */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold bg-white shadow-sm"
                    style={{
                      color: viewingAnalysis.match_score >= 75 ? '#16A34A' : viewingAnalysis.match_score >= 50 ? '#D97706' : '#DC2626'
                    }}>
                    {viewingAnalysis.match_score}%
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Match Score</h4>
                    <p className="text-sm text-slate-600">
                      {viewingAnalysis.match_score >= 75 ? 'Strong match! Your resume is well-aligned.' :
                        viewingAnalysis.match_score >= 50 ? 'Decent match, but room for improvement.' :
                          'Low match. Consider significant tailoring.'}
                    </p>
                  </div>
                </div>

                {/* Keywords Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" /> Matched Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {viewingAnalysis.matched_keywords?.length > 0 ? (
                        viewingAnalysis.matched_keywords.map((kw, i) => (
                          <span key={i} className="px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                            {kw}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No specific keywords matched.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" /> Missing Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {viewingAnalysis.missing_keywords?.length > 0 ? (
                        viewingAnalysis.missing_keywords.map((kw, i) => (
                          <span key={i} className="px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                            {kw}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-green-600 italic">Great job! No major keywords missing.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                {viewingAnalysis.improvement_suggestions?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">AI Suggestions</h4>
                    <ul className="space-y-2">
                      {viewingAnalysis.improvement_suggestions.map((s, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-indigo-500 font-bold">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={() => setViewingAnalysis(null)} className="btn-secondary">
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

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
