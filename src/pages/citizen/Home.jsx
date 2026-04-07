import React, { useState, useEffect, useMemo } from 'react';
import { MoreHorizontal, Clock, RefreshCw, CheckCircle2, MapPin, ListFilter } from 'lucide-react';
import { subscribeToIssues } from '../../services/issues';

const timeAgo = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const badgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'badge badge-pending';
    case 'in_progress': case 'in progress': case 'review': return 'badge badge-review';
    case 'resolved': case 'completed': return 'badge badge-resolved';
    default: return 'badge badge-pending';
  }
};

export default function Home({ onNavigate }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToIssues(
      (data) => {
        setIssues(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      20
    );

    return () => unsubscribe();
  }, []);

  const pendingCount = useMemo(() => issues.filter(i => i.status?.toLowerCase() === 'pending').length, [issues]);
  const inProgressCount = useMemo(() => issues.filter(i => ['in_progress', 'in progress', 'review'].includes(i.status?.toLowerCase())).length, [issues]);
  const resolvedCount = useMemo(() => issues.filter(i => ['resolved', 'completed'].includes(i.status?.toLowerCase())).length, [issues]);

  return (
    <div className="flex-col pb-6">
      {/* Header section */}
      <div className="mt-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1F2937', marginBottom: '0.25rem' }}>
          Welcome back,<br/>
          <span style={{ color: '#7C8FF0' }}>Civic Guardian.</span>
        </h1>
        <p className="text-light text-sm" style={{ marginTop: '0.5rem', lineHeight: '1.4' }}>
          Your neighborhood is 82% resolved<br/>this month. Keep it up!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 flex-col gap-4">
        {/* Pending Card */}
        <div style={{ backgroundColor: '#FFE4B5', padding: '1.25rem', borderRadius: '16px' }}>
          <div className="flex-row justify-between items-center mb-4">
            <MoreHorizontal color="#B45309" size={20} />
            <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#B45309', background: 'rgba(255,255,255,0.4)', padding: '4px 8px', borderRadius: '12px' }}>STATUS</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#B45309', marginBottom: '2px' }}>{String(pendingCount).padStart(2, '0')}</div>
          <div style={{ fontSize: '0.8rem', color: '#B45309' }}>Pending Issues</div>
        </div>

        {/* Under Review Card */}
        <div style={{ backgroundColor: '#BBC6FF', padding: '1.25rem', borderRadius: '16px' }}>
          <div className="flex-row justify-between items-center mb-4">
            <RefreshCw color="#1E3A8A" size={20} />
            <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#1E3A8A', background: 'rgba(255,255,255,0.4)', padding: '4px 8px', borderRadius: '12px' }}>IN PROGRESS</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1E3A8A', marginBottom: '2px' }}>{String(inProgressCount).padStart(2, '0')}</div>
          <div style={{ fontSize: '0.8rem', color: '#1E3A8A' }}>Under Review</div>
        </div>

        {/* Completed Card */}
        <div style={{ backgroundColor: '#9EF0C2', padding: '1.25rem', borderRadius: '16px' }}>
          <div className="flex-row justify-between items-center mb-4">
            <CheckCircle2 color="#047857" size={20} />
            <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#047857', background: 'rgba(255,255,255,0.4)', padding: '4px 8px', borderRadius: '12px' }}>COMPLETED</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#047857', marginBottom: '2px' }}>{String(resolvedCount).padStart(2, '0')}</div>
          <div style={{ fontSize: '0.8rem', color: '#047857' }}>Resolved This Year</div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="mt-8">
        <div className="flex-row justify-between items-center mb-4">
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Active Heatmap</h2>
          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#7C8FF0', letterSpacing: '0.05em' }}>EXPAND VIEW</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '240px', 
          backgroundColor: '#E5E7EB', 
          borderRadius: '16px',
          backgroundImage: 'radial-gradient(#D1D5DB 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Map placeholder elements */}
          <div style={{ position: 'absolute', top: '40%', left: '30%' }}>
            <MapPin fill="#FFE4B5" color="#B45309" size={28} />
          </div>
          <div style={{ position: 'absolute', top: '60%', left: '55%' }}>
            <MapPin fill="#BBC6FF" color="#1E3A8A" size={28} />
          </div>
          <div style={{ position: 'absolute', top: '65%', left: '70%' }}>
            <MapPin fill="#9EF0C2" color="#047857" size={28} />
          </div>

          <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '8px', borderRadius: '20px', display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '0.6rem', fontWeight: '600', color: '#4B5563' }}>
            <span className="flex-row items-center gap-2"><div style={{width: 8, height: 8, borderRadius: '50%', background: '#FFE4B5'}}></div> UNRESOLVED</span>
            <span className="flex-row items-center gap-2"><div style={{width: 8, height: 8, borderRadius: '50%', background: '#BBC6FF'}}></div> ACTIVE</span>
            <span className="flex-row items-center gap-2"><div style={{width: 8, height: 8, borderRadius: '50%', background: '#9EF0C2'}}></div> RESOLVED</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="flex-row justify-between items-center mb-4">
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Recent Activity</h2>
          <ListFilter size={18} color="#6B7280" />
        </div>

        <div className="flex-col gap-4">
          {issues.length === 0 && !loading && (
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>No issues reported yet.</div>
          )}
          {issues.map((issue) => (
            <div key={issue.id} onClick={() => onNavigate('details', issue.id)} role="button" tabIndex={0} style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '16px', display: 'flex', gap: '1rem', cursor: 'pointer' }}>
              {issue.beforeImageUrl ? (
                <img src={issue.beforeImageUrl} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} alt={issue.category || 'Issue'} />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={24} color="#7C8FF0" />
                </div>
              )}
              <div className="flex-col justify-center flex-1">
                <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>{issue.category || 'Uncategorized'}</h3>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{issue.description || 'No description'}</p>
                <div className="flex-row items-center gap-2 mt-2">
                  <span className={badgeClass(issue.status)}>{(issue.status || 'pending').toUpperCase()}</span>
                  <span style={{ fontSize: '0.65rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10} /> {timeAgo(issue.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


