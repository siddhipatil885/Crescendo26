import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { routeIssueText } from '../../services/gemini';
import { getCurrentLocation, reverseGeocode } from '../../services/geolocation';
import { uploadToCloudinary } from '../../services/storage';
import { createIssue } from '../../services/issues';
import {
  getCivixCategoryFromAiClassification,
  getDepartmentForCategory,
  getSubcategoriesForAiCategory,
  ISSUE_STATUS,
  REPORT_SOURCES,
} from '../../utils/constants';
import { getContractor } from '../../utils/contractor';
import { trackIssue } from '../../utils/notifications';
import CategorySelector from '../../components/CategorySelector';

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

const OTHER_CATEGORY_ID = 'other';
const SINGLE_WORD_CATEGORY_REGEX = /^\S+$/;

export default function ReportIssue({ draftImage, onSubmit }) {
  const { t } = useTranslation();
  const [isPreparing, setIsPreparing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRoutingAI, setIsRoutingAI] = useState(false);
  const [error, setError] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [autoData, setAutoData] = useState(EMPTY_AUTO_POPULATION);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [overrides, setOverrides] = useState({
    neighbourhood: '',
    location: '',
    aiCategory: '',
    subcategory: '',
    description: '',
    issueType: '',
    severity: '',
  });
  const [userDetails, setUserDetails] = useState(EMPTY_USER_DETAILS);
  const [customCategory, setCustomCategory] = useState('');

  const previewUrl = draftImage?.preview || '';
  const reportFile = draftImage?.file || null;
  const isOtherCategorySelected = selectedCategory === OTHER_CATEGORY_ID;
  const trimmedCustomCategory = customCategory.trim();

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
      issueType: overrides.issueType || autoData.issueType,
      aiCategory,
      subcategory,
      civixCategory,
      description: overrides.description || autoData.description,
      severity: overrides.severity || autoData.severity,
      department: getDepartmentForCategory(civixCategory),
    };
  }, [autoData, overrides]);

  useEffect(() => {
    let cancelled = false;

    async function autopopulateDraft() {
      if (!reportFile) {
        setError(t('issue_photo_required_before_complaint'));
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

        setAutoData({
          lat: location.lat,
          lng: location.lng,
          location: reverseLookup.displayName,
          neighbourhood: reverseLookup.neighbourhood,
          issueType: '',
          aiCategory: '',
          subcategory: '',
          description: '',
          severity: '',
        });
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
  }, [reportFile, t]);

  const handleSubmit = async () => {
    if (!reportFile) {
      setError(t('complaint_photo_required'));
      return;
    }

    if (!selectedCategory || !selectedSubcategory) {
      setError(t('please_select_category'));
      return;
    }

    if (isOtherCategorySelected && !trimmedCustomCategory) {
      setError(t('please_enter_other_category'));
      return;
    }

    if (isOtherCategorySelected && !SINGLE_WORD_CATEGORY_REGEX.test(trimmedCustomCategory)) {
      setError(t('please_enter_single_word_category'));
      return;
    }

    if (!resolvedDraft.description || !resolvedDraft.location) {
      setError(t('please_complete_description_and_address'));
      return;
    }

    if (!resolvedDraft.aiCategory || !resolvedDraft.subcategory) {
      setError(t('could_not_resolve_category'));
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(t('uploading_complaint_photo'));
    setError('');

    try {
      const photoUrl = await uploadToCloudinary(reportFile);

      setSubmitStatus(t('routing_complaint'));
      setIsRoutingAI(true);
      let routedPriority = undefined;
      try {
        const routing = await routeIssueText(resolvedDraft.description);
        if (routing?.priority) {
          routedPriority = routing.priority;
        }
      } catch (routingError) {
        console.warn('AI routing failed. Falling back to category mapping.', routingError);
      } finally {
        setIsRoutingAI(false);
      }

      setSubmitStatus(t('submitting_complaint'));
      const contractor = getContractor(`${resolvedDraft.description} ${resolvedDraft.location}`);
      const finalCategory = isOtherCategorySelected ? trimmedCustomCategory : resolvedDraft.civixCategory;
      const createdIssue = await createIssue({
        category: finalCategory,
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
        ...(routedPriority ? { priority: routedPriority } : {}),
        contractor,
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
          {t('register_complaint')}
        </h1>
      </div>

      {!previewUrl && (
        <div style={{ backgroundColor: '#FEF2F2', color: '#991B1B', padding: '1rem', borderRadius: '16px', marginBottom: '1rem' }}>
          {t('capture_or_upload_photo_first')}
        </div>
      )}

      {previewUrl && (
        <div style={{ width: '100%', height: '220px', borderRadius: '20px', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <img
            src={previewUrl}
            alt={t('report_issue')}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {(isPreparing || isRoutingAI) && (
        <div style={{ backgroundColor: '#EEF2FF', padding: '1rem', borderRadius: '16px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#3147B0' }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
            {isRoutingAI ? t('routing_complaint_details') : t('preparing_complaint_details')}
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
              {t('complaint_details')}
            </div>
          </div>

          {/* Category Selector Component */}
          <CategorySelector
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            onCategoryChange={(categoryId) => {
              setSelectedCategory(categoryId);
              setSelectedSubcategory(null);
              setError('');
              if (categoryId !== OTHER_CATEGORY_ID) {
                setCustomCategory('');
              }
            }}
            onSubcategoryChange={(subcategoryItem) => {
              if (subcategoryItem) {
                setSelectedSubcategory(subcategoryItem);
                setError('');
                setOverrides((current) => ({
                  ...current,
                  aiCategory: subcategoryItem.aiCategory,
                  subcategory: subcategoryItem.aiSubcategory,
                }));
              }
            }}
          />

          {isOtherCategorySelected && selectedSubcategory && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                {t('category_name')}
              </div>
              <input
                type="text"
                value={customCategory}
                onChange={(event) => {
                  setCustomCategory(event.target.value);
                  if (error) {
                    setError('');
                  }
                }}
                placeholder={t('category_name_placeholder')}
                maxLength={30}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '0.9rem', color: '#1F2937', backgroundColor: '#F9FAFB' }}
              />
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.35rem' }}>
                {t('one_word_only_hint')}
              </div>
            </div>
          )}

          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{t('description')}</div>
            <textarea
              value={resolvedDraft.description}
              onChange={(event) => setOverrides((current) => ({ ...current, description: event.target.value }))}
              maxLength={500}
              placeholder={t('description_placeholder')}
              style={{ width: '100%', minHeight: '110px', padding: '0.85rem 1rem', borderRadius: '16px', border: '1px solid #E5E7EB', fontSize: '0.9rem', color: '#374151', lineHeight: '1.5', resize: 'none', backgroundColor: '#F9FAFB' }}
            />
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#F8FCF9', padding: '1.25rem', borderRadius: '16px', marginBottom: '1rem', border: '1px solid #D7F0E0' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{t('neighbourhood')}</div>
          <input
            type="text"
            value={resolvedDraft.neighbourhood}
            onChange={(event) => setOverrides((current) => ({ ...current, neighbourhood: event.target.value }))}
            placeholder={t('neighbourhood')}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #CFE9D9', fontSize: '0.9rem', color: '#1F2937', backgroundColor: 'white' }}
          />
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{t('detailed_address')}</div>
          <textarea
            value={resolvedDraft.location}
            onChange={(event) => setOverrides((current) => ({ ...current, location: event.target.value }))}
            rows={3}
            placeholder={t('detailed_address_placeholder')}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #CFE9D9', fontSize: '0.9rem', color: '#1F2937', backgroundColor: 'white', resize: 'none', lineHeight: '1.5' }}
          />
        </div>
      </div>

      <div style={{ backgroundColor: '#F5F3FF', padding: '1.25rem', borderRadius: '16px', marginBottom: '1rem', border: '1px solid #E9D5FF' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.75rem', textTransform: 'uppercase' }}>{t('optional_contact_details')}</div>
        
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{t('name')}</div>
          <input
            type="text"
            value={userDetails.name}
            onChange={(event) => setUserDetails((current) => ({ ...current, name: event.target.value }))}
            placeholder={t('your_name_optional')}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #E9D5FF', fontSize: '0.9rem', color: '#1F2937', backgroundColor: 'white' }}
          />
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.35rem' }}>{t('phone_number')}</div>
          <input
            type="tel"
            value={userDetails.phone}
            onChange={(event) => setUserDetails((current) => ({ ...current, phone: event.target.value }))}
            placeholder={t('your_phone_optional')}
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
        {isSubmitting ? submitStatus : t('submit')}
      </button>
    </div>
  );
}
