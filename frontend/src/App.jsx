import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Overview from './pages/Overview'
import Dashboard from './pages/Dashboard'
import Metrics from './pages/Metrics'
import { DataProvider } from './context/DataContext'
import './index.css'

const fillPaths = ['/']
const navItems = [
  { path: '/', label: 'Pipeline' },
  { path: '/overview', label: 'Overview' },
  { path: '/metrics', label: 'Metrics' },
]

export default function App() {
  const location = useLocation()

  return (
    <DataProvider>
    <div className="app-layout">
      <header className="topbar">
        <nav className="topbar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              end={item.path === '/'}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="main-content">
        <div className={`page-body${fillPaths.includes(location.pathname) ? ' page-body-fill page-body-no-pad' : ''}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/metrics" element={<Metrics />} />
          </Routes>
        </div>
      </main>
    </div>
    </DataProvider>
  )
}
