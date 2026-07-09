import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

function toInputStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmt(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DateRangePicker({ dateFrom, dateTo, setDateFrom, setDateTo }) {
  const [show, setShow] = useState(false)
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [hoverDate, setHoverDate] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setShow(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = useCallback(ds => {
    if (!dateFrom || (dateFrom && dateTo)) {
      setDateFrom(ds)
      setDateTo('')
    } else if (dateFrom && !dateTo) {
      if (ds < dateFrom) { setDateTo(dateFrom); setDateFrom(ds) }
      else setDateTo(ds)
      setTimeout(() => setShow(false), 200)
    }
  }, [dateFrom, dateTo, setDateFrom, setDateTo])

  function applyPreset(from, to) {
    setDateFrom(from)
    setDateTo(to)
    setTimeout(() => setShow(false), 200)
  }

  function todayStr() { return toInputStr(new Date()) }
  function yesterdayStr() {
    const d = new Date(); d.setDate(d.getDate() - 1); return toInputStr(d)
  }
  function last7Str() {
    const d = new Date(); d.setDate(d.getDate() - 6); return toInputStr(d)
  }

  const days = useMemo(() => {
    const y = calMonth.getFullYear(), m = calMonth.getMonth()
    const fd = new Date(y, m, 1).getDay()
    const dim = new Date(y, m + 1, 0).getDate()
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayStr = toInputStr(today)
    const cells = []
    for (let i = 0; i < fd; i++) cells.push(<div key={`e${i}`} className="cal-cell cal-empty" />)
    for (let d = 1; d <= dim; d++) {
      const dt = new Date(y, m, d), ds = toInputStr(dt)
      const isFrom = ds === dateFrom, isTo = ds === dateTo
      const isPast = dt < today
      const isToday = ds === todayStr
      let inRange = false, inPreview = false
      if (dateFrom && dateTo) {
        const f = new Date(dateFrom + 'T00:00:00'), t = new Date(dateTo + 'T00:00:00')
        inRange = dt > f && dt < t
      } else if (dateFrom && !dateTo && hoverDate) {
        const f = new Date(dateFrom + 'T00:00:00')
        inPreview = hoverDate > f ? (dt > f && dt <= hoverDate) : (dt >= hoverDate && dt < f)
      }
      let cls = 'cal-cell'
      if (isFrom) cls += ' cal-from'
      if (isTo) cls += ' cal-to'
      if (inRange) cls += ' cal-range'
      if (inPreview) cls += ' cal-preview'
      if (isToday) cls += ' cal-today'
      if (isPast && !isFrom && !isTo) cls += ' cal-past'
      cells.push(
        <div key={d} className={cls} onClick={() => handleClick(ds)}
          onMouseEnter={() => !dateTo && dateFrom && setHoverDate(dt)}>{d}</div>
      )
    }
    return cells
  }, [calMonth, dateFrom, dateTo, hoverDate, handleClick])

  return (
    <div className="date-picker-wrap" ref={ref}>
      <button className="date-pill" onClick={() => setShow(p => !p)}>
        <svg className="date-pill-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="date-pill-text">{dateFrom || dateTo ? `${fmt(dateFrom) || 'Start'} — ${fmt(dateTo) || 'End'}` : 'Select dates'}</span>
        {dateFrom || dateTo ? <button className="date-pill-clear" onClick={e => { e.stopPropagation(); setDateFrom(''); setDateTo(''); setHoverDate(null) }}>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button> : null}
        <svg className={`date-pill-arrow${show ? ' open' : ''}`} viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div className={`date-dropdown${show ? ' open' : ''}`}>
        <div className="date-presets">
          <button className="date-preset-btn" onClick={() => applyPreset(todayStr(), todayStr())}>Today</button>
          <button className="date-preset-btn" onClick={() => applyPreset(yesterdayStr(), yesterdayStr())}>Yesterday</button>
          <button className="date-preset-btn" onClick={() => applyPreset(last7Str(), todayStr())}>Last 7 days</button>
        </div>
        <div className="date-calendar">
          <div className="cal-header">
            <button className="cal-nav" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}>&lsaquo;</button>
            <span className="cal-title">{calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            <button className="cal-nav" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}>&rsaquo;</button>
          </div>
          <div className="cal-weekdays">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="cal-weekday">{d}</div>)}
          </div>
          <div className="cal-grid">{days}</div>
          <div className="cal-footer">
            <span className="cal-range-label">{dateFrom || dateTo ? `${fmt(dateFrom) || '?'} — ${fmt(dateTo) || '?'}` : 'Select start date'}</span>
            <button className="cal-clear" onClick={() => { setDateFrom(''); setDateTo(''); setHoverDate(null) }}>Clear</button>
          </div>
        </div>
      </div>
    </div>
  )
}
