'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { Download, Plus, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

import { Sidebar } from '@/components/Sidebar'
import { api, AnalysisResult } from '@/lib/api'

type Resume = { id: number; title: string; created_at: string }
type Job = { id: number; company: string; role: string }
type App = { id: number; company: string; role: string; status: string; match_score?: number; applied_date?: string }

// Get Monday of the week containing `date`
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const startMonth = weekStart.toLocaleString('en-US', { month: 'short' })
  const endMonth = end.toLocaleString('en-US', { month: 'short' })
  if (startMonth === endMonth) {
    return `${startMonth} ${weekStart.getDate()}–${end.getDate()}`
  }
  return `${startMonth} ${weekStart.getDate()} – ${endMonth} ${end.getDate()}`
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week, -1 = last week, etc.
  const fileRef = useRef<HTMLInputElement>(null)

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
      await api.post('/api/resumes/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUploadTitle('')
      if (fileRef.current) fileRef.current.value = ''
      await loadData()
    } catch (err) { console.error('Upload failed', err) }
    finally { setUploading(false) }
  }

  const startEdit = (r: Resume) => { setEditingId(r.id); setEditTitle(r.title) }
  const saveEdit = async (id: number) => {
    try { await api.patch(`/api/resumes/${id}/`, { title: editTitle }); setEditingId(null); await loadData() }
    catch (err) { console.error('Failed to save edit', err) }
  }
  const deleteResume = async (id: number) => {
    try { await api.delete(`/api/resumes/${id}/`); setConfirmingDeleteId(null); await loadData() }
    catch (err) { console.error('Failed to delete resume', err) }
  }
  const deleteAnalysis = async (id: number) => {
    if (!confirm('Delete this analysis?')) return
    try { await api.delete(`/api/analysis-results/${id}/`); setAnalyses(prev => prev.filter(a => a.id !== id)) }
    catch (err) { console.error('Failed to delete analysis', err) }
  }

  const interviews = apps.filter(a => a.status === 'interview').length
  const offers = apps.filter(a => a.status === 'offer').length

  // Weekly chart based on real data
  const selectedWeekStart = useMemo(() => {
    const now = new Date()
    const start = getWeekStart(now)
    start.setDate(start.getDate() + weekOffset * 7)
    return start
  }, [weekOffset])

  const weeklyData = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0] // Mon–Sun
    apps.forEach(app => {
      if (!app.applied_date) return
      const appDate = new Date(app.applied_date + 'T00:00:00')
      const daysDiff = Math.floor((appDate.getTime() - selectedWeekStart.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff >= 0 && daysDiff < 7) {
        counts[daysDiff]++
      }
    })
    return counts
  }, [apps, selectedWeekStart])

  const maxBar = Math.max(...weeklyData, 1) // at least 1 to avoid division by zero

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'interview': return <span className="status-badge filled">Interview</span>
      case 'offer': return <span className="status-badge filled">Offer</span>
      case 'rejected': return <span className="status-badge danger">Rejected</span>
      default: return <span className="status-badge outlined">Applied</span>
    }
  }

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'score-high'
    if (score >= 60) return 'score-mid'
    return 'score-low'
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-export">
              <Download size={14} />
              <span>Export</span>
            </button>
            <Link href="/applications" className="btn-primary" style={{ textDecoration: 'none' }}>
              <Plus size={14} />
              <span>New Application</span>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="metrics-row">
          <div className="metric-card hero">
            <div className="metric-footer">
              <span className="metric-label">Total Applied</span>
            </div>
            <div className="metric-value">{apps.length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-footer">
              <span className="metric-label">Interviews</span>
            </div>
            <div className="metric-value">{interviews}</div>
          </div>
          <div className="metric-card">
            <div className="metric-footer">
              <span className="metric-label">Resumes</span>
            </div>
            <div className="metric-value">{resumes.length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-footer">
              <span className="metric-label">Offers</span>
            </div>
            <div className="metric-value">{offers}</div>
          </div>
        </div>

        {/* Bottom Row: Chart + Table */}
        <div className="bottom-row">
          {/* Weekly Applications Chart */}
          <div className="chart-section">
            <div className="chart-header">
              <h2 className="chart-title">Weekly Applications</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setWeekOffset(prev => prev - 1)}
                  style={{
                    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #E0E0E0', background: 'transparent', cursor: 'pointer'
                  }}
                >
                  <ChevronLeft size={18} color="#999" />
                </button>
                <span className="chart-period">{formatWeekRange(selectedWeekStart)}</span>
                <button
                  onClick={() => setWeekOffset(prev => Math.min(prev + 1, 0))}
                  disabled={weekOffset >= 0}
                  style={{
                    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: weekOffset >= 0 ? '#F5F5F5' : '#0A0A0A', border: weekOffset >= 0 ? '1px solid #E0E0E0' : 'none',
                    cursor: weekOffset >= 0 ? 'not-allowed' : 'pointer', opacity: weekOffset >= 0 ? 0.5 : 1
                  }}
                >
                  <ChevronRight size={18} color={weekOffset >= 0 ? '#999' : '#FFF'} />
                </button>
              </div>
            </div>
            <div className="chart-area">
              {DAY_LABELS.map((day, i) => (
                <div key={day} className="chart-bar">
                  <div
                    className="bar-fill"
                    style={{ height: weeklyData[i] > 0 ? `${(weeklyData[i] / maxBar) * 100}%` : '4px', opacity: weeklyData[i] > 0 ? 1 : 0.2 }}
                  />
                  <span className="bar-label">{day}</span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '13px', color: '#999' }}>
              {weeklyData.reduce((a, b) => a + b, 0)} applications this week
            </div>
          </div>

          {/* Recent Applications Table */}
          <div className="table-section">
            <div className="table-section-header">
              <h2 className="table-section-title">Recent Applications</h2>
              <Link href="/applications" className="view-all-link">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {apps.length > 0 ? (
                  apps.slice(0, 5).map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 500 }}>{app.company}</td>
                      <td>{app.role}</td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td className={getScoreClass(app.match_score || 0)}>
                        {app.match_score || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#999', padding: '40px 24px' }}>
                      No applications yet. Click &quot;New Application&quot; to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Resume Section */}
        <div className="panel" style={{ marginTop: '40px' }}>
          <h2>Upload Resume</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: '#777' }}>
                Title (optional)
              </label>
              <input className="input" placeholder="e.g. Software Engineer Resume" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: '#777' }}>
                File
              </label>
              <input className="input" type="file" accept=".pdf,.docx" ref={fileRef} />
            </div>
            <button className="btn" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>

        {/* My Resumes */}
        <div className="panel">
          <h2>My Resumes</h2>
          {resumes.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#999' }}>No resumes uploaded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {resumes.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #E0E0E0', padding: '12px 16px' }}>
                  {editingId === r.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ maxWidth: 300 }} />
                      <button className="btn" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => saveEdit(r.id)}>Save</button>
                      <button className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px', color: '#0A0A0A' }}>{r.title}</p>
                        <p style={{ fontSize: '11px', color: '#999' }}>{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => startEdit(r)}>Rename</button>
                        {confirmingDeleteId === r.id ? (
                          <>
                            <button className="btn-danger" onClick={() => deleteResume(r.id)}>Confirm</button>
                            <button className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => setConfirmingDeleteId(null)}>Cancel</button>
                          </>
                        ) : (
                          <button className="btn-danger" onClick={() => setConfirmingDeleteId(r.id)}>Delete</button>
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
        <div className="panel">
          <h2>Past Analyses</h2>
          {analyses.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#999' }}>No analyses run yet. Go to Analyzer to start.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {analyses.slice(0, 5).map((a) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #E0E0E0', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700,
                      border: '1px solid #E0E0E0',
                      color: a.match_score >= 75 ? '#22C55E' : a.match_score >= 50 ? '#999' : '#FF3B30'
                    }}>
                      {a.match_score}%
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px' }}>{a.job_title}</p>
                      <p style={{ fontSize: '13px', color: '#777' }}>{a.company} • {new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => setViewingAnalysis(a)}>View</button>
                    <button className="btn-danger" onClick={() => deleteAnalysis(a.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analysis Details Modal */}
        {viewingAnalysis && (
          <div className="modal-overlay" onClick={() => setViewingAnalysis(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>{viewingAnalysis.job_title} at {viewingAnalysis.company}</h3>
                  <p>Analysis from {new Date(viewingAnalysis.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => setViewingAnalysis(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#999' }}>✕</button>
              </div>
              <div className="modal-body">
                <div className="score-display">
                  <div className="score-circle" style={{
                    color: viewingAnalysis.match_score >= 75 ? '#22C55E' : viewingAnalysis.match_score >= 50 ? '#999' : '#FF3B30'
                  }}>
                    {viewingAnalysis.match_score}%
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Match Score</p>
                    <p style={{ fontSize: '13px', color: '#777' }}>
                      {viewingAnalysis.match_score >= 75 ? 'Strong match! Resume aligns well.' :
                        viewingAnalysis.match_score >= 50 ? 'Decent match, room for improvement.' :
                          'Low match. Consider significant tailoring.'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>Matched Keywords</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {viewingAnalysis.matched_keywords?.length > 0
                        ? viewingAnalysis.matched_keywords.map((kw, i) => <span key={i} className="keyword-tag green">{kw}</span>)
                        : <p style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>None matched.</p>}
                    </div>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>Missing Keywords</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {viewingAnalysis.missing_keywords?.length > 0
                        ? viewingAnalysis.missing_keywords.map((kw, i) => <span key={i} className="keyword-tag red">{kw}</span>)
                        : <p style={{ fontSize: '12px', color: '#22C55E', fontStyle: 'italic' }}>No keywords missing!</p>}
                    </div>
                  </div>
                </div>

                {viewingAnalysis.improvement_suggestions?.length > 0 && (
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>AI Suggestions</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {viewingAnalysis.improvement_suggestions.map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '14px', color: '#666', padding: '12px 16px', background: '#F5F5F5', border: '1px solid #E0E0E0' }}>
                          <span style={{ color: '#FF3B30', fontWeight: 700 }}>•</span>
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setViewingAnalysis(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
