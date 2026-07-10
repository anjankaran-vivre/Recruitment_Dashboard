import { useState, useEffect } from 'react'
import DateRangePicker from '../components/DateRangePicker'

function toInputStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtNum(v) {
  if (v === null || v === undefined) return '—'
  return Number(v).toFixed(1)
}

export default function Metrics() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    fetch(`http://localhost:8080/api/metrics?${params}`)
      .then(res => res.json())
      .then(json => {
        setData(json.data)
      })
      .catch(err => console.error('Failed to load metrics:', err))
      .finally(() => setLoading(false))
  }, [dateFrom, dateTo])

  if (!data) {
    return (
      <div className="page-body">
        <div className="loading"><div className="spinner" /><span>Loading metrics…</span></div>
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
        {loading && <div className="loading"><div className="spinner" /></div>}

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
