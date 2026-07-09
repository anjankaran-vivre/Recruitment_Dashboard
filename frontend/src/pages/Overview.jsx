import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { fetchSummary, fetchRequisitions, fetchApplications } from '../services/api'

const COLORS = ['#4f46e5', '#22c55e', '#eab308', '#ef4444', '#3b82f6', '#a855f7']

export default function Overview() {
  const [summary, setSummary] = useState(null)
  const [requisitions, setRequisitions] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, r, a] = await Promise.all([
          fetchSummary(),
          fetchRequisitions(),
          fetchApplications()
        ])
        setSummary(s)
        setRequisitions(r)
        setApplications(a)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" /> Loading dashboard...
      </div>
    )
  }

  const statusCounts = requisitions.reduce((acc, r) => {
    const s = r.Status || 'Open'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  const deptCounts = requisitions.reduce((acc, r) => {
    const d = r.Department || 'Unassigned'
    acc[d] = (acc[d] || 0) + 1
    return acc
  }, {})

  const appStatusCounts = applications.reduce((acc, a) => {
    const s = a.Application_Status || 'New'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  const requisitionStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
  const deptData = Object.entries(deptCounts).map(([name, value]) => ({ name, value }))
  const appStatusData = Object.entries(appStatusCounts).map(([name, value]) => ({ name, value }))

  const recentApplications = [...applications].sort((a, b) => {
    return new Date(b.CreatedAt) - new Date(a.CreatedAt)
  }).slice(0, 5)

  const inProgressCount = requisitions.filter(r => {
    const s = (r.Status || '').toLowerCase()
    return s.includes('in progress') || s.includes('in-progress')
  }).length

  const summaryCards = [
    { label: 'Total Requisitions', value: summary?.total_requisitions ?? 0, icon: '📋', color: '#4f46e5' },
    { label: 'Open Positions', value: inProgressCount, icon: '🔓', color: '#22c55e' },
    { label: 'Total Applications', value: summary?.total_applications ?? 0, icon: '📄', color: '#3b82f6' },
    { label: 'Avg CV Score', value: summary?.avg_cv_score != null ? `${Math.round(summary.avg_cv_score)}%` : '—', icon: '⭐', color: '#eab308' },
    { label: 'Avg Call Audit', value: summary?.avg_call_audit_score != null ? `${Math.round(summary.avg_call_audit_score)}%` : '—', icon: '🎯', color: '#f97316' },
  ]

  return (
    <div>
      <div className="summary-cards">
        {summaryCards.map((card, i) => (
          <div className="summary-card" key={i}>
            <div className="summary-card-label">
              <span className="summary-card-icon" style={{ background: `${card.color}15`, color: card.color }}>
                {card.icon}
              </span>
              {card.label}
            </div>
            <div className="summary-card-value">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Requisitions by Status</h3>
          {requisitionStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={requisitionStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {requisitionStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-state-text">No data</div></div>
          )}
        </div>

        <div className="chart-card">
          <h3>Applications by Status</h3>
          {appStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={appStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-state-text">No data</div></div>
          )}
        </div>

        <div className="chart-card">
          <h3>Requisitions by Department</h3>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#818cf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-state-text">No data</div></div>
          )}
        </div>

        <div className="chart-card">
          <h3>Recent Applications</h3>
          {recentApplications.length > 0 ? (
            <div style={{ fontSize: 13 }}>
              {recentApplications.map((app, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < recentApplications.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{app.Candidate_Name || '—'}</div>
                    <div style={{ color: 'var(--text-light)', fontSize: 12 }}>{app.Posting_Title || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#eab308', minWidth: 32, textAlign: 'right' }}>{app.CV_Score != null ? `${Math.round(app.CV_Score)}%` : '—'}</span>
                    <div style={{ width: 60, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${app.CV_Score || 0}%`, background: 'linear-gradient(90deg, #eab308, #f59e0b)', borderRadius: 3 }} />
                    </div>
                    <span className={`badge badge-${(app.Application_Status || 'new').toLowerCase().replace(/\s+/g, '-')}`}>
                      {app.Application_Status || 'New'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><div className="empty-state-text">No recent applications</div></div>
          )}
        </div>
      </div>
    </div>
  )
}
