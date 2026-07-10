import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { fetchSummary, fetchRequisitions, fetchApplications, fetchCalls } from '../services/api'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [summary, setSummary] = useState(null)
  const [requisitions, setRequisitions] = useState([])
  const [applications, setApplications] = useState([])
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef(null)

  const load = useCallback(async (silent) => {
    if (!silent) setLoading(true)
    try {
      const [s, r, a, c] = await Promise.all([
        fetchSummary(),
        fetchRequisitions(),
        fetchApplications(),
        fetchCalls()
      ])
      setSummary(s)
      setRequisitions(r)
      setApplications(a)
      setCalls(c)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(false)
  }, [load])

  useEffect(() => {
    intervalRef.current = setInterval(() => load(true), 20000)
    return () => clearInterval(intervalRef.current)
  }, [load])

  return (
    <DataContext.Provider value={{ summary, requisitions, applications, calls, loading, refresh: () => load(true) }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
