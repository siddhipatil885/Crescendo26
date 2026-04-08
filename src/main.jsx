import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from './services/firebase'
import App from './App'
import MobileLayout from './components/MobileLayout'
import AuthFlow from './pages/auth/AuthFlow'
import WorkerAuth, { isWorkerAuthorized } from './pages/auth/WorkerAuth'
import AdminDashboard from './pages/admin/AdminDashboard'
import WorkerDashboard from './pages/worker/WorkerDashboard'
import TrackIssue from './pages/citizen/TrackIssue'
import TrackIssueDetails from './pages/citizen/TrackIssueDetails'
import './i18n'
import './index.css'

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    let active = true
    let authRequestId = 0

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      const requestId = ++authRequestId

      const commitUser = (nextUser) => {
        if (!active || requestId !== authRequestId) {
          return
        }

        setUser(nextUser)
      }

      if (u) {
        try {
          const tokenResult = await u.getIdTokenResult()
          if (!active || requestId !== authRequestId || auth.currentUser?.uid !== u.uid) {
            return
          }

          let isDbAdmin = false
          try {
            const q = query(collection(db, 'admins'), where('email', '==', u.email))
            const querySnapshot = await getDocs(q)
            isDbAdmin = !querySnapshot.empty
          } catch (fsErr) {
            console.warn('Firestore admin check failed in ProtectedRoute', fsErr.message)
          }

          const devAdminEmails = import.meta.env.VITE_DEV_ADMIN_EMAILS
          const isDevAdmin = Boolean(
            devAdminEmails &&
            devAdminEmails
              .split(',')
              .map((email) => email.trim())
              .filter(Boolean)
              .includes(tokenResult.claims?.email || u.email)
          )

          if (!active || requestId !== authRequestId || auth.currentUser?.uid !== u.uid) {
            return
          }

          if (tokenResult.claims?.admin || isDevAdmin || isDbAdmin) {
            commitUser(u)
          } else {
            commitUser(null)
          }
        } catch (e) {
          commitUser(null)
        }
      } else {
        commitUser(null)
      }
    })

    return () => {
      active = false
      authRequestId += 1
      unsubscribe()
    }
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

function WorkerProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    let active = true
    let authRequestId = 0

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      const requestId = ++authRequestId

      const commitUser = (nextUser) => {
        if (!active || requestId !== authRequestId) {
          return
        }

        setUser(nextUser)
      }

      if (u) {
        try {
          const tokenResult = await u.getIdTokenResult()
          if (!active || requestId !== authRequestId || auth.currentUser?.uid !== u.uid) {
            return
          }

          if (await isWorkerAuthorized(u, tokenResult)) {
            if (!active || requestId !== authRequestId || auth.currentUser?.uid !== u.uid) {
              return
            }

            commitUser(u)
          } else {
            commitUser(null)
          }
        } catch (e) {
          commitUser(null)
        }
      } else {
        commitUser(null)
      }
    })

    return () => {
      active = false
      authRequestId += 1
      unsubscribe()
    }
  }, [])

  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', color: 'white' }}>
        <div className="animate-spin" style={{ width: '2rem', height: '2rem', border: '2px solid #14B8A6', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
      </div>
    )
  }

  if (user === null) {
    return <Navigate to="/worker/login" replace />
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
        <Route path="/worker/login" element={<WorkerAuth />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/worker/dashboard"
          element={
            <WorkerProtectedRoute>
              <WorkerDashboard />
            </WorkerProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
