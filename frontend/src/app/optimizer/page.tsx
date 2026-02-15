'use client'

import { FormEvent, useEffect, useState } from 'react'

import { Sidebar } from '@/components/Sidebar'
import { PageHeader } from '@/components/PageHeader'
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
    ? result.match_score >= 75 ? '#16A34A'
      : result.match_score >= 50 ? '#D97706'
        : '#DC2626'
    : '#4F46E5'

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content p-6 md:p-10">
        <PageHeader title="Resume Analyzer" subtitle="Match your resume against job descriptions and get improvement suggestions" />

        {/* Run Matching */}
        <div className="panel mb-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#0F172A' }}>Run Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Resume</label>
              <select className="input" value={selectedResume} onChange={(e) => setSelectedResume(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Select Resume</option>
                {resumes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Job</label>
              <select className="input" value={selectedJob} onChange={(e) => setSelectedJob(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Select Job</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.company} - {j.role}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn" onClick={onRunMatch} type="button" disabled={loading}>
              {loading ? 'Analyzing...' : 'Run Match'}
            </button>
            <button className="btn-secondary" onClick={() => loadData(true)} type="button">Refresh Lists</button>
          </div>
          {error && <p className="mt-3 text-sm" style={{ color: '#DC2626' }}>{error}</p>}
        </div>

        {/* Results */}
        {loading && (
          <div className="panel mb-6">
            <div className="flex items-center gap-4">
              <div className="skeleton h-[140px] w-[140px] rounded-full shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Score + Keywords */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Score circle */}
              <div className="panel flex flex-col items-center justify-center py-8">
                <div className="score-circle" style={{ '--score': result.match_score } as React.CSSProperties}>
                  <div className="score-circle-inner">
                    <span className="text-3xl font-bold" style={{ color: scoreColor }}>{result.match_score}</span>
                    <span className="text-xs font-medium" style={{ color: '#64748B' }}>Match Score</span>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium" style={{ color: scoreColor }}>
                  {result.match_score >= 75 ? 'Strong Match' : result.match_score >= 50 ? 'Moderate Match' : 'Needs Improvement'}
                </p>
              </div>

              {/* Matched Keywords */}
              <div className="panel">
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>Matched Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {result.matched_keywords.map((kw, i) => (
                    <span key={i} className="pill pill-green">{kw}</span>
                  ))}
                  {result.matched_keywords.length === 0 && <p className="text-sm" style={{ color: '#94A3B8' }}>None found</p>}
                </div>
              </div>

              {/* Missing Keywords */}
              <div className="panel">
                <h3 className="text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>Missing Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {result.missing_keywords.map((kw, i) => (
                    <span key={i} className="pill pill-red">{kw}</span>
                  ))}
                  {result.missing_keywords.length === 0 && <p className="text-sm" style={{ color: '#94A3B8' }}>None — great coverage!</p>}
                </div>
              </div>
            </div>

            {/* Improvement Suggestions */}
            <div className="panel">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#0F172A' }}>Improvement Suggestions</h3>
              {result.improvement_suggestions.length > 0 ? (
                <ul className="space-y-2">
                  {result.improvement_suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm rounded-lg p-3" style={{ background: '#F8FAFC', color: '#475569' }}>
                      <span className="shrink-0 mt-0.5" style={{ color: '#4F46E5' }}>→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: '#94A3B8' }}>No suggestions — your resume looks great!</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
