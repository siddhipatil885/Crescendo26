import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './services/firebase'
import App from './App'
import MobileLayout from './components/MobileLayout'
import AuthFlow from './pages/auth/AuthFlow'
import AdminDashboard from './pages/admin/AdminDashboard'
import TrackIssue from './pages/citizen/TrackIssue'
import TrackIssueDetails from './pages/citizen/TrackIssueDetails'
import './i18n'
import './index.css'

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const tokenResult = await u.getIdTokenResult()
          const devAdminEmails = import.meta.env.VITE_DEV_ADMIN_EMAILS;
          const isDevAdmin = devAdminEmails && devAdminEmails.split(',').includes(tokenResult.claims?.email || u.email);
          
          if (tokenResult.claims?.admin || isDevAdmin) {
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
  return <AdminDashboard />
}

function TrackIssuePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialToken = new URLSearchParams(location.search).get('token') ?? ''

  const handleTabChange = (tabId) => {
    if (tabId === 'track') {
      return
    }

    navigate('/', { state: { activeTab: tabId } })
  }

  return (
    <div className="app-shell">
      <div className="mobile-frame">
        <MobileLayout
          activeTab="track"
          onTabChange={handleTabChange}
        >
          <TrackIssue initialToken={initialToken} />
        </MobileLayout>
      </div>
    </div>
  )
}

function TrackedIssueDetailsPage() {
  const navigate = useNavigate()

  const handleTabChange = (tabId) => {
    if (tabId === 'track') {
      navigate('/track')
      return
    }

    navigate('/', { state: { activeTab: tabId } })
  }

  return (
    <div className="app-shell">
      <div className="mobile-frame">
        <MobileLayout
          activeTab="track"
          onTabChange={handleTabChange}
        >
          <TrackIssueDetails />
        </MobileLayout>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/track" element={<TrackIssuePage />} />
        <Route path="/track/:tokenId" element={<TrackedIssueDetailsPage />} />
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
