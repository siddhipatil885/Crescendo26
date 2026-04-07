import React, { useState, useEffect, useMemo } from 'react';
import { MoreHorizontal, Clock, RefreshCw, CheckCircle2, MapPin, ListFilter } from 'lucide-react';
import { subscribeToIssues } from '../../services/issues';
import MapView from '../../components/map/MapView';
import useIssueMapData from '../../hooks/useIssueMapData';
import { computeEscalationStatus, formatCountdown, getIssueImage } from '../../utils/escalation';


const badgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'badge badge-pending';
    case 'in_progress': case 'in progress': case 'review': return 'badge badge-review';
    case 'rti generated': return 'badge badge-review';
    case 'escalated to mla': return 'badge badge-pending';
    case 'resolved': case 'completed': case 'verified': return 'badge badge-resolved';
    default: return 'badge badge-pending';
  }
};

export default function Home({ onNavigate }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const {
    issues: mapIssues,
    loading: mapLoading,
    error: mapError,
    mapCenter,
    locationError,
    userLocation,
  } = useIssueMapData();

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

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const pendingCount = useMemo(() => issues.filter(i => computeEscalationStatus(i, now).toLowerCase() === 'pending').length, [issues, now]);
  const inProgressCount = useMemo(() => {
    const activeStatuses = ['in progress', 'rti generated', 'escalated to mla'];
    return issues.filter(i => activeStatuses.includes(computeEscalationStatus(i, now).toLowerCase())).length;
  }, [issues, now]);
  const resolvedCount = useMemo(() => issues.filter(i => computeEscalationStatus(i, now).toLowerCase() === 'resolved').length, [issues, now]);
  const resolutionRate = useMemo(() => {
    if (issues.length === 0) {
      return null;
    }

    return Math.round((resolvedCount / issues.length) * 100);
  }, [issues.length, resolvedCount]);

  return (
    <div className="flex-col pb-6">
      {/* Header section */}
      <div className="mt-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1F2937', marginBottom: '0.25rem' }}>
          Neighborhood<br/>
          <span style={{ color: '#7C8FF0' }}>Issue Dashboard.</span>
        </h1>
        <p className="text-light text-sm" style={{ marginTop: '0.5rem', lineHeight: '1.4' }}>
          {resolutionRate === null
            ? 'Live updates will appear here as reports come in.'
            : `${resolutionRate}% of tracked issues are resolved right now.`}
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
          <div style={{ fontSize: '0.8rem', color: '#B45309' }}>Pending Reports</div>
        </div>

        {/* Under Review Card */}
        <div style={{ backgroundColor: '#BBC6FF', padding: '1.25rem', borderRadius: '16px' }}>
          <div className="flex-row justify-between items-center mb-4">
            <RefreshCw color="#1E3A8A" size={20} />
            <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#1E3A8A', background: 'rgba(255,255,255,0.4)', padding: '4px 8px', borderRadius: '12px' }}>IN PROGRESS</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1E3A8A', marginBottom: '2px' }}>{String(inProgressCount).padStart(2, '0')}</div>
          <div style={{ fontSize: '0.8rem', color: '#1E3A8A' }}>Active Reviews</div>
        </div>

        {/* Completed Card */}
        <div style={{ backgroundColor: '#9EF0C2', padding: '1.25rem', borderRadius: '16px' }}>
          <div className="flex-row justify-between items-center mb-4">
            <CheckCircle2 color="#047857" size={20} />
            <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#047857', background: 'rgba(255,255,255,0.4)', padding: '4px 8px', borderRadius: '12px' }}>COMPLETED</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#047857', marginBottom: '2px' }}>{String(resolvedCount).padStart(2, '0')}</div>
          <div style={{ fontSize: '0.8rem', color: '#047857' }}>Resolved Issues</div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="mt-8">
        <div className="flex-row justify-between items-center mb-4">
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Active Heatmap</h2>
          <button
            type="button"
            onClick={() => onNavigate('map')}
            style={{ fontSize: '0.7rem', fontWeight: '700', color: '#7C8FF0', letterSpacing: '0.05em' }}
          >
            EXPAND VIEW
          </button>
        </div>
        <div style={{ width: '100%', height: '240px', overflow: 'hidden', borderRadius: '16px', position: 'relative', isolation: 'isolate', zIndex: 1 }}>
          <MapView
            issues={mapIssues}
            center={mapCenter}
            zoom={13}
            loading={mapLoading}
            error={mapError}
            locationError={locationError}
            userLocation={userLocation}
            variant="compact"
            onExpand={() => onNavigate('map')}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="flex-row justify-between items-center mb-4">
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Recent Activity</h2>
          <ListFilter size={18} color="#6B7280" />
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '16px', color: '#981b1b', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="flex-col gap-4">
          {loading && (
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>Loading recent issues...</div>
          )}

          {!loading && issues.length === 0 && (
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>No issues reported yet.</div>
          )}

          {issues.map((issue) => {
            const computedStatus = computeEscalationStatus(issue, now);
            const countdown = formatCountdown(issue, now);
            const previewImage = getIssueImage(issue, 'before');
            const handleNavigateToDetails = () => onNavigate('details', issue.id);
            const handleKeyDown = (event) => {
              if (event.key === 'Enter') {
                handleNavigateToDetails();
              }

              if (event.key === ' ') {
                event.preventDefault();
                handleNavigateToDetails();
              }
            };

            return (
              <div key={issue.id} onClick={handleNavigateToDetails} onKeyDown={handleKeyDown} role="button" tabIndex={0} style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '16px', display: 'flex', gap: '1rem', cursor: 'pointer' }}>
                {previewImage ? (
                  <img src={previewImage} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} alt={issue.category || 'Issue'} />
                ) : (
                  <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={24} color="#7C8FF0" />
                  </div>
                )}
                <div className="flex-col justify-center flex-1">
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>{issue.category || 'Uncategorized'}</h3>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                    {issue.description || issue.text || 'No description'}
                  </p>
                  <div className="flex-row items-center gap-2 mt-2">
                    <span className={badgeClass(computedStatus)}>{computedStatus.toUpperCase()}</span>
                    <span style={{ fontSize: '0.65rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} /> {countdown}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
