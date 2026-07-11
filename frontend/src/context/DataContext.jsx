import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { fetchSummary, fetchRequisitions, fetchApplications, fetchCalls } from '../services/api'

const DataContext = createContext(null)

const POLL_INTERVAL = 30000

export function DataProvider({ children }) {
  const [summary, setSummary] = useState(null)
  const [requisitions, setRequisitions] = useState([])
  const [applications, setApplications] = useState([])
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  const load = useCallback(async (silent) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const settled = await Promise.allSettled([
        fetchSummary(),
        fetchRequisitions(),
        fetchApplications(),
        fetchCalls()
      ])
      if (settled[0].status === 'fulfilled') setSummary(settled[0].value)
      if (settled[1].status === 'fulfilled') setRequisitions(settled[1].value)
      if (settled[2].status === 'fulfilled') setApplications(settled[2].value)
      if (settled[3].status === 'fulfilled') setCalls(settled[3].value)
      const failures = settled.filter(s => s.status === 'rejected')
      if (failures.length > 0) {
        console.error('Failed to load some data:', failures.map(f => f.reason))
        if (failures.length === settled.length) setError('Failed to load dashboard data')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(false)
  }, [load])

  useEffect(() => {
    function tick() {
      if (document.visibilityState === 'visible') load(true)
    }
    intervalRef.current = setInterval(tick, POLL_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [load])

  return (
    <DataContext.Provider value={{ summary, requisitions, applications, calls, loading, error, refresh: () => load(true) }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
