'use client'

import { FormEvent, useEffect, useState } from 'react'

import { Sidebar } from '@/components/Sidebar'
import { PageHeader } from '@/components/PageHeader'
import { api } from '@/lib/api'

type Application = {
  id: number
  company: string
  role: string
  status: string
  applied_date: string
  match_score: number
  job_link: string
  notes: string
}

const statuses = ['APPLIED', 'INTERVIEW', 'REJECTED', 'OFFER']

const statusBadge: Record<string, string> = {
  APPLIED: 'badge-blue',
  INTERVIEW: 'badge-yellow',
  REJECTED: 'badge-red',
  OFFER: 'badge-green',
}

export default function ApplicationsPage() {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('APPLIED')
  const [appliedDate, setAppliedDate] = useState('')
  const [matchScore, setMatchScore] = useState('')
  const [jobLink, setJobLink] = useState('')
  const [notes, setNotes] = useState('')
  const [applications, setApplications] = useState<Application[]>([])
  const [showForm, setShowForm] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editCompany, setEditCompany] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editStatus, setEditStatus] = useState('APPLIED')
  const [editAppliedDate, setEditAppliedDate] = useState('')
  const [editMatchScore, setEditMatchScore] = useState('')
  const [editJobLink, setEditJobLink] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null)

  const load = async () => {
    try {
      const res = await api.get('/api/applications/')
      setApplications(res.data.results || [])
    } catch (err) {
      console.error('Failed to load applications', err)
    }
  }

  useEffect(() => { load() }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/api/applications/', {
        company, role, status, applied_date: appliedDate, notes,
        match_score: matchScore ? parseInt(matchScore) : 0,
        job_link: jobLink
      })
      setCompany('')
      setRole('')
      setStatus('APPLIED')
      setAppliedDate('')
      setMatchScore('')
      setJobLink('')
      setNotes('')
      setShowForm(false)
      await load()
    } catch (err) {
      console.error('Failed to create application', err)
    }
  }

  const startEdit = (app: Application) => {
    setEditingId(app.id)
    setEditCompany(app.company)
    setEditRole(app.role)
    setEditStatus(app.status)
    setEditAppliedDate(app.applied_date)
    setEditMatchScore(app.match_score.toString())
    setEditJobLink(app.job_link)
    setEditNotes(app.notes)
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (id: number) => {
    try {
      await api.put(`/api/applications/${id}/`, {
        company: editCompany,
        role: editRole,
        status: editStatus,
        applied_date: editAppliedDate,
        match_score: editMatchScore ? parseInt(editMatchScore) : 0,
        job_link: editJobLink,
        notes: editNotes,
      })
      setEditingId(null)
      await load()
    } catch (err) {
      console.error('Failed to save application', err)
    }
  }

  const deleteApplication = async (id: number) => {
    try {
      await api.delete(`/api/applications/${id}/`)
      setConfirmingDeleteId(null)
      await load()
    } catch (err) {
      console.error('Failed to delete application', err)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content p-6 md:p-10">
        <PageHeader title="Applications" subtitle="Track your job applications">
          <button className="btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Application'}
          </button>
        </PageHeader>

        {/* Add form */}
        {showForm && (
          <div className="panel mb-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>New Application</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Company</label>
                  <input className="input" placeholder="e.g. Google" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Role</label>
                  <input className="input" placeholder="e.g. Software Engineer" value={role} onChange={(e) => setRole(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Status</label>
                  <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Applied Date</label>
                  <input className="input" type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Match Score</label>
                  <input className="input" type="number" placeholder="0-100" value={matchScore} onChange={(e) => setMatchScore(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Job Link</label>
                  <input className="input" placeholder="https://..." value={jobLink} onChange={(e) => setJobLink(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Notes</label>
                <textarea className="input resize-y" placeholder="Optional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <button className="btn" type="submit">Save Application</button>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="panel">
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm font-medium" style={{ color: '#475569' }}>No applications yet</p>
              <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Click &quot;+ Add Application&quot; above to start tracking</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Link</th>
                    <th>Notes</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a) => (
                    <tr key={a.id}>
                      {editingId === a.id ? (
                        <>
                          <td><input className="input text-xs" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} /></td>
                          <td><input className="input text-xs" value={editRole} onChange={(e) => setEditRole(e.target.value)} /></td>
                          <td>
                            <select className="input text-xs" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td><input className="input text-xs" type="date" value={editAppliedDate} onChange={(e) => setEditAppliedDate(e.target.value)} /></td>
                          <td><input className="input text-xs w-16" type="number" value={editMatchScore} onChange={(e) => setEditMatchScore(e.target.value)} /></td>
                          <td><input className="input text-xs" value={editJobLink} onChange={(e) => setEditJobLink(e.target.value)} /></td>
                          <td><input className="input text-xs" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} /></td>
                          <td className="text-right">
                            <div className="flex justify-end gap-1">
                              <button className="btn text-xs" onClick={() => saveEdit(a.id)}>Save</button>
                              <button className="btn-secondary text-xs" onClick={cancelEdit}>Cancel</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="font-medium">{a.company}</td>
                          <td>{a.role}</td>
                          <td><span className={`badge ${statusBadge[a.status] || 'badge-gray'}`}>{a.status}</span></td>
                          <td style={{ color: '#64748B' }}>{a.applied_date}</td>
                          <td>
                            {a.match_score > 0 ? (
                              <span className={`font-bold ${a.match_score >= 75 ? 'text-green-600' : a.match_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {a.match_score}%
                              </span>
                            ) : <span className="text-gray-400">-</span>}
                          </td>
                          <td>
                            {a.job_link && (
                              <a href={a.job_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                🔗
                              </a>
                            )}
                          </td>
                          <td className="max-w-[200px] truncate" style={{ color: '#64748B' }}>{a.notes || '—'}</td>
                          <td className="text-right">
                            <div className="flex justify-end gap-1">
                              <button className="btn-secondary text-xs" onClick={() => startEdit(a)}>Edit</button>
                              {confirmingDeleteId === a.id ? (
                                <>
                                  <button className="btn-danger text-xs" onClick={() => deleteApplication(a.id)}>Confirm</button>
                                  <button className="btn-secondary text-xs" onClick={() => setConfirmingDeleteId(null)}>Cancel</button>
                                </>
                              ) : (
                                <button className="btn-danger text-xs" onClick={() => setConfirmingDeleteId(a.id)}>Delete</button>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
