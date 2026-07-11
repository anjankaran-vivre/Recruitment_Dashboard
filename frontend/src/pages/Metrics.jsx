import { useState, useEffect, useCallback } from 'react'
import DateRangePicker from '../components/DateRangePicker'

function toInputStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtNum(v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toFixed(1)
}

function MetricsSkeleton() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.35)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Metrics</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="skel-bar skel-bar-md" />
        </div>
      </div>
      <div style={{ padding: '16px 32px 24px 32px' }}>
        <div className="pipeline-panel" style={{ marginBottom: 24, flex: 'none' }}>
          <div className="pipeline-panel-head">
            <span className="pipeline-panel-head-center">Recruiter Activity</span>
          </div>
          <div className="pipeline-panel-scroll">
            <table className="pipeline-table">
              <thead>
                <tr>
                  <th>Recruiter Name</th>
                  <th style={{ textAlign: 'center' }}>Total Candidates Assigned</th>
                  <th style={{ textAlign: 'center' }}>Called</th>
                  <th style={{ textAlign: 'center' }}>Joined</th>
                  <th style={{ textAlign: 'center' }}>Rejected</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="skel-row">
                    <td><span className="skel-bar skel-bar-md" /></td>
                    <td><span className="skel-bar skel-bar-sm" /></td>
                    <td><span className="skel-bar skel-bar-sm" /></td>
                    <td><span className="skel-bar skel-bar-sm" /></td>
                    <td><span className="skel-bar skel-bar-sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="pipeline-panel" style={{ flex: 'none' }}>
          <div className="pipeline-panel-head">
            <span className="pipeline-panel-head-center">Score Metrics</span>
          </div>
          <div className="pipeline-panel-scroll">
            <table className="pipeline-table">
              <thead>
                <tr>
                  <th>Recruiter Name</th>
                  <th style={{ textAlign: 'center' }}>Requisition Count</th>
                  <th style={{ textAlign: 'center' }}>Avg Call Audit Score</th>
                  <th style={{ textAlign: 'center' }}>Avg CV Score</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="skel-row">
                    <td><span className="skel-bar skel-bar-md" /></td>
                    <td><span className="skel-bar skel-bar-sm" /></td>
                    <td><span className="skel-bar skel-bar-sm" /></td>
                    <td><span className="skel-bar skel-bar-sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Metrics() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setReady(true))
  }, [])

  const fetchMetrics = useCallback(() => {
    const params = new URLSearchParams()
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    const ctrl = new AbortController()
    const id = setTimeout(() => ctrl.abort(), 60000)
    fetch(`${import.meta.env.VITE_API_BASE_URL}/metrics?${params}`, { signal: ctrl.signal })
      .then(res => res.json())
      .then(json => {
        if (json.data) setData(json.data)
      })
      .catch(err => console.error('Failed to load metrics:', err))
      .finally(() => clearTimeout(id))
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchMetrics()
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchMetrics()
    }, 30000)
    return () => clearInterval(id)
  }, [fetchMetrics])

  if (!ready) {
    return (
      <div className="page-body">
        <MetricsSkeleton />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="page-body">
        <MetricsSkeleton />
      </div>
    )
  }

  const { recruiters, activity, scoreMetrics } = data

  const activityMap = {}
  for (const row of activity) {
    activityMap[row.recruiter_name] = row
  }

  const scoreMap = {}
  for (const row of scoreMetrics) {
    scoreMap[row.recruiter_name] = row
  }

  const toLocalStr = d => {
    if (!d) return ''
    const p = d.split('-')
    return `${p[2]}/${p[1]}/${p[0]}`
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.35)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Metrics</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <DateRangePicker
            dateFrom={dateFrom}
            dateTo={dateTo}
            setDateFrom={setDateFrom}
            setDateTo={setDateTo}
          />
        </div>
      </div>

      <div style={{ padding: '16px 32px 24px 32px' }}>
        {dateFrom && dateTo && (
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 12 }}>
            Showing data from {toLocalStr(dateFrom)} to {toLocalStr(dateTo)}
          </div>
        )}

        {/* Recruiter Activity Table */}
        <div className="pipeline-panel" style={{ marginBottom: 24, flex: 'none' }}>
          <div className="pipeline-panel-head">
            <span className="pipeline-panel-head-center">Recruiter Activity</span>
          </div>
          <div className="pipeline-panel-scroll">
            <table className="pipeline-table">
              <thead>
                <tr>
                  <th>Recruiter Name</th>
                  <th style={{ textAlign: 'center' }}>Total Candidates Assigned</th>
                  <th style={{ textAlign: 'center' }}>Called</th>
                  <th style={{ textAlign: 'center' }}>Joined</th>
                  <th style={{ textAlign: 'center' }}>Rejected</th>
                </tr>
              </thead>
              <tbody>
                {recruiters.map(r => {
                  const act = activityMap[r.recruiter_name]
                  return (
                    <tr key={r.recruiter_id}>
                      <td><strong>{r.recruiter_name}</strong></td>
                      <td style={{ textAlign: 'center' }}>{act ? act.total_assigned : 0}</td>
                      <td style={{ textAlign: 'center' }}>{act ? act.called : 0}</td>
                      <td style={{ textAlign: 'center' }}>{act ? act.joined : 0}</td>
                      <td style={{ textAlign: 'center' }}>{act ? act.rejected : 0}</td>
                    </tr>
                  )
                })}
                {recruiters.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>No active recruiters found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Score Metrics Table */}
        <div className="pipeline-panel" style={{ flex: 'none' }}>
          <div className="pipeline-panel-head">
            <span className="pipeline-panel-head-center">Score Metrics</span>
          </div>
          <div className="pipeline-panel-scroll">
            <table className="pipeline-table">
              <thead>
                <tr>
                  <th>Recruiter Name</th>
                  <th style={{ textAlign: 'center' }}>Requisition Count</th>
                  <th style={{ textAlign: 'center' }}>Avg Call Audit Score</th>
                  <th style={{ textAlign: 'center' }}>Avg CV Score</th>
                </tr>
              </thead>
              <tbody>
                {recruiters.map(r => {
                  const sc = scoreMap[r.recruiter_name]
                  return (
                    <tr key={r.recruiter_id}>
                      <td><strong>{r.recruiter_name}</strong></td>
                      <td style={{ textAlign: 'center' }}>{sc ? sc.requisition_count : 0}</td>
                      <td style={{ textAlign: 'center' }}>{sc ? fmtNum(sc.avg_call_audit_score) : '—'}</td>
                      <td style={{ textAlign: 'center' }}>{sc ? fmtNum(sc.avg_cv_score) : '—'}</td>
                    </tr>
                  )
                })}
                {recruiters.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>No active recruiters found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
