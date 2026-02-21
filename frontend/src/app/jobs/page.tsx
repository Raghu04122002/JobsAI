'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { api } from '@/lib/api'
import { Sparkles, X, MapPin, ExternalLink, Building2, Search } from 'lucide-react'

type Job = {
  id: number
  company: string
  role: string
  description?: string
  location?: string
  apply_url?: string
  source?: string
}

// Common job titles for suggestions
const ROLE_SUGGESTIONS = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Engineer', 'Data Scientist', 'Product Manager',
  'UX Designer', 'DevOps Engineer', 'Machine Learning Engineer'
]

// Common tech hubs for suggestions
const LOCATION_SUGGESTIONS = [
  'Remote', 'San Francisco, CA', 'New York, NY', 'Seattle, WA',
  'Austin, TX', 'London, UK', 'Toronto, ON', 'Berlin, Germany'
]

export default function JobsPage() {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [description, setDescription] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [totalJobs, setTotalJobs] = useState(0)
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null)

  // Auto-import modal state
  const [showImportModal, setShowImportModal] = useState(false)
  const [importRole, setImportRole] = useState('')
  const [importLocation, setImportLocation] = useState('')
  const [importExperience, setImportExperience] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [importPage, setImportPage] = useState(1)
  const [hasMoreJobs, setHasMoreJobs] = useState(true)

  // Track applying status
  const [appliedJobIds, setAppliedJobIds] = useState<number[]>([])
  const [applyingId, setApplyingId] = useState<number | null>(null)

  const load = async () => {
    try {
      const res = await api.get('/api/jobs/')
      setJobs(res.data.results || [])
      setTotalJobs(res.data.count || 0)
      setNextPageUrl(res.data.next || null)
    } catch (err) {
      console.error('Failed to load jobs', err)
    }
  }

  useEffect(() => { load() }, [])

  const loadMore = async () => {
    if (!nextPageUrl) return
    setLoadingMore(true)
    try {
      const url = new URL(nextPageUrl)
      const pathWithQuery = url.pathname + url.search
      const res = await api.get(pathWithQuery)
      setJobs(prev => [...prev, ...(res.data.results || [])])
      setNextPageUrl(res.data.next || null)
    } catch (err) {
      console.error('Failed to load more jobs', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/api/jobs/', { company, role, description })
      setCompany('')
      setRole('')
      setDescription('')
      await load()
    } catch (err: any) {
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

  const markAsApplied = async (id: number) => {
    setApplyingId(id)
    try {
      await api.post(`/api/applications/from-job/`, { job_id: id })
      setAppliedJobIds(prev => [...prev, id])
    } catch (err) {
      console.error('Failed to mark as applied', err)
    } finally {
      setApplyingId(null)
    }
  }

  const handleAutoImport = async () => {
    if (!importRole.trim() || !importLocation.trim()) return
    setImporting(true)
    setImportResult(null)
    try {
      const payload: any = {
        role: importRole,
        location: importLocation,
        page: importPage
      }
      if (importExperience) {
        payload.experience_level = importExperience
      }
      const res = await api.post('/api/jobs/auto-import/', payload)
      const { imported, total_found, has_more } = res.data

      setImportResult(`${imported} new jobs imported (${total_found} found)`)
      await load()

      if (has_more && importPage < 5) {
        setImportPage(importPage + 1)
      } else {
        setHasMoreJobs(false)
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to import jobs.'
      setImportResult(msg)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Jobs</h1>
          <button
            className="btn-primary"
            onClick={() => {
              setShowImportModal(true)
              setImportPage(1)
              setHasMoreJobs(true)
              setImportResult(null)
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Sparkles size={14} />
            Auto Generate Jobs
          </button>
        </div>

        {/* Add Job Form */}
        <div className="panel" style={{ marginBottom: '24px' }}>
          <h2>Add Job Description</h2>
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: '#777' }}>Company</label>
                <input className="input" placeholder="e.g. Google" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: '#777' }}>Role</label>
                <input className="input" placeholder="e.g. Software Engineer" value={role} onChange={(e) => setRole(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: '#777' }}>Job Description</label>
              <textarea className="input" style={{ minHeight: '120px', resize: 'vertical' }} placeholder="Paste the full job description here..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {error && <p style={{ fontSize: '13px', color: '#FF3B30' }}>{error}</p>}
            <button className="btn" type="submit" style={{ alignSelf: 'flex-start' }}>Save Job</button>
          </form>
        </div>

        {/* Job Cards */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '16px' }}>
            Saved Jobs ({totalJobs})
          </h2>
          {jobs.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Search size={32} color="#999" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '16px', color: '#0A0A0A' }}>No jobs saved yet</p>
              <p style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>Add a job description manually or use Auto Generate</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {jobs.map((job) => (
                <div key={job.id} style={{
                  border: '1px solid #E0E0E0', padding: '24px',
                  display: 'flex', flexDirection: 'column', gap: '12px',
                  transition: 'border-color 0.2s',
                }}>
                  {/* Source badge */}
                  {job.source && (
                    <span style={{
                      alignSelf: 'flex-start', fontFamily: 'var(--font-body)',
                      fontSize: '11px', fontWeight: 500, padding: '3px 8px',
                      background: '#0A0A0A', color: '#FFF',
                    }}>
                      {job.source}
                    </span>
                  )}

                  {/* Title + Company */}
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '17px', color: '#0A0A0A', lineHeight: 1.3 }}>
                      {job.role}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                      <Building2 size={13} color="#777" />
                      <span style={{ fontSize: '14px', color: '#777' }}>{job.company}</span>
                    </div>
                  </div>

                  {/* Location */}
                  {job.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={13} color="#999" />
                      <span style={{ fontSize: '13px', color: '#999' }}>{job.location}</span>
                    </div>
                  )}

                  {/* Description preview */}
                  {job.description && (
                    <p style={{
                      fontSize: '13px', color: '#666', lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {job.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px', flexWrap: 'wrap' }}>
                    {appliedJobIds.includes(job.id) ? (
                      <button
                        className="btn-secondary"
                        disabled
                        style={{ fontSize: '12px', padding: '8px 14px', color: '#10B981', borderColor: '#10B981', backgroundColor: 'transparent' }}
                      >
                        Applied ✓
                      </button>
                    ) : (
                      <button
                        className="btn-secondary"
                        onClick={() => markAsApplied(job.id)}
                        disabled={applyingId === job.id}
                        style={{ fontSize: '12px', padding: '8px 14px' }}
                      >
                        {applyingId === job.id ? 'Saving...' : 'Mark as Applied'}
                      </button>
                    )}

                    {job.apply_url && (
                      <a
                        href={job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{ textDecoration: 'none', fontSize: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        Apply <ExternalLink size={12} />
                      </a>
                    )}
                    {confirmingDeleteId === job.id ? (
                      <>
                        <button className="btn-danger" onClick={() => deleteJob(job.id)}>Confirm</button>
                        <button className="btn-secondary" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => setConfirmingDeleteId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn-danger" onClick={() => setConfirmingDeleteId(job.id)}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {nextPageUrl && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
              <button
                className="btn-secondary"
                onClick={loadMore}
                disabled={loadingMore}
                style={{ padding: '10px 24px', fontSize: '14px' }}
              >
                {loadingMore ? 'Loading More...' : 'Load More Jobs'}
              </button>
            </div>
          )}
        </div>

        {/* Auto Import Modal */}
        {
          showImportModal && (
            <div className="modal-overlay" onClick={() => !importing && setShowImportModal(false)}>
              <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} color="#FF3B30" />
                      Auto Generate Jobs
                    </h3>
                    <p>Search real jobs from LinkedIn, Indeed & more</p>
                  </div>
                  <button onClick={() => !importing && setShowImportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#999' }}>
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Role with datalist suggestions */}
                  <div>
                    <label htmlFor="import-role" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#0A0A0A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Role / Job Title *
                    </label>
                    <input
                      id="import-role"
                      list="role-suggestions"
                      className="input"
                      placeholder="e.g. Software Engineer"
                      value={importRole}
                      onChange={(e) => setImportRole(e.target.value)}
                      disabled={importing}
                      style={{ fontSize: '15px', padding: '12px 14px' }}
                    />
                    <datalist id="role-suggestions">
                      {ROLE_SUGGESTIONS.map(sug => <option key={sug} value={sug} />)}
                    </datalist>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Location with datalist suggestions */}
                    <div>
                      <label htmlFor="import-location" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#0A0A0A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Location *
                      </label>
                      <input
                        id="import-location"
                        list="location-suggestions"
                        className="input"
                        placeholder="e.g. Remote, Austin, TX"
                        value={importLocation}
                        onChange={(e) => setImportLocation(e.target.value)}
                        disabled={importing}
                        style={{ fontSize: '15px', padding: '12px 14px' }}
                      />
                      <datalist id="location-suggestions">
                        {LOCATION_SUGGESTIONS.map(sug => <option key={sug} value={sug} />)}
                      </datalist>
                    </div>

                    {/* Experience Level */}
                    <div>
                      <label htmlFor="import-experience" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#0A0A0A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Experience Level
                      </label>
                      <div style={{ position: 'relative' }}>
                        <select
                          id="import-experience"
                          className="input"
                          value={importExperience}
                          onChange={(e) => setImportExperience(e.target.value)}
                          disabled={importing}
                          style={{ fontSize: '15px', padding: '12px 14px', appearance: 'none', backgroundColor: '#FFF', width: '100%', cursor: 'pointer' }}
                        >
                          <option value="">Any Experience</option>
                          <option value="no_experience">No Experience</option>
                          <option value="under_3_years_experience">Under 3 Years / Junior</option>
                          <option value="more_than_3_years_experience">More than 3 Years / Senior</option>
                          <option value="no_degree">No Degree Required</option>
                        </select>
                        <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#999' }}>
                          ▼
                        </div>
                      </div>
                    </div>
                  </div>

                  {importResult && (
                    <div style={{
                      fontSize: '14px', fontWeight: 500, padding: '14px 16px', borderRadius: '4px',
                      background: importResult.includes('Failed') || importResult.includes('not configured') ? '#FEF2F2' : '#F0FDF4',
                      color: importResult.includes('Failed') || importResult.includes('not configured') ? '#FF3B30' : '#22C55E',
                      border: `1px solid ${importResult.includes('Failed') || importResult.includes('not configured') ? '#FECACA' : '#BBF7D0'}`,
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                      {importResult}
                    </div>
                  )}
                </div>

                <div className="modal-footer" style={{ gap: '12px', padding: '20px 24px', background: '#FAFAFA', borderTop: '1px solid #EBEBEB' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowImportModal(false)}
                    disabled={importing}
                    style={{ padding: '10px 20px', fontSize: '14px' }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleAutoImport}
                    disabled={importing || !importRole.trim() || !importLocation.trim() || !hasMoreJobs}
                    style={{
                      padding: '10px 24px', fontSize: '14px',
                      opacity: importing || !importRole.trim() || !importLocation.trim() || !hasMoreJobs ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                  >
                    {importing ? (
                      <>
                        <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        Importing...
                      </>
                    ) : (!hasMoreJobs) ? 'No more jobs' : 'Find & Import Jobs'}
                  </button>
                </div>
              </div>
            </div>
          )
        }
      </main >
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}} />
    </div >
  )
}
