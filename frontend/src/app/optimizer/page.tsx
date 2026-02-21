'use client'

import { FormEvent, useEffect, useState } from 'react'

import { Sidebar } from '@/components/Sidebar'
import { api } from '@/lib/api'

type Resume = { id: number; title: string }
type Job = { id: number; company: string; role: string }

type MatchResult = {
  match_score: number
  matched_keywords: string[]
  missing_keywords: string[]
  improvement_suggestions: string[]
  tailored_resume_bullets: string[]
  cover_letter_snippet: string
}

export default function OptimizerPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [jobs, setJobs] = useState<Job[]>([])

  const [selectedResume, setSelectedResume] = useState<number | ''>('')
  const [selectedJob, setSelectedJob] = useState<number | ''>('')
  const [result, setResult] = useState<MatchResult | null>(null)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadData = async (keepSelections = false) => {
    try {
      const [resumeRes, jobsRes] = await Promise.all([
        api.get('/api/resumes/'),
        api.get('/api/jobs/')
      ])

      const resumesList = resumeRes.data.results || []
      setResumes(resumesList)
      if (!keepSelections) {
        setSelectedResume((prev) => (!prev && resumesList.length > 0 ? resumesList[0].id : prev))
      }

      const jobsList = jobsRes.data.results || []
      setJobs(jobsList)
      if (!keepSelections) {
        setSelectedJob((prev) => (!prev && jobsList.length > 0 ? jobsList[0].id : prev))
      }
    } catch (err) {
      console.error('Failed to load data', err)
    }
  }

  useEffect(() => { loadData() }, [])

  const onRunMatch = async () => {
    setError('')
    setResult(null)
    if (!selectedResume || !selectedJob) {
      setError('Select both a resume and job.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/api/copilot/match/', {
        resume_id: selectedResume,
        job_id: selectedJob
      })
      setResult(res.data)
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const payload = err.response?.data
      setError(payload?.detail || 'Match generation failed.')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = result
    ? result.match_score >= 75 ? '#22C55E'
      : result.match_score >= 50 ? '#EAB308'
        : '#FF3B30'
    : '#0A0A0A'

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Resume Analyzer</h1>
            <p style={{ marginTop: '8px', color: '#777', fontSize: '15px' }}>Match your resume against job descriptions and get improvement suggestions</p>
          </div>
        </div>

        {/* Run Matching */}
        <div className="panel" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: '#0A0A0A' }}>Run Analysis</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#0A0A0A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resume</label>
              <div style={{ position: 'relative' }}>
                <select className="input" style={{ appearance: 'none', cursor: 'pointer', backgroundColor: '#FFF' }} value={selectedResume} onChange={(e) => setSelectedResume(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Select Resume</option>
                  {resumes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#999' }}>▼</div>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#0A0A0A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Job Description</label>
              <div style={{ position: 'relative' }}>
                <select className="input" style={{ appearance: 'none', cursor: 'pointer', backgroundColor: '#FFF' }} value={selectedJob} onChange={(e) => setSelectedJob(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Select Job</option>
                  {jobs.map((j) => <option key={j.id} value={j.id}>{j.company} - {j.role}</option>)}
                </select>
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#999' }}>▼</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-primary" onClick={onRunMatch} type="button" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Analyzing...' : 'Run Match'}
            </button>
            <button className="btn-secondary" onClick={() => loadData(true)} type="button">Refresh Lists</button>
          </div>
          {error && <p style={{ marginTop: '12px', fontSize: '13px', color: '#FF3B30' }}>{error}</p>}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: '24px', opacity: 0.5 }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#E0E0E0', animation: 'pulse 2s infinite' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ height: '16px', width: '60%', backgroundColor: '#E0E0E0', animation: 'pulse 2s infinite' }} />
              <div style={{ height: '16px', width: '40%', backgroundColor: '#E0E0E0', animation: 'pulse 2s infinite' }} />
              <div style={{ height: '16px', width: '70%', backgroundColor: '#E0E0E0', animation: 'pulse 2s infinite' }} />
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Row: Score + Keywords */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '24px' }}>

              {/* Hero Score Card */}
              <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', backgroundColor: '#0A0A0A', color: '#FFF' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '84px', fontWeight: 700, lineHeight: 1, color: scoreColor, letterSpacing: '-2px' }}>
                  {result.match_score}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '12px' }}>Match Score</span>
                <div style={{ marginTop: '24px', fontSize: '14px', fontWeight: 600, color: scoreColor, padding: '6px 16px', border: `1px solid ${scoreColor}` }}>
                  {result.match_score >= 75 ? 'Strong Match' : result.match_score >= 50 ? 'Moderate Match' : 'Needs Improvement'}
                </div>
              </div>

              {/* Keywords Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Matched Keywords */}
                <div className="panel" style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#0A0A0A' }}>Matched Skills</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {result.matched_keywords.length > 0 ? result.matched_keywords.map((kw, i) => (
                      <span key={i} style={{ fontSize: '13px', fontWeight: 500, padding: '6px 12px', border: '1px solid #E0E0E0', color: '#0A0A0A', background: '#FAFAFA' }}>
                        {kw}
                      </span>
                    )) : <p style={{ fontSize: '14px', color: '#999' }}>No exact keyword matches found.</p>}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="panel" style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#0A0A0A' }}>Missing Skills <span style={{ fontSize: '14px', fontWeight: 400, color: '#777', marginLeft: '8px' }}>(Important to Add)</span></h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {result.missing_keywords.length > 0 ? result.missing_keywords.map((kw, i) => (
                      <span key={i} style={{ fontSize: '13px', fontWeight: 500, padding: '6px 12px', border: '1px solid #FECACA', color: '#FF3B30', background: '#FEF2F2' }}>
                        {kw}
                      </span>
                    )) : <p style={{ fontSize: '14px', color: '#999' }}>Excellent! You matched all key requirements.</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Improvement Suggestions */}
            <div className="panel">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: '#0A0A0A' }}>Actionable Suggestions</h3>
              {result.improvement_suggestions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.improvement_suggestions.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px', border: '1px solid #E0E0E0', background: '#FAFAFA' }}>
                      <span style={{ color: '#FF3B30', fontSize: '18px', lineHeight: 1 }}>→</span>
                      <p style={{ fontSize: '15px', color: '#333', lineHeight: 1.5 }}>{s}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', border: '1px solid #E0E0E0' }}>
                  <p style={{ fontSize: '15px', color: '#777' }}>Your resume is highly optimized for this role. No further improvements suggested.</p>
                </div>
              )}
            </div>

            {/* Optional text snippet output if you want to display the generated bullets too */}
            {result.tailored_resume_bullets && result.tailored_resume_bullets.length > 0 && (
              <div className="panel">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: '#0A0A0A' }}>Suggested Bullets</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.tailored_resume_bullets.map((b, i) => (
                    <div key={i} style={{ padding: '16px', border: '1px solid #E0E0E0', borderLeft: '4px solid #0A0A0A', background: '#FFF' }}>
                      <p style={{ fontSize: '14px', color: '#0A0A0A', lineHeight: 1.6 }}>{b}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}} />
    </div>
  )
}
