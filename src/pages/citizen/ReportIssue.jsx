import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Send } from 'lucide-react';
import { analyzeIssueImage } from '../../services/gemini';
import { getCurrentLocation, reverseGeocode } from '../../services/geolocation';
import { uploadToCloudinary } from '../../services/storage';
import { createIssue } from '../../services/issues';
import {
  AI_CATEGORY_MAP,
  getCivixCategoryFromAiClassification,
  getDepartmentForCategory,
  getSubcategoriesForAiCategory,
  ISSUE_STATUS,
  REPORT_SOURCES,
} from '../../utils/constants';
import { trackIssue } from '../../utils/notifications';

const EMPTY_AUTO_POPULATION = {
  lat: null,
  lng: null,
  location: '',
  neighbourhood: '',
  issueType: '',
  aiCategory: '',
  subcategory: '',
  civixCategory: '',
  description: '',
  severity: '',
};

const EMPTY_USER_DETAILS = {
  name: '',
  phone: '',
};

export default function ReportIssue({ draftImage, onSubmit }) {
  const [isPreparing, setIsPreparing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshingAI, setIsRefreshingAI] = useState(false);
  const [error, setError] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [autoData, setAutoData] = useState(EMPTY_AUTO_POPULATION);
  const [overrides, setOverrides] = useState({
    neighbourhood: '',
    location: '',
    aiCategory: '',
    subcategory: '',
    description: '',
  });
  const [userDetails, setUserDetails] = useState(EMPTY_USER_DETAILS);

  const previewUrl = draftImage?.preview || '';
  const reportFile = draftImage?.file || null;

  const resolvedDraft = useMemo(() => {
    const aiCategory = overrides.aiCategory || autoData.aiCategory;
    const fallbackSubcategories = getSubcategoriesForAiCategory(aiCategory);
    const preferredSubcategory = overrides.subcategory || autoData.subcategory;
    const subcategory = fallbackSubcategories.includes(preferredSubcategory)
      ? preferredSubcategory
      : fallbackSubcategories[0] || '';
    const civixCategory = getCivixCategoryFromAiClassification(aiCategory, subcategory);

    return {
      lat: autoData.lat,
      lng: autoData.lng,
      neighbourhood: overrides.neighbourhood || autoData.neighbourhood,
      location: overrides.location || autoData.location,
      issueType: autoData.issueType,
      aiCategory,
      subcategory,
      civixCategory,
      description: overrides.description || autoData.description,
      severity: autoData.severity,
      department: getDepartmentForCategory(civixCategory),
    };
  }, [autoData, overrides]);

  useEffect(() => {
    let cancelled = false;

    async function autopopulateDraft() {
      if (!reportFile) {
        setError('An issue photo is required before you can register a complaint.');
        setIsPreparing(false);
        return;
      }

      setIsPreparing(true);
      setError('');

      try {
        const location = await getCurrentLocation().catch((locationError) => {
          console.warn('Location lookup failed during complaint preparation:', locationError);
          return {
            lat: null,
            lng: null,
          };
        });

        const reverseLookup = await (location.lat != null && location.lng != null
          ? reverseGeocode(location.lat, location.lng)
          : Promise.resolve({
              displayName: '',
              neighbourhood: '',
            })
        ).catch(() => ({
          displayName: '',
          neighbourhood: '',
        }));

        let aiResult = null;
        let aiErrorMessage = '';

        try {
          aiResult = await analyzeIssueImage(reportFile);
        } catch (aiError) {
          aiErrorMessage = aiError.message || 'AI analysis is unavailable right now. Please review the complaint details manually.';
        }

        if (cancelled) {
          return;
        }

        const aiCategory = aiResult?.category || '';
        const subcategory = aiResult?.subcategory || '';

        setAutoData({
          lat: location.lat,
          lng: location.lng,
          location: reverseLookup.displayName,
          neighbourhood: reverseLookup.neighbourhood,
          issueType: aiResult?.issue_type || '',
          aiCategory,
          subcategory,
          civixCategory: getCivixCategoryFromAiClassification(aiCategory, subcategory),
          description: aiResult?.description || '',
          severity: aiResult?.severity || '',
        });

        if (aiErrorMessage) {
          setError(aiErrorMessage);
        }
      } catch (autopopulateError) {
        if (!cancelled) {
          setError(autopopulateError.message || 'Failed to prepare complaint details.');
        }
      } finally {
        if (!cancelled) {
          setIsPreparing(false);
        }
      }
    }

    autopopulateDraft();

    return () => {
      cancelled = true;
    };
  }, [reportFile]);

  const refreshAI = async () => {
    if (!reportFile) {
      return;
    }

    setIsRefreshingAI(true);
    setError('');

    try {
      const ai = await analyzeIssueImage(reportFile);
      const nextAiCategory = ai.category || '';
      const nextSubcategory = ai.subcategory || '';

      setAutoData((current) => ({
        ...current,
        issueType: ai.issue_type || current.issueType,
        aiCategory: nextAiCategory,
        subcategory: nextSubcategory,
        civixCategory: getCivixCategoryFromAiClassification(nextAiCategory, nextSubcategory),
        description: ai.description || current.description,
        severity: ai.severity || current.severity,
      }));
      setOverrides((current) => ({
        ...current,
        aiCategory: '',
        subcategory: '',
        description: '',
      }));
    } catch (refreshError) {
      setError(refreshError.message || 'Failed to refresh AI analysis.');
    } finally {
      setIsRefreshingAI(false);
    }
  };

  const handleSubmit = async () => {
    if (!reportFile) {
      setError('A complaint photo is required.');
      return;
    }

    if (!resolvedDraft.aiCategory || !resolvedDraft.subcategory || !resolvedDraft.description || !resolvedDraft.location) {
      setError('We are still preparing the complaint details. Please wait a moment and try again.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('Uploading complaint photo...');
    setError('');

    try {
      const photoUrl = await uploadToCloudinary(reportFile);

      setSubmitStatus('Submitting complaint...');
      const createdIssue = await createIssue({
        category: resolvedDraft.civixCategory,
        subcategory: resolvedDraft.subcategory,
        issue_type: resolvedDraft.issueType,
        issue_category: resolvedDraft.aiCategory,
        issue_subcategory: resolvedDraft.subcategory,
        description: resolvedDraft.description,
        ai_description: autoData.description || resolvedDraft.description,
        severity: resolvedDraft.severity,
        status: ISSUE_STATUS.OPEN,
        lat: resolvedDraft.lat,
        lng: resolvedDraft.lng,
        neighbourhood: resolvedDraft.neighbourhood,
        location: resolvedDraft.location,
        department: resolvedDraft.department,
        photo_url: photoUrl,
        report_source: REPORT_SOURCES.APP,
        ...(userDetails.name && { reporter_name: userDetails.name }),
        ...(userDetails.phone && { reporter_phone: userDetails.phone }),
      });

      trackIssue(createdIssue.id);
      onSubmit?.(createdIssue);
    } catch (submissionError) {
      console.error('Complaint submission failed:', submissionError);
      setError(submissionError.message || 'Failed to submit complaint.');
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('');
    }
  };

  return (
    <div className="flex-col pb-6">
      <div className="mt-6 mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1F2937' }}>
          Register Complaint
        </h1>
      </div>

      {!previewUrl && (
        <div style={{ backgroundColor: '#FEF2F2', color: '#991B1B', padding: '1rem', borderRadius: '16px', marginBottom: '1rem' }}>
          Please capture or upload an issue photo first.
        </div>
      )}

      {previewUrl && (
        <div style={{ width: '100%', height: '220px', borderRadius: '20px', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <img
            src={previewUrl}
            alt="Complaint preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {(isPreparing || isRefreshingAI) && (
        <div style={{ backgroundColor: '#EEF2FF', padding: '1rem', borderRadius: '16px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#3147B0' }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
            {isRefreshingAI ? 'Refreshing complaint details...' : 'Preparing complaint details...'}
          </span>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', color: '#991B1B', padding: '1rem', borderRadius: '16px', marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '0.9rem' }}>{error}</span>
        </div>
      )}

      <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', marginBottom: '1rem', border: '1px solid #E5E7EB' }}>
        <div className="flex-col gap-4">
          <div className="flex-row justify-between items-center">
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>
              Complaint Details
            </div>
            <button
              type="button"
              onClick={refreshAI}
              disabled={!reportFile || isRefreshingAI}
              style={{
                padding: '0.45rem 0.8rem',
                borderRadius: '9999px',
                backgroundColor: '#EEF2FF',
                color: '#3147B0',
                fontSize: '0.75rem',
                fontWeight: '600',
                opacity: !reportFile || isRefreshingAI ? 0.6 : 1,
                cursor: !reportFile || isRefreshingAI ? 'not-allowed' : 'pointer',
              }}
            >
              {isRefreshingAI ? 'Analyzing...' : 'Re-analyze'}
            </button>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Category</div>
            <select
              value={resolvedDraft.aiCategory}
              onChange={(event) => {
                const nextCategory = event.target.value;
                const nextSubcategory = getSubcategoriesForAiCategory(nextCategory)[0] || 'Projects & Other';
                setOverrides((current) => ({
                  ...current,
                  aiCategory: nextCategory,
                  subcategory: nextSubcategory,
                }));
              }}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '0.9rem', color: '#1F2937', backgroundColor: '#F9FAFB' }}
            >
              <option value="">Select a category</option>
              {Object.keys(AI_CATEGORY_MAP).map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Subcategory</div>
            <select
              value={resolvedDraft.subcategory}
              onChange={(event) => setOverrides((current) => ({ ...current, subcategory: event.target.value }))}
              disabled={!resolvedDraft.aiCategory}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '0.9rem', color: '#1F2937', backgroundColor: '#F9FAFB' }}
            >
              <option value="">Select a subcategory</option>
              {getSubcategoriesForAiCategory(resolvedDraft.aiCategory).map((subcategory) => (
                <option key={subcategory} value={subcategory}>{subcategory}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Description</div>
            <textarea
              value={resolvedDraft.description}
              onChange={(event) => setOverrides((current) => ({ ...current, description: event.target.value }))}
              maxLength={500}
              style={{ width: '100%', minHeight: '110px', padding: '0.85rem 1rem', borderRadius: '16px', border: '1px solid #E5E7EB', fontSize: '0.9rem', color: '#374151', lineHeight: '1.5', resize: 'none', backgroundColor: '#F9FAFB' }}
            />
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#F8FCF9', padding: '1.25rem', borderRadius: '16px', marginBottom: '1rem', border: '1px solid #D7F0E0' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Neighbourhood</div>
          <input
            type="text"
            value={resolvedDraft.neighbourhood}
            onChange={(event) => setOverrides((current) => ({ ...current, neighbourhood: event.target.value }))}
            placeholder="Neighbourhood"
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #CFE9D9', fontSize: '0.9rem', color: '#1F2937', backgroundColor: 'white' }}
          />
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Detailed Address</div>
          <textarea
            value={resolvedDraft.location}
            onChange={(event) => setOverrides((current) => ({ ...current, location: event.target.value }))}
            rows={3}
            placeholder="Detected full address"
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #CFE9D9', fontSize: '0.9rem', color: '#1F2937', backgroundColor: 'white', resize: 'none', lineHeight: '1.5' }}
          />
        </div>
      </div>

      <div style={{ backgroundColor: '#F5F3FF', padding: '1.25rem', borderRadius: '16px', marginBottom: '1rem', border: '1px solid #E9D5FF' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Optional Contact Details</div>
        
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Name</div>
          <input
            type="text"
            value={userDetails.name}
            onChange={(event) => setUserDetails((current) => ({ ...current, name: event.target.value }))}
            placeholder="Your name (optional)"
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #E9D5FF', fontSize: '0.9rem', color: '#1F2937', backgroundColor: 'white' }}
          />
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Phone Number</div>
          <input
            type="tel"
            value={userDetails.phone}
            onChange={(event) => setUserDetails((current) => ({ ...current, phone: event.target.value }))}
            placeholder="Your phone number (optional)"
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #E9D5FF', fontSize: '0.9rem', color: '#1F2937', backgroundColor: 'white' }}
          />
        </div>
      </div>

      <button
        className="btn-primary"
        style={{ backgroundColor: '#7C8FF0', opacity: isSubmitting || isPreparing ? 0.7 : 1 }}
        onClick={handleSubmit}
        disabled={isSubmitting || isPreparing || !reportFile}
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        {isSubmitting ? submitStatus : 'Submit Complaint'}
      </button>
    </div>
  );
}
