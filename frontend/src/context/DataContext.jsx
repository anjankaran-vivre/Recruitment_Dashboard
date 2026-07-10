import { createContext, useContext, useState, useEffect } from 'react'
import { fetchSummary, fetchRequisitions, fetchApplications, fetchCalls } from '../services/api'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [summary, setSummary] = useState(null)
  const [requisitions, setRequisitions] = useState([])
  const [applications, setApplications] = useState([])
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
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
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <DataContext.Provider value={{ summary, requisitions, applications, calls, loading }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
