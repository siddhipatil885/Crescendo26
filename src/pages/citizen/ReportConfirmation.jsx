import React from 'react';
import { Bell, CheckCircle2, MapPinned, Search, Ticket, Copy, Check } from 'lucide-react';
import { enableIssueNotifications } from '../../utils/notifications';

export default function ReportConfirmation({ issue, onTrackIssue }) {
  const [notificationState, setNotificationState] = React.useState('idle');
  const [copiedToken, setCopiedToken] = React.useState(false);

  if (!issue) {
    return null;
  }

  const handleEnableNotifications = async () => {
    setNotificationState('loading');
    const result = await enableIssueNotifications(issue.id);
    setNotificationState(result.enabled ? 'enabled' : 'unavailable');
  };

  const handleCopyToken = () => {
    if (issue.claimToken) {
      navigator.clipboard.writeText(issue.claimToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="flex-col pb-6">
      <div className="mt-6 mb-6">
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#EFFFF4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <CheckCircle2 color="#047857" size={28} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1F2937' }}>
          Complaint Registered
        </h1>
        <p className="text-light text-sm mt-2" style={{ lineHeight: '1.5' }}>
          Your report has been saved successfully. You can track updates, upvote the issue, and get notified when its status changes.
        </p>
      </div>

      {/* CLAIM TOKEN - PROMINENT DISPLAY */}
      {issue.claimToken && (
        <div style={{ backgroundColor: '#F0FDF4', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem', border: '2px solid #22C55E' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Your Complaint ID
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <code style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1F2937', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {issue.claimToken}
              </code>
            </div>
            <button
              onClick={handleCopyToken}
              style={{
                backgroundColor: copiedToken ? '#22C55E' : '#F3F4F6',
                border: 'none',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              {copiedToken ? (
                <Check size={18} color="#1F2937" />
              ) : (
                <Copy size={18} color="#6B7280" />
              )}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.75rem', lineHeight: '1.4' }}>
            Save this ID to track your complaint without logging in. You can verify the resolution using this token.
          </p>
        </div>
      )}

      <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', marginBottom: '1rem', border: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          Tracking Details
        </div>

        <div className="flex-row items-center gap-3 mb-3">
          <Ticket size={18} color="#7C8FF0" />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Issue ID</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#1F2937' }}>{issue.id}</div>
          </div>
        </div>

        <div className="flex-row items-center gap-3 mb-3">
          <MapPinned size={18} color="#047857" />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Neighbourhood</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1F2937' }}>{issue.neighbourhood || 'Detected from your location'}</div>
          </div>
        </div>

        <div className="flex-row items-center gap-3">
          <Search size={18} color="#B45309" />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Category</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1F2937' }}>{issue.category}</div>
          </div>
        </div>
      </div>

      <button className="btn-primary" style={{ marginBottom: '0.75rem' }} onClick={() => onTrackIssue(issue.id)}>
        Track This Issue
      </button>

      <button
        type="button"
        onClick={handleEnableNotifications}
        disabled={notificationState === 'loading'}
        style={{
          backgroundColor: '#EEF2FF',
          color: '#4C5FD5',
          width: '100%',
          padding: '0.95rem',
          borderRadius: '12px',
          fontSize: '0.9rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          cursor: 'pointer',
          border: 'none',
        }}
      >
        <Bell size={18} />
        {notificationState === 'loading'
          ? 'Enabling notifications...'
          : notificationState === 'enabled'
            ? 'Notifications enabled'
            : 'Enable status notifications'}
      </button>
    </div>
  );
}
