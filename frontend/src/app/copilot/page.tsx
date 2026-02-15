'use client'

import { useEffect, useState } from 'react'

import { Sidebar } from '@/components/Sidebar'
import { PageHeader } from '@/components/PageHeader'
import { api } from '@/lib/api'

type Job = { id: number; company: string; role: string; description?: string }
type Resume = { id: number; title: string; file_name: string }

interface ParsedTailor {
  bullets: string[]
  coverLetter: string
}

function parseTailorResponse(raw: unknown): ParsedTailor {
  let obj: Record<string, unknown> = {}

  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw) } catch { obj = {} }
  } else if (raw && typeof raw === 'object') {
    obj = raw as Record<string, unknown>
  }

  if (typeof obj.answer === 'string') {
    try { obj = JSON.parse(obj.answer) } catch { /* keep as-is */ }
  }
  if (obj.data && typeof obj.data === 'object') {
    obj = obj.data as Record<string, unknown>
  }

  let bullets: string[] = []
  const bulletKeys = ['tailored_bullets', 'tailored_resume_bullets', 'bullets', 'resume_bullets']
  for (const key of bulletKeys) {
    if (Array.isArray(obj[key]) && (obj[key] as string[]).length > 0) {
      bullets = (obj[key] as string[]).map(String)
      break
    }
  }

  let coverLetter = ''
  const letterKeys = ['cover_letter', 'cover_letter_snippet', 'coverLetter', 'letter']
  for (const key of letterKeys) {
    if (typeof obj[key] === 'string' && (obj[key] as string).trim()) {
      coverLetter = (obj[key] as string).trim()
      break
    }
  }

  return { bullets, coverLetter }
}

export default function TailorPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedJob, setSelectedJob] = useState<number | ''>('')
  const [selectedResume, setSelectedResume] = useState<number | ''>('')
  const [tailorResult, setTailorResult] = useState<ParsedTailor | null>(null)
  const [tailorLoading, setTailorLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'bullets' | 'letter'>('bullets')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [jobsRes, resumesRes] = await Promise.all([
          api.get('/api/jobs/'),
          api.get('/api/resumes/')
        ])

        const jobsList = jobsRes.data.results || []
        setJobs(jobsList)
        if (jobsList.length > 0) setSelectedJob(jobsList[0].id)

        const resumesList = resumesRes.data.results || []
        setResumes(resumesList)
        if (resumesList.length > 0) setSelectedResume(resumesList[0].id)
      } catch (err) {
        console.error('Failed to load initial data', err)
      }
    }
    loadData()
  }, [])

  const runTailor = async () => {
    if (!selectedJob || !selectedResume) return

    setTailorLoading(true)
    setTailorResult(null)
    setCopied(false)

    try {
      // Send IDs to backend for precise tailoring
      const res = await api.post('/api/copilot/tailor/', {
        resume_id: selectedResume,
        job_id: selectedJob,
        top_k: 8
      })
      setTailorResult(parseTailorResponse(res.data))
    } catch (err) {
      console.error('Tailoring failed', err)
    } finally {
      setTailorLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content p-6 md:p-10">
        <PageHeader title="Tailor" subtitle="Generate tailored resume bullets and cover letters for specific jobs" />

        {/* Controls */}
        <div className="panel mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Select Resume</label>
              <select
                className="input"
                value={selectedResume}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedResume(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">-- Pick a resume --</option>
                {resumes.map((r: Resume) => (
                  <option key={r.id} value={r.id}>{r.title || r.file_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Select Job</label>
              <select
                className="input"
                value={selectedJob}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedJob(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">-- Pick a job --</option>
                {jobs.map((j: Job) => (
                  <option key={j.id} value={j.id}>{j.company} - {j.role}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="btn"
              type="button"
              onClick={runTailor}
              disabled={!selectedJob || !selectedResume || tailorLoading}
            >
              {tailorLoading ? 'Generating...' : 'Generate Tailored Content'}
            </button>
          </div>
        </div>


        {/* Loading skeleton */}
        {tailorLoading && (
          <div className="panel">
            <div className="space-y-3">
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-5/6" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-full" />
            </div>
          </div>
        )}

        {/* Results */}
        {tailorResult && !tailorLoading && (
          <div className="panel">
            {/* Tabs */}
            <div className="flex items-center justify-between mb-6">
              <div className="tab-list">
                <button
                  className={`tab-btn ${activeTab === 'bullets' ? 'active' : ''}`}
                  onClick={() => setActiveTab('bullets')}
                >
                  Resume Bullets
                </button>
                <button
                  className={`tab-btn ${activeTab === 'letter' ? 'active' : ''}`}
                  onClick={() => setActiveTab('letter')}
                >
                  Cover Letter
                </button>
              </div>
              <button
                className="btn-secondary text-xs"
                onClick={() => {
                  const text = activeTab === 'bullets'
                    ? tailorResult.bullets.map((b, i) => `• ${b}`).join('\n')
                    : tailorResult.coverLetter
                  copyToClipboard(text)
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'bullets' && (
              <div>
                {tailorResult.bullets.length > 0 ? (
                  <ul className="space-y-3">
                    {tailorResult.bullets.map((bullet: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 rounded-lg p-3 text-sm" style={{ background: '#F8FAFC', color: '#374151' }}>
                        <span className="shrink-0 mt-0.5 font-bold" style={{ color: '#4F46E5' }}>•</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm" style={{ color: '#94A3B8' }}>No bullets generated. Try again.</p>
                )}
              </div>
            )}

            {activeTab === 'letter' && (
              <div>
                {tailorResult.coverLetter ? (
                  <div className="rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: '#F8FAFC', color: '#374151' }}>
                    {tailorResult.coverLetter}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: '#94A3B8' }}>No cover letter generated. Try again.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!tailorResult && !tailorLoading && (
          <div className="panel">
            <div className="text-center py-12">
              <div className="text-4xl mb-3">✂️</div>
              <p className="text-sm font-medium" style={{ color: '#475569' }}>No content generated yet</p>
              <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Select a job above and click &quot;Generate Tailored Content&quot; to get started</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
