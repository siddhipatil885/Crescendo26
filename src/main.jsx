import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import AuthFlow from './pages/auth/AuthFlow'
import AdminDashboard from './pages/admin/AdminDashboard'
import MobileLayout from './components/MobileLayout'
import './index.css'

function AdminDashboardPage() {
  return (
    <div style={{ backgroundColor: '#111827', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        height: '850px',
        maxHeight: '100vh',
        backgroundColor: 'var(--bg-color)',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
        borderRadius: '30px',
        position: 'relative'
      }}>
        <div className="mobile-container">
          <header className="top-bar">
            <div className="top-bar-logo">CIVIX</div>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#F97316', letterSpacing: '0.05em', backgroundColor: '#FFF7ED', padding: '4px 8px', borderRadius: '8px' }}>ADMIN</span>
          </header>
          <main className="content-area">
            <AdminDashboard />
          </main>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin/login" element={<AuthFlow />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
