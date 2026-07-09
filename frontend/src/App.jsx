import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Overview from './pages/Overview'
import Dashboard from './pages/Dashboard'
import './index.css'

const navItems = [
  { path: '/', label: 'Overview', icon: '📊' },
  { path: '/dashboard', label: 'Pipeline', icon: '👥' },
]

export default function App() {
  const location = useLocation()

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">R</div>
          <span>Recruitment Hub</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-title">Main</div>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              end={item.path === '/'}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        {location.pathname !== '/dashboard' && (
          <div className="page-header">
            <div>
              <p className="page-subtitle">High-level recruitment metrics</p>
            </div>
          </div>
        )}
        <div className={`page-body${location.pathname === '/dashboard' ? ' page-body-fill page-body-no-pad' : ''}`}>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
