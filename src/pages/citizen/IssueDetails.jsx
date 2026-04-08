import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, UserCheck, ShieldCheck, MapPin, Loader2, Camera, Bell, ArrowBigUp } from 'lucide-react';
import MapView from '../../components/map/MapView';
import { subscribeToIssue, updateIssue, upvoteIssue } from '../../services/issues';
import { uploadToCloudinary } from '../../services/storage';
import { computeEscalationStatus, formatCountdown, getIssueImage } from '../../utils/escalation';
import { ACTIVE_ISSUE_STATUSES, ISSUE_STATUS, RESOLVED_ISSUE_STATUSES, isPendingStatus, isResolvedStatus, statusEquals } from '../../utils/constants';
import { enableIssueNotifications, isTrackingIssue } from '../../utils/notifications';
import { hasUpvoted, markUpvoted } from '../../utils/upvote';

export default function IssueDetails({ issueId, isAdmin }) {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => isTrackingIssue(issueId));
  const [now, setNow] = useState(() => new Date());
  const [showRTI, setShowRTI] = useState(false);
  const verifyInputRef = useRef(null);

  useEffect(() => {
    if (!issueId) {
      setLoading(false);
      setError('No issue ID provided');
      return;
    }

    const unsubscribe = subscribeToIssue(
      issueId,
      (data) => {
        setIssue(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [issueId]);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setNotificationsEnabled(isTrackingIssue(issueId));
  }, [issueId]);

  const handleShareResolution = () => {
    if (navigator.share) {
      navigator.share({
        title: 'CIVIX Resolution',
        text: `Check out this issue on CIVIX: ${issue?.category}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const updateStatus = async (newStatus) => {
    setIsUpdating(true);
    try {
      await updateIssue(issueId, { status: newStatus });
    } catch (err) {
      console.error('Status update error:', err);
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const badgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'badge badge-pending';
      case 'in_progress': case 'in progress': case 'review': return 'badge badge-review';
      case 'rti generated': return 'badge badge-review';
      case 'escalated to mla': return 'badge badge-pending';
      case 'resolved': case 'completed': return 'badge badge-resolved';
      case 'verified': return 'badge badge-resolved';
      default: return 'badge badge-pending';
    }
  };

  const handleTrackNotifications = async () => {
    const result = await enableIssueNotifications(issueId);
    setNotificationsEnabled(result.enabled || isTrackingIssue(issueId));
  };

  const handleUpvote = async () => {
    if (!issueId || hasUpvoted(issueId) || isUpvoting) {
      return;
    }

    setIsUpvoting(true);

    try {
      await upvoteIssue(issueId);
      markUpvoted(issueId);
    } catch (error) {
      console.error('Upvote failed:', error);
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleVerify = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsVerifying(true);
    try {
      const afterImageUrl = await uploadToCloudinary(file);
      await updateIssue(issueId, {
        afterImage: afterImageUrl,
        status: ISSUE_STATUS.VERIFIED
      });
      // onSnapshot handles the refresh
    } catch (err) {
      console.error('Verification error:', err);
      alert(`Verification failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
      if (verifyInputRef.current) verifyInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex-col items-center justify-center" style={{ height: '60vh' }}>
        <Loader2 size={32} color="#7C8FF0" className="animate-spin" />
        <p style={{ marginTop: '1rem', color: '#6B7280' }}>Loading issue...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="flex-col items-center justify-center" style={{ height: '60vh', color: '#6B7280' }}>
        <p>{error || 'Issue not found'}</p>
      </div>
    );
  }

  const currentStatus = issue.status?.toLowerCase();
  const escalationStatus = computeEscalationStatus(issue, now);
  const countdown = formatCountdown(issue, now);
  const beforeImage = getIssueImage(issue, 'before');
  const afterImage = getIssueImage(issue, 'after');
  const rtiText = generateRTI(issue, escalationStatus);
  const escalationStages = ['Pending', 'In Progress', 'RTI Generated', 'Escalated to MLA', 'Resolved'];
  const stageIndex = Math.max(0, escalationStages.findIndex((stage) => stage.toLowerCase() === escalationStatus.toLowerCase()));

  return (
    <div className="flex-col pb-6">
      {/* Header */}
      <div className="mt-4 mb-4">
        <div className="flex-row gap-2 mb-3">
          <span className={badgeStyle(escalationStatus)}>{escalationStatus.toUpperCase()}</span>
          <span className="badge" style={{ backgroundColor: '#EEF2FF', color: '#7C8FF0' }}>{issue.category || 'UNCATEGORIZED'}</span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1F2937', marginBottom: '0.5rem', lineHeight: '1.2' }}>
          {issue.category || 'Issue Details'}
        </h1>
        <p className="text-light text-sm" style={{ lineHeight: '1.5' }}>
          {issue.description || issue.text || 'No description provided.'}
        </p>
        <div className="flex-row items-center gap-2 mt-3" style={{ fontSize: '0.75rem', color: '#6B7280' }}>
          <ShieldCheck size={14} color="#7C8FF0" />
          <span>Deadline: {countdown}</span>
        </div>
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#4B5563', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem' }}>ADMIN CONTROLS</div>
          <div className="flex-row gap-3">
            {isPendingStatus(currentStatus) && (
              <button 
                onClick={() => updateStatus(ISSUE_STATUS.IN_PROGRESS)}
                disabled={isUpdating}
                style={{ backgroundColor: '#1E3A8A', color: 'white', flex: 1, padding: '0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', opacity: isUpdating ? 0.7 : 1 }}
              >
                {isUpdating ? 'Updating...' : 'Move to In Progress'}
              </button>
            )}
            {[ISSUE_STATUS.OPEN, ISSUE_STATUS.PENDING, ...ACTIVE_ISSUE_STATUSES].some((status) => statusEquals(currentStatus, status)) && (
              <button 
                onClick={() => updateStatus(ISSUE_STATUS.RESOLVED)}
                disabled={isUpdating}
                style={{ backgroundColor: '#047857', color: 'white', flex: 1, padding: '0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', opacity: isUpdating ? 0.7 : 1 }}
              >
                {isUpdating ? 'Updating...' : 'Mark Resolved'}
              </button>
            )}
            {[ISSUE_STATUS.RESOLVED, ISSUE_STATUS.VERIFIED].some((status) => statusEquals(currentStatus, status)) && (
               <button 
               onClick={() => updateStatus(ISSUE_STATUS.PENDING)}
               disabled={isUpdating}
               style={{ backgroundColor: '#F3F4F6', color: '#4B5563', flex: 1, padding: '0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', border: '1px solid #E5E7EB' }}
             >
               Reset to Pending
             </button>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex-col gap-4 relative">
          {/* Vertical line connecting timeline */}
          <div style={{ position: 'absolute', left: '16px', top: '24px', bottom: '24px', width: '2px', backgroundColor: '#E5E7EB', zIndex: 1 }}></div>
          
          <TimelineItem icon={<CheckCircle2 size={16} color="#047857" />} title="REPORTED" date={formatDate(issue.createdAt)} active={true} />
          <TimelineItem 
            icon={<UserCheck size={16} color={ACTIVE_ISSUE_STATUSES.concat(RESOLVED_ISSUE_STATUSES).some((status) => statusEquals(currentStatus, status)) ? '#047857' : '#9CA3AF'} />} 
            title="IN PROGRESS" 
            date={ACTIVE_ISSUE_STATUSES.concat(RESOLVED_ISSUE_STATUSES).some((status) => statusEquals(currentStatus, status)) ? 'Started' : 'Pending'} 
            active={ACTIVE_ISSUE_STATUSES.concat(RESOLVED_ISSUE_STATUSES).some((status) => statusEquals(currentStatus, status))} 
          />
          <TimelineItem 
            icon={<CheckCircle2 size={16} color={isResolvedStatus(currentStatus) ? '#047857' : '#9CA3AF'} />} 
            title="RESOLVED" 
            date={isResolvedStatus(currentStatus) ? 'Done' : 'Pending'} 
            active={isResolvedStatus(currentStatus)} 
            bg={isResolvedStatus(currentStatus) ? '#9EF0C2' : '#F3F4F6'} 
          />
        </div>
      </div>

      {/* Escalation Stages */}
      <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>ESCALATION STAGES</div>
        <div className="flex-col gap-2">
          {escalationStages.map((stage, idx) => {
            const isActive = idx <= stageIndex;
            return (
              <div key={stage} className="flex-row items-center gap-2">
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: isActive ? '#1D4ED8' : '#D1D5DB' }} />
                <span style={{ fontSize: '0.8rem', color: isActive ? '#111827' : '#9CA3AF', fontWeight: isActive ? '600' : '500' }}>{stage}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Before/After Images */}
      <div className="mb-6 flex flex-col gap-4">
        {!beforeImage && !afterImage && (
          <div style={{ backgroundColor: '#F3F4F6', borderRadius: '16px', padding: '1rem', color: '#6B7280', fontSize: '0.85rem' }}>
            No before/after images available yet.
          </div>
        )}
        {/* Before */}
        {beforeImage && (
          <div style={{ backgroundColor: '#EEF2F6', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: '160px' }}>
              <img src={beforeImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Before" />
              <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: '#991B1B', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase' }}>BEFORE</div>
            </div>
            <div style={{ padding: '1rem' }}>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>Original Issue</div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{issue.description || issue.text || 'Issue reported by citizen.'}</div>
            </div>
          </div>
        )}

        {/* After */}
        {afterImage && (
          <div style={{ backgroundColor: '#EEF2F6', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: '160px' }}>
              <img src={afterImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="After" />
              <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: '#047857', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase' }}>AFTER</div>
            </div>
            <div style={{ padding: '1rem' }}>
              <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>Resolved State</div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Issue has been resolved. {currentStatus === 'verified' && "The resolution has been verified by the community."}</div>
            </div>
          </div>
        )}
      </div>

      {/* Efficiency Impact */}
      <div style={{ backgroundColor: '#F3F4F6', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem' }}>ISSUE INFO</div>
        
        <div className="flex-row justify-between mb-3">
          <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>Status</span>
          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1E3A8A' }}>{escalationStatus.toUpperCase()}</span>
        </div>
        <div className="flex-row justify-between mb-3">
          <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>Countdown</span>
          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1E3A8A' }}>{countdown}</span>
        </div>
        <div className="flex-row justify-between mb-3">
          <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>Category</span>
          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1F2937' }}>{issue.category || 'N/A'}</span>
        </div>
        <div className="flex-row justify-between mb-4">
          <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>Location</span>
          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1F2937' }}>{issue.lat ? `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}` : 'N/A'}</span>
        </div>

        <div className="flex-row gap-3 mb-3">
          <button
            onClick={handleUpvote}
            disabled={isUpvoting || hasUpvoted(issueId)}
            style={{ flex: 1, backgroundColor: '#FFF7ED', color: '#B45309', padding: '0.8rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isUpvoting || hasUpvoted(issueId) ? 0.7 : 1 }}
          >
            <ArrowBigUp size={16} />
            {hasUpvoted(issueId) ? `Upvoted (${issue.upvotes || 0})` : `Upvote (${issue.upvotes || 0})`}
          </button>
          <button
            onClick={handleTrackNotifications}
            style={{ flex: 1, backgroundColor: '#EEF2FF', color: '#4C5FD5', padding: '0.8rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Bell size={16} />
            {notificationsEnabled ? 'Tracking On' : 'Track Updates'}
          </button>
        </div>

        <button 
          onClick={handleShareResolution}
          style={{ backgroundColor: '#5C6BC0', color: 'white', width: '100%', padding: '0.8rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' }}
        >
          Share Issue
        </button>
      </div>

      {/* RTI Generator */}
      <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>RTI NOTICE</div>
        <p style={{ fontSize: '0.8rem', color: '#4B5563', marginBottom: '0.75rem' }}>Generate a ready-to-send RTI notice for this issue.</p>
        <button
          onClick={() => setShowRTI((prev) => !prev)}
          style={{ backgroundColor: '#111827', color: 'white', width: '100%', padding: '0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', marginBottom: showRTI ? '0.75rem' : 0 }}
        >
          {showRTI ? 'Hide RTI Text' : 'Generate RTI Notice'}
        </button>
        {showRTI && (
          <div>
            <textarea
              readOnly
              value={rtiText}
              rows={7}
              style={{ width: '100%', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '0.75rem', fontSize: '0.8rem', color: '#374151', backgroundColor: '#F9FAFB' }}
            />
            <button
              onClick={() => navigator.clipboard?.writeText(rtiText)}
              style={{ marginTop: '0.6rem', backgroundColor: '#F3F4F6', color: '#111827', width: '100%', padding: '0.7rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', border: '1px solid #E5E7EB' }}
            >
              Copy RTI Text
            </button>
          </div>
        )}
      </div>

      {/* Twitter Escalation */}
      {escalationStatus.toLowerCase() === 'escalated to mla' && (
        <div style={{ backgroundColor: '#EFF6FF', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #DBEAFE' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#1D4ED8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>ESCALATION</div>
          <p style={{ fontSize: '0.8rem', color: '#1E40AF', marginBottom: '0.75rem' }}>This issue has crossed the 7-day window. Notify your MLA publicly.</p>
          <button
            onClick={() => window.open(buildTweetUrl(issue, escalationStatus), '_blank', 'noopener')}
            style={{ backgroundColor: '#1D4ED8', color: 'white', width: '100%', padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' }}
          >
            Notify MLA on Twitter
          </button>
        </div>
      )}

      {/* Verify Resolution */}
      {isAdmin && statusEquals(currentStatus, ISSUE_STATUS.RESOLVED) && (
        <div style={{ backgroundColor: '#EFFFF4', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#047857', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>UPLOAD AFTER PHOTO</div>
          <p style={{ fontSize: '0.8rem', color: '#374151', marginBottom: '1rem', lineHeight: '1.4' }}>Upload an "after" photo to verify this issue has been resolved.</p>
          <input 
            type="file" 
            accept="image/*" 
            ref={verifyInputRef} 
            style={{ display: 'none' }} 
            onChange={handleVerify}
          />
          <button 
            onClick={() => verifyInputRef.current?.click()}
            disabled={isVerifying}
            style={{ backgroundColor: '#047857', color: 'white', width: '100%', padding: '0.8rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600', opacity: isVerifying ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            {isVerifying ? 'Uploading...' : 'Upload After Photo'}
          </button>
        </div>
      )}

      {afterImage && (
        <div style={{ backgroundColor: '#ECFDF3', padding: '0.9rem 1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #D1FAE5', color: '#047857', fontSize: '0.8rem', fontWeight: '600' }}>
          This issue has been resolved and verified.
        </div>
      )}

      {/* Map block */}
      <div style={{ height: '240px', backgroundColor: '#EEF2FF', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
        {issue.lat != null && issue.lng != null ? (
          <MapView
            issues={[issue]}
            center={[Number(issue.lat), Number(issue.lng)]}
            zoom={14}
            variant="compact"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6B7280' }}>
            <MapPin size={32} color="#7C8FF0" style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '0.85rem' }}>Location unavailable</span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function generateRTI(issue, escalationStatus) {
  const createdAt = issue?.createdAt?.toDate ? issue.createdAt.toDate() : new Date(issue?.createdAt || Date.now());
  const createdDate = createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return [
    'RTI Notice:',
    `Issue: ${issue?.description || issue?.text || 'N/A'}`,
    `Category: ${issue?.category || 'N/A'}`,
    `Department: ${issue?.department || 'N/A'}`,
    `Date: ${createdDate}`,
    `Status: ${escalationStatus}`,
  ].join('\n');
}

function buildTweetUrl(issue, escalationStatus) {
  const text = [
    'Escalation Alert:',
    issue?.category ? `${issue.category} issue` : 'Civic issue',
    issue?.description || issue?.text ? `(${issue.description || issue.text})` : '',
    `Status: ${escalationStatus}.`,
    'Please resolve urgently.',
  ].join(' ');
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  return url;
}

function TimelineItem({ icon, title, date, active, bg }) {
  return (
    <div className="flex-row items-center gap-4" style={{ zIndex: 2 }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: bg || (active ? '#9EF0C2' : '#F3F4F6'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div className="flex-col">
        <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: active ? '#374151' : '#9CA3AF', textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{date}</div>
      </div>
    </div>
  );
}
