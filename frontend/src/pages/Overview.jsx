import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts'
import { useData } from '../context/DataContext'

const COLORS = ['#4f46e5', '#22c55e', '#eab308', '#ef4444', '#3b82f6', '#a855f7']

const MIN_PCT = 8
const RADIAN = Math.PI / 180

function makePieLabel(sep) {
  return function PieLabel({ name, percent, cx, cy, midAngle, outerRadius }) {
    const pct = parseFloat((percent * 100).toFixed(0))
    if (pct < MIN_PCT) return null
    const r = outerRadius + 26
    const x = cx + r * Math.cos(-midAngle * RADIAN)
    const y = cy + r * Math.sin(-midAngle * RADIAN)
    const sx = cx + (outerRadius + 8) * Math.cos(-midAngle * RADIAN)
    const sy = cy + (outerRadius + 8) * Math.sin(-midAngle * RADIAN)
    return (
      <g>
        <polyline points={`${sx},${sy} ${x},${y}`} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={1} />
        <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: 11, fill: 'var(--text)' }}>
          {`${name}${sep}${pct}%`}
        </text>
      </g>
    )
  }
}

export default function Overview() {
  const { summary, requisitions, applications, loading } = useData()
  const [mounted, setMounted] = useState(false)

  const reqRef = useRef(null)
  const appRef = useRef(null)
  const deptRef = useRef(null)
  const [sizes, setSizes] = useState({ req: 0, app: 0, dept: 0 })

  useEffect(() => {
    if (!loading && !mounted) {
      const t = setTimeout(() => {
        if (reqRef.current && appRef.current && deptRef.current) {
          setSizes({
            req: reqRef.current.offsetWidth,
            app: appRef.current.offsetWidth,
            dept: deptRef.current.offsetWidth
          })
          setMounted(true)
        }
      }, 80)
      return () => clearTimeout(t)
    }
  }, [loading, mounted])

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
    { label: 'Total Requisitions', value: summary?.total_requisitions ?? 0 },
    { label: 'Open Positions', value: inProgressCount },
    { label: 'Total Applications', value: summary?.total_applications ?? 0 },
    { label: 'Avg CV Score', value: summary?.avg_cv_score != null ? `${Math.round(summary.avg_cv_score)}%` : '—' },
    { label: 'Avg Call Audit', value: summary?.avg_call_audit_score != null ? `${Math.round(summary.avg_call_audit_score)}%` : '—' },
  ]

  return (
    <div>
      <div className="summary-cards">
        {summaryCards.map((card, i) => (
          <div className="summary-card" key={i}>
            <div className="summary-card-label">{card.label}</div>
            <div className="summary-card-value">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Requisitions by Status</h3>
          <div ref={reqRef} style={{ width: '100%', height: 300 }}>
            {mounted && sizes.req > 0 && requisitionStatusData.length > 0 ? (
              <PieChart width={sizes.req} height={300}>
                <Pie data={requisitionStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} startAngle={-90} endAngle={270} dataKey="value" isAnimationActive={true} animationBegin={300} animationDuration={1500} animationEasing="ease-out" labelLine={false} label={makePieLabel(' ')}>
                  {requisitionStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : !mounted ? (
              <div className="empty-state"><div className="empty-state-text">Loading chart...</div></div>
            ) : (
              <div className="empty-state"><div className="empty-state-text">No data</div></div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Applications by Status</h3>
          <div ref={appRef} style={{ width: '100%', height: 310 }}>
            {mounted && sizes.app > 0 && appStatusData.length > 0 ? (
              <PieChart width={sizes.app} height={310}>
                <Pie
                  data={appStatusData}
                  cx="50%"
                  cy="52%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={-90}
                  endAngle={270}
                  isAnimationActive={true}
                  animationBegin={500}
                  animationDuration={1500}
                  animationEasing="ease-out"
                  labelLine={false}
                  label={makePieLabel(': ')}
                >
                  {appStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            ) : !mounted ? (
              <div className="empty-state"><div className="empty-state-text">Loading chart...</div></div>
            ) : (
              <div className="empty-state"><div className="empty-state-text">No data</div></div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Requisitions by Department</h3>
          <div ref={deptRef} style={{ width: '100%', height: 280 }}>
            {mounted && sizes.dept > 0 && deptData.length > 0 ? (
              <BarChart data={deptData} layout="vertical" width={sizes.dept} height={280}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#818cf8" radius={[0, 4, 4, 0]} isAnimationActive={true} animationBegin={700} animationDuration={1200} animationEasing="ease-out" />
              </BarChart>
            ) : !mounted ? (
              <div className="empty-state"><div className="empty-state-text">Loading chart...</div></div>
            ) : (
              <div className="empty-state"><div className="empty-state-text">No data</div></div>
            )}
          </div>
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
