import { useState, useEffect, useMemo, useRef } from 'react'
import { useData } from '../context/DataContext'
import DateRangePicker from '../components/DateRangePicker'
import { createPortal } from 'react-dom'
import { fetchActiveRecruiters } from '../services/api'

const MILESTONES = [
  { key: 'associated', label: 'Associated' },
  { key: 'telecalling', label: 'Telecalling Completed' },
  { key: 'round2', label: '2nd Round Completed' },
  { key: 'manager', label: 'Manager Round Completed' },
  { key: 'hired', label: 'Hired / Joined' },
]

function getMilestoneIdx(status) {
  const s = (status || '').toLowerCase().replace(/\s+/g, '')
  if (['associated', 'new'].includes(s)) return 0
  if (['followup', 'follow-up', 'follow_up'].includes(s)) return -2
  if (['telecalling', 'screening', 'telecallingcompleted', 'telecallingscreeningcompleted', 'approved'].includes(s)) return 1
  if (['futurehireable', 'future-hireable', 'future_hireable'].includes(s)) return -3
  if (['round2', '2ndround', '2ndroundcompleted', 'inprogress'].includes(s)) return 2
  if (['managerroundscheduled', 'managerroundschedule'].includes(s)) return -4
  if (['manager', 'managerround', 'managerroundcompleted'].includes(s)) return 3
  if (['hired', 'offered', 'joined'].includes(s)) return 4
  return -1
}

function MilestoneBar({ status }) {
  const idx = getMilestoneIdx(status)
  const isRej = (status || '').toLowerCase() === 'rejected'
  const isJoined = (status || '').toLowerCase() === 'joined'
  const isFollowUp = idx === -2
  const isFutureHireable = idx === -3
  const isManagerScheduled = idx === -4

  function dotClass(i) {
    const classes = ['ms-dot']
    const filled = idx >= 0 && i <= idx
    if (filled && !isRej) classes.push('ms-filled')
    if (i === idx && !isRej && !isFollowUp && !isFutureHireable && !isManagerScheduled) classes.push('ms-active')
    if (isRej && i === 0) classes.push('ms-filled')
    if (isRej && i === MILESTONES.length - 1) classes.push('ms-rejected')
    if (isJoined && i === MILESTONES.length - 1) classes.push('ms-joined')
    if (isFollowUp && i === 0) classes.push('ms-filled')
    if (isFutureHireable && i <= 1) classes.push('ms-filled')
    if (isFutureHireable && i === MILESTONES.length - 1) classes.push('ms-future-hireable-dot')
    if (isManagerScheduled && i <= 1) classes.push('ms-filled')
    if (isManagerScheduled && i === 2) classes.push('ms-manager-scheduled')
    return classes.join(' ')
  }

  function lineClass(i) {
    const classes = ['ms-line']
    if (isRej) return classes.join(' ')
    if (isFollowUp && i === 0) classes.push('ms-filled')
    if (isFutureHireable && i === 0) classes.push('ms-filled')
    if (isFutureHireable && i === 1) classes.push('ms-future-hireable')
    if (isManagerScheduled && i <= 1) classes.push('ms-filled')
    if (idx >= 0 && i < idx) classes.push('ms-filled')
    return classes.join(' ')
  }

  return (
    <div className="ms-bar">
      {MILESTONES.map((m, i) => (
        <div key={m.key} className="ms-item">
          <span className="ms-tooltip">{m.label}</span>
          <div className={dotClass(i)} />
          {i < MILESTONES.length - 1 && (
            <div className="ms-line-wrap">
              <div className={lineClass(i)} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function DashboardInner() {
  const { applications, requisitions } = useData()
  const [search, setSearch] = useState('')
  const [candDateFrom, setCandDateFrom] = useState('')
  const [candDateTo, setCandDateTo] = useState('')
  const [summDateFrom, setSummDateFrom] = useState(() => {
    const d = new Date(); return d.toISOString().slice(0, 10)
  })
  const [summDateTo, setSummDateTo] = useState(() => {
    const d = new Date(); return d.toISOString().slice(0, 10)
  })
  const [modalApp, setModalApp] = useState(null)
  const [activeRecruiters, setActiveRecruiters] = useState([])
  const autoInitDone = useRef(false)

  useEffect(() => {
    fetchActiveRecruiters()
      .then(data => setActiveRecruiters(data || []))
      .catch(() => {})
  }, [])

  const jobIdToDept = useMemo(() => {
    const map = {}
    for (const r of requisitions) {
      if (r.Job_Opening_ID) map[String(r.Job_Opening_ID).trim()] = r.Department
    }
    return map
  }, [requisitions])

  const titleToDept = useMemo(() => {
    const map = {}
    for (const r of requisitions) {
      if (r.Job_Title) map[r.Job_Title.toLowerCase().trim()] = r.Department
    }
    return map
  }, [requisitions])

  const enriched = useMemo(() => {
    return applications
      .filter(a => {
        const d = a.Application_Created_Time || a.CreatedAt
        return d && new Date(d).getFullYear() === 2026
      })
      .map(a => {
        let dept = null
        if (a.Job_Opening_ID) {
          dept = jobIdToDept[String(a.Job_Opening_ID).trim()] || null
        }
        if (!dept && a.Posting_Title) {
          dept = titleToDept[a.Posting_Title.toLowerCase().trim()] || null
        }
        return { ...a, Department: dept }
      })
  }, [applications, jobIdToDept, titleToDept])

  useEffect(() => {
    if (autoInitDone.current || enriched.length === 0) return
    autoInitDone.current = true
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const hasToday = enriched.some(a => {
      const d = a.Application_Created_Time || a.CreatedAt
      return d && d.slice(0, 10) === todayStr
    })
    if (!hasToday) {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const ys = yesterday.toISOString().slice(0, 10)
      setSummDateFrom(ys)
      setSummDateTo(ys)
    }
  }, [enriched])

  const searched = useMemo(() => {
    if (!search) return enriched
    const q = search.toLowerCase()
    return enriched.filter(a =>
      (a.Recruiter_Name && a.Recruiter_Name.toLowerCase().includes(q)) ||
      (a.Candidate_Name && a.Candidate_Name.toLowerCase().includes(q)) ||
      (a.Posting_Title && a.Posting_Title.toLowerCase().includes(q)) ||
      (a.Department && a.Department.toLowerCase().includes(q)) ||
      (a.Application_Status && a.Application_Status.toLowerCase().includes(q)) ||
      (a.Mobile && a.Mobile.includes(q))
    )
  }, [enriched, search])

  const candFiltered = useMemo(() => {
    let list = searched
    if (candDateFrom) {
      const from = new Date(candDateFrom)
      list = list.filter(a => {
        const d = a.Application_Created_Time || a.CreatedAt
        return d && new Date(d) >= from
      })
    }
    if (candDateTo) {
      const to = new Date(candDateTo)
      to.setHours(23, 59, 59, 999)
      list = list.filter(a => {
        const d = a.Application_Created_Time || a.CreatedAt
        return d && new Date(d) <= to
      })
    }
    return list
  }, [searched, candDateFrom, candDateTo])

  const summFiltered = useMemo(() => {
    let list = enriched
    if (summDateFrom) {
      const from = new Date(summDateFrom)
      list = list.filter(a => {
        const d = a.Application_Created_Time || a.CreatedAt
        return d && new Date(d) >= from
      })
    }
    if (summDateTo) {
      const to = new Date(summDateTo)
      to.setHours(23, 59, 59, 999)
      list = list.filter(a => {
        const d = a.Application_Created_Time || a.CreatedAt
        return d && new Date(d) <= to
      })
    }
    return list
  }, [enriched, summDateFrom, summDateTo])

  const allStatuses = useMemo(() => {
    return [...new Set(enriched.map(a => a.Application_Status).filter(Boolean))]
      .filter(s => {
        const low = s.toLowerCase()
        return !low.includes('rejected') && !low.includes('hirable') && !['approved', 'future hireable', 'pending approval', 'first round completed', 'follow up', '1st round', 'first round', 'on hold', 'associated', 'loi sent', "didn't turn", 'offer declined', 'qualified'].includes(low) && !low.includes('directorial')
      })
  }, [enriched])

  const recruiterSummary = useMemo(() => {
    const groups = {}
    for (const a of summFiltered) {
      const name = a.Recruiter_Name || 'Unassigned'
      if (!groups[name]) groups[name] = { recruiter: name, total: 0, byStatus: {} }
      groups[name].total++
      const status = (a.Application_Status || 'New').toLowerCase()
      groups[name].byStatus[status] = (groups[name].byStatus[status] || 0) + 1
    }
    return Object.values(groups).sort((a, b) => b.total - a.total)
      .filter(g => activeRecruiters.some(r => r.recruiter_name === g.recruiter))
  }, [summFiltered, activeRecruiters])

  const grandTotal = useMemo(() => {
    return recruiterSummary.reduce((sum, g) => sum + g.total, 0)
  }, [recruiterSummary])

  const tableJsx = useMemo(() => {
    return candFiltered.length > 0 ? (
      <table className="pipeline-table">
        <thead>
          <tr>
            <th className="th-cand">Candidate</th>
            <th className="th-status-timeline">Status / Timeline</th>
            <th>Recruiter</th>
            <th>CV Link</th>
            <th className="th-profile">Profile Summary</th>
            <th className="th-posting">Posting Title</th>
            <th>Department</th>
          </tr>
        </thead>
        <tbody>
          {candFiltered.map((a, i) => (
            <tr key={a.id || i}>
              <td className="cell-cand">
                <span className="cell-name">{a.Candidate_Name || '—'}</span>
                {a.Mobile && <span className="cell-mobile">{a.Mobile}</span>}
              </td>
              <td className="cell-status-timeline">
                <span className={`status-badge status-${(a.Application_Status || 'new').toLowerCase().replace(/\s+/g, '-')}`}>
                  {a.Application_Status || 'New'}
                </span>
                <MilestoneBar status={a.Application_Status} />
              </td>
              <td className="cell-recruiter">{a.Recruiter_Name || '—'}</td>
              <td>
                {a.CV_Link ? (
                  <a href={a.CV_Link} target="_blank" rel="noopener noreferrer" className="cv-link">View CV</a>
                ) : <span className="cell-muted">—</span>}
              </td>
              <td className="cell-profile-summary" onClick={() => a.Profile_Summary && setModalApp(a)}>{a.Profile_Summary || <span className="cell-muted">—</span>}</td>
              <td className="cell-posting-title">{a.Posting_Title || <span className="cell-muted">—</span>}</td>
              <td className="cell-dept">
                {a.Department
                  ? <span className="dept-badge">{a.Department}</span>
                  : <span className="cell-muted">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <div className="pipeline-empty">
        <div className="pipeline-empty-icon">👥</div>
        <div className="pipeline-empty-text">No candidates found</div>
      </div>
    )
  }, [candFiltered])

  return (
    <div className="pipeline-wrap">
      <div className="pipeline-body">
        <div className="pipeline-panel">
          <div className="pipeline-panel-head">
            <div className="pipeline-head-search">
              <svg className="pipeline-head-search-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && (
                <button className="pipeline-head-clear" onClick={() => setSearch('')}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
            <div className="pipeline-panel-head-center">
              <h3>Candidates</h3>
              <span className="pipeline-panel-count">{candFiltered.length} of {enriched.length}</span>
            </div>
            <DateRangePicker dateFrom={candDateFrom} dateTo={candDateTo} setDateFrom={setCandDateFrom} setDateTo={setCandDateTo} />
          </div>
          <div className="pipeline-panel-scroll">
            {tableJsx}
          </div>
        </div>

        <div className="pipeline-panel pipeline-panel-summary">
            <div className="pipeline-panel-head">
              <div className="pipeline-panel-head-left">
                <span className="pipeline-summary-date">{(() => {
                  const today = new Date().toISOString().slice(0, 10)
                  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
                  if (summDateFrom === today && summDateTo === today) return 'Today'
                  if (summDateFrom === yesterday && summDateTo === yesterday) return 'Yesterday'
                  return `${summDateFrom || '…'} — ${summDateTo || '…'}`
                })()}</span>
              </div>
              <div className="pipeline-panel-head-center">
                <h3>Recruiter Summary</h3>
                <span className="pipeline-panel-count">{grandTotal} total</span>
              </div>
            <DateRangePicker align="up" dateFrom={summDateFrom} dateTo={summDateTo} setDateFrom={setSummDateFrom} setDateTo={setSummDateTo} />
          </div>
          <div className="pipeline-panel-scroll">
            <table className="pipeline-table">
              <thead>
                  <tr>
                    <th>Recruiter</th>
                    <th>CV Sourcing</th>
                    <th>Follow up</th>
                    <th>Tellecalling Done</th>
                    <th>Manager Round Schedule</th>
                    <th>Offer Accepted</th>
                    <th>Awaiting Joining</th>
                  </tr>
              </thead>
              <tbody>
                {recruiterSummary.map((g, i) => (
                  <tr key={i}>
                    <td className="cell-recruiter">{g.recruiter}</td>
                    <td className="cell-total">{g.total}</td>
                    <td className={`cell-status-count${(g.byStatus['follow up'] || 0) > 0 ? ' has-count' : ''}`}>{g.byStatus['follow up'] || 0}</td>
                    <td className={`cell-status-count${(g.byStatus['tele calling screening completed'] || 0) > 0 ? ' has-count' : ''}`}>{g.byStatus['tele calling screening completed'] || 0}</td>
                    <td className={`cell-status-count${(g.byStatus['manager round scheduled'] || 0) > 0 ? ' has-count' : ''}`}>{g.byStatus['manager round scheduled'] || 0}</td>
                    <td className={`cell-status-count${(g.byStatus['offer accepted'] || 0) > 0 ? ' has-count' : ''}`}>{g.byStatus['offer accepted'] || 0}</td>
                    <td className={`cell-status-count${(g.byStatus['hired'] || 0) > 0 ? ' has-count' : ''}`}>{g.byStatus['hired'] || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pipeline-panel-foot">
            {recruiterSummary.length} recruiter{recruiterSummary.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {modalApp && createPortal(
        <div className="modal-backdrop" onClick={() => setModalApp(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalApp(null)}>&times;</button>
            <h4>{modalApp.Candidate_Name}</h4>
            <p>{modalApp.Profile_Summary}</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default function Dashboard() {
  const { loading } = useData()
  const [show, setShow] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setShow(true))
  }, [])

  if (loading) {
    return <div className="loading"><div className="spinner" /> Loading dashboard...</div>
  }

  if (!show) {
    return (
      <div className="pipeline-wrap">
        <div className="pipeline-body">
          <div className="pipeline-panel">
            <div className="pipeline-panel-head">
              <div className="pipeline-head-search">
                <svg className="pipeline-head-search-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input type="text" placeholder="Search..." disabled />
              </div>
              <div className="pipeline-panel-head-center">
                <h3>Candidates</h3>
              </div>
            </div>
            <div className="pipeline-panel-scroll">
              <table className="pipeline-table">
                <thead>
                  <tr>
                    <th className="th-cand">Candidate</th>
                    <th className="th-status-timeline">Status / Timeline</th>
                    <th>Recruiter</th>
                    <th>CV Link</th>
                    <th className="th-profile">Profile Summary</th>
                    <th className="th-posting">Posting Title</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="skel-row">
                      <td>
                        <span className="skel-bar-line skel-bar-md" />
                        <span className="skel-bar-line skel-bar-sm" style={{ opacity: 0.5 }} />
                      </td>
                      <td>
                        <span className="skel-bar skel-bar-sm" />
                        <div className="skel-ms">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <span key={j}>
                              <span className="skel-ms-dot" />
                              {j < 4 && <span className="skel-ms-line" />}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td><span className="skel-bar skel-bar-md" /></td>
                      <td><span className="skel-bar skel-bar-sm" /></td>
                      <td><span className="skel-bar skel-bar-xl" /></td>
                      <td><span className="skel-bar skel-bar-lg" /></td>
                      <td><span className="skel-bar skel-bar-sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="pipeline-panel pipeline-panel-summary">
            <div className="pipeline-panel-head">
              <div className="pipeline-panel-head-center">
                <h3>Recruiter Summary</h3>
              </div>
            </div>
            <div className="pipeline-panel-scroll">
              <table className="pipeline-table">
                <thead>
                  <tr>
                    <th>Recruiter</th>
                    <th>CV Sourcing</th>
                    <th>Follow up</th>
                    <th>Tellecalling Done</th>
                    <th>Manager Round Schedule</th>
                    <th>Offer Accepted</th>
                    <th>Awaiting Joining</th>
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

  return <DashboardInner />
}
