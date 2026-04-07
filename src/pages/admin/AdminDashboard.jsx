import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, CheckCircle2, Clock, Loader2, LogOut } from 'lucide-react';
import { subscribeToIssues, updateIssue } from '../../services/issues';
import { ISSUE_STATUS, isInProgressStatus, isPendingStatus, isResolvedStatus, statusEquals } from '../../utils/constants';
import { timeAgo } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../auth/AuthFlow';

const statusBadge = (status) => {
  const s = status?.toLowerCase();
  if (isPendingStatus(s)) return { bg: '#FFE4B5', color: '#B45309', label: 'PENDING' };
  if (isInProgressStatus(s)) return { bg: '#A8BAFA', color: '#1E3A8A', label: 'IN PROGRESS' };
  if (isResolvedStatus(s)) return { bg: '#C6F6D5', color: '#047857', label: 'RESOLVED' };
  return { bg: '#F3F4F6', color: '#6B7280', label: 'UNKNOWN' };
};

export default function AdminDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

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
      50
    );
    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const total = issues.length;
    const pending = issues.filter(i => isPendingStatus(i.status)).length;
    const inProgress = issues.filter(i => isInProgressStatus(i.status)).length;

    const today = new Date().setHours(0,0,0,0);
    const resolvedToday = issues.filter(i => {
      if (!isResolvedStatus(i.status)) return false;
      const ts = i.updatedAt || i.updated_at;
      const updatedDate = ts?.toDate ? ts.toDate().setHours(0,0,0,0) : null;
      return updatedDate === today;
    }).length;

    return { total, pending, inProgress, resolvedToday };
  }, [issues]);

  const handleArchive = async (id) => {
    try {
      await updateIssue(id, { archived: true });
      alert("Issue archived successfully.");
    } catch (err) {
      alert("Failed to archive: " + err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateIssue(id, { status: newStatus });
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex-col pb-6">
      {/* Header with Logout */}
      <div className="mt-6 mb-6">
        <div className="flex-row justify-between items-center mb-2">
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1F2937' }}>
            Issue Management
          </h1>
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: 'white' }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
        <p className="text-light text-sm mt-2" style={{ lineHeight: '1.4' }}>
          Review and update the status of citizen<br/>reports in real-time.
        </p>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', color: '#991B1B', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats */}
      <div className="flex-col gap-4 mb-6">
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>TOTAL REPORTS</div>
          <div className="flex-row items-baseline gap-2">
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1F2937' }}>{stats.total.toLocaleString()}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#047857' }}>Live</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#FAF0E6', padding: '1.25rem', borderRadius: '16px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#92400E', textTransform: 'uppercase', marginBottom: '0.5rem' }}>PENDING REVIEW</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#92400E' }}>{stats.pending}</div>
        </div>

        <div style={{ backgroundColor: '#EEF2FF', padding: '1.25rem', borderRadius: '16px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#1E3A8A', textTransform: 'uppercase', marginBottom: '0.5rem' }}>IN PROGRESS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1E3A8A' }}>{stats.inProgress}</div>
        </div>

        <div style={{ backgroundColor: '#DCFCE7', padding: '1.25rem', borderRadius: '16px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#065F46', textTransform: 'uppercase', marginBottom: '0.5rem' }}>RESOLVED (TODAY)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#065F46' }}>{stats.resolvedToday}</div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-col gap-6">
        {loading && (
          <div className="flex-col items-center py-10">
            <Loader2 size={32} className="animate-spin" color="#6B7280" />
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6B7280' }}>Loading live data...</p>
          </div>
        )}

        {!loading && issues.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'white', borderRadius: '16px', color: '#6B7280', fontSize: '0.9rem' }}>
            No reports found in the system.
          </div>
        )}

        {issues.map(issue => {
          const badge = statusBadge(issue.status);
          const currentStatus = issue.status?.toLowerCase();
          return (
            <div key={issue.id} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB' }}>
              <div style={{ height: '140px', position: 'relative' }}>
                <img src={issue.beforeImage || issue.beforeImageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&h=300&fit=crop'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={issue.category} />
                {statusEquals(issue.status, ISSUE_STATUS.VERIFIED) && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#047857', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: '700' }}>VERIFIED</div>
                )}
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div className="flex-row items-center gap-2 mb-2">
                  <span style={{ fontSize: '0.65rem', fontWeight: '600', backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', color: '#6B7280' }}>
                    ID: #{issue.id?.slice(-4).toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={10} /> {timeAgo(issue.createdAt || issue.reported_at)}
                  </span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1F2937' }}>
                  {issue.category || 'Uncategorized Report'}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '1rem', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {issue.description || issue.text || 'No description provided.'}
                </p>
                <div className="flex-row items-center gap-1 mb-4">
                  <MapPin size={12} color="#6B7280" />
                  <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                    {issue.neighbourhood || (issue.lat ? `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}` : 'Location Unavailable')}
                  </span>
                </div>

                <div style={{ backgroundColor: badge.bg, padding: '0.6rem 1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: badge.color, letterSpacing: '0.05em' }}>{badge.label}</span>
                  {isResolvedStatus(currentStatus) ? (
                    <CheckCircle2 size={16} color={badge.color} />
                  ) : (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: badge.color }}></div>
                  )}
                </div>

                {/* Admin Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {isPendingStatus(currentStatus) && (
                    <button
                      onClick={() => handleStatusChange(issue.id, ISSUE_STATUS.IN_PROGRESS)}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', backgroundColor: '#1E3A8A', color: 'white', fontSize: '0.7rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                    >
                      → In Progress
                    </button>
                  )}
                  {!isResolvedStatus(currentStatus) && (
                    <button
                      onClick={() => handleStatusChange(issue.id, ISSUE_STATUS.RESOLVED)}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', backgroundColor: '#047857', color: 'white', fontSize: '0.7rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                    >
                      ✓ Resolve
                    </button>
                  )}
                </div>

                <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em', cursor: 'pointer' }} onClick={() => handleArchive(issue.id)} role="button">ARCHIVE</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
