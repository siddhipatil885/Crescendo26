import React from 'react';
import { CheckCircle2, MapPinned, Search, Copy, Check, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ReportConfirmation({ issue, onTrackIssue }) {
  const { t } = useTranslation();
  const [copiedToken, setCopiedToken] = React.useState(false);

  if (!issue) {
    return null;
  }

  const handleCopyToken = async () => {
    if (issue.claimToken) {
      try {
        await navigator.clipboard.writeText(issue.claimToken);
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
      } catch (error) {
        console.error('handleCopyToken failed:', error);
        setCopiedToken(false);
      }
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
          {t('complaint_registered')}
        </h1>
        <p className="text-light text-sm mt-2" style={{ lineHeight: '1.5' }}>
          {t('report_saved_successfully')}
        </p>
      </div>

      {/* CLAIM TOKEN - PROMINENT DISPLAY */}
      {issue.claimToken && (
        <div style={{ backgroundColor: '#F0FDF4', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem', border: '2px solid #22C55E' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            {t('your_complaint_id')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <code style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1F2937', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {issue.claimToken}
              </code>
            </div>
            <button
              onClick={handleCopyToken}
              aria-label={copiedToken ? t('copied') : t('copy_token')}
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
            {t('save_complaint_id')}
          </p>
        </div>
      )}

      <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', marginBottom: '1rem', border: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          {t('complaint_details')}
        </div>

        <div className="flex-row items-center gap-3 mb-3">
          <MapPinned size={18} color="#047857" />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{t('neighbourhood')}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1F2937' }}>{issue.neighbourhood || t('detected_from_location')}</div>
          </div>
        </div>

        <div className="flex-row items-center gap-3">
          <Search size={18} color="#B45309" />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{t('category')}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1F2937' }}>{issue.category}</div>
          </div>
        </div>

        <div className="flex-row items-center gap-3">
          <Tag size={18} color="#3147B0" />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{t('subcategory')}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1F2937' }}>{issue.subcategory || t('not_specified')}</div>
          </div>
        </div>
      </div>

      <button className="btn-primary" style={{ marginBottom: '0.75rem' }} onClick={() => onTrackIssue(issue.id)}>
        {t('track_this_issue')}
      </button>
    </div>
  );
}
