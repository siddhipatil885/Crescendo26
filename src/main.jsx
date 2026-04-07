import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './services/firebase'
import App from './App'
import AuthFlow from './pages/auth/AuthFlow'
import AdminDashboard from './pages/admin/AdminDashboard'
import './index.css'

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const tokenResult = await u.getIdTokenResult()
          if (tokenResult.claims?.admin) {
            setUser(u)
          } else {
            setUser(null)
          }
        } catch (e) {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    })
    return () => unsubscribe()
  }, [])

  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', color: 'white' }}>
        <div className="animate-spin" style={{ width: '2rem', height: '2rem', border: '2px solid #F97316', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
      </div>
    )
  }

  if (user === null) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

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
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
