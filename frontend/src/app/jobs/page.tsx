'use client'

import { FormEvent, useEffect, useState } from 'react'

import { Sidebar } from '@/components/Sidebar'
import { PageHeader } from '@/components/PageHeader'
import { api } from '@/lib/api'

type Job = { id: number; company: string; role: string; description?: string }

export default function JobsPage() {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [description, setDescription] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [error, setError] = useState('')
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null)

  const load = async () => {
    try {
      const res = await api.get('/api/jobs/')
      setJobs(res.data.results || [])
    } catch (err) {
      console.error('Failed to load jobs', err)
    }
  }

  useEffect(() => { load() }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await api.post('/api/jobs/', { company, role, description })

      setCompany('')
      setRole('')
      setDescription('')
      await load()
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const payload = err.response?.data
      setError(payload?.detail || payload?.company?.[0] || payload?.role?.[0] || payload?.description?.[0] || 'Failed to save job.')
    }
  }

  const deleteJob = async (id: number) => {
    try {
      await api.delete(`/api/jobs/${id}/`)
      setConfirmingDeleteId(null)
      await load()
    } catch (err) {
      console.error('Failed to delete job', err)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content p-6 md:p-10">
        <PageHeader title="Jobs" subtitle="Save job descriptions for analysis and tailoring" />

        {/* Add job form */}
        <div className="panel mb-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>Add Job Description</h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Company</label>
                <input className="input" placeholder="e.g. Google" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Role</label>
                <input className="input" placeholder="e.g. Software Engineer" value={role} onChange={(e) => setRole(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Job Description</label>
              <textarea className="input min-h-[160px] resize-y" placeholder="Paste the full job description here..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {error && <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>}
            <button className="btn" type="submit">Save Job</button>
          </form>
        </div>

        {/* Saved jobs */}
        <div className="panel">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>Saved Jobs</h2>
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">💼</div>
              <p className="text-sm font-medium" style={{ color: '#475569' }}>No jobs saved yet</p>
              <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Add a job description to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-xl border p-4 hover:shadow-md transition-shadow" style={{ borderColor: '#E2E8F0' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                      {job.company.charAt(0).toUpperCase()}
                    </div>
                    {confirmingDeleteId === job.id ? (
                      <div className="flex gap-1">
                        <button className="btn-danger text-xs" onClick={() => deleteJob(job.id)}>Confirm</button>
                        <button className="btn-secondary text-xs" onClick={() => setConfirmingDeleteId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button className="btn-danger text-xs" onClick={() => setConfirmingDeleteId(job.id)}>Delete</button>
                    )}
                  </div>
                  <p className="text-sm font-semibold truncate" style={{ color: '#0F172A' }}>{job.role}</p>
                  <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{job.company}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
