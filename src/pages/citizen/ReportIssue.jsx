import React, { useState, useEffect } from 'react';
import { Sparkles, Edit2, MapPin, RefreshCw, Send, Loader2 } from 'lucide-react';
import { uploadImage } from '../../services/storage';
import { createIssue } from '../../services/issues';

const CATEGORIES = [
  'Pavement / Sidewalk Damage',
  'Streetlight Issues',
  'Graffiti / Vandalism',
  'Trash / Illegal Dumping',
  'Water Leak / Drainage',
  'Other'
];

export default function ReportIssue({ draftImage, onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  
  const [draft, setDraft] = useState({
    file: draftImage?.file || null,
    imageUrl: draftImage?.preview || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop',
    category: 'Pavement / Sidewalk Damage',
    customCategory: '',
    lat: null,
    lng: null,
    coords: 'Locating...',
    address: 'Fetching location...',
    addressSecondary: '',
    description: 'The sidewalk has significant cracking and a deep pothole that creates a tripping hazard for elderly residents and school children.'
  });

  const [submitStatus, setSubmitStatus] = useState('');

  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setDraft(prev => ({ ...prev, coords: 'Geolocation not supported', address: 'Unknown' }));
      return;
    }

    setIsLocating(true);
    
    // Add a 5 second timeout to geolocation
    const timeoutId = setTimeout(() => {
      if (isLocating) {
        setDraft(prev => ({ ...prev, coords: 'Location timeout', address: 'Manual check required' }));
        setIsLocating(false);
      }
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const { latitude, longitude } = position.coords;
        setDraft(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          coords: `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° W`,
          address: 'Detected Vicinity',
          addressSecondary: 'Near current location'
        }));
        setIsLocating(false);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error("Geolocation error:", error);
        setDraft(prev => ({ ...prev, coords: 'Location denied', address: 'Please grant permission' }));
        setIsLocating(false);
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    setDraft(prev => ({ ...prev, category: val }));
    setShowCustomCategory(val === 'Other');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus('Uploading image...');
    try {
      let finalImageUrl = draft.imageUrl;
      if (draft.file) {
        finalImageUrl = await uploadImage(draft.file);
      }
      
      setSubmitStatus('Saving to database...');
      const finalCategory = draft.category === 'Other' ? draft.customCategory : draft.category;
      
      await createIssue({
        category: finalCategory || 'Uncategorized',
        description: draft.description,
        status: "pending",
        lat: draft.lat || 0,
        lng: draft.lng || 0,
        beforeImageUrl: finalImageUrl
      });

      setSubmitStatus('Success!');
      if (onSubmit) {
        // small delay to show success
        setTimeout(() => onSubmit(draft), 500);
      }
    } catch(e) {
      console.error("Submission error:", e);
      alert(`Failed to submit: ${e.message || "Unknown error"}. Check Firestore/Storage rules.`);
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('');
    }
  };

  return (
    <div className="flex-col pb-6">
      {/* Header */}
      <div className="mt-6 mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1F2937' }}>
          Report an Issue
        </h1>
        <p className="text-light text-sm mt-2" style={{ lineHeight: '1.4' }}>
          Help us improve your neighborhood.<br/>
          Confirm details and submit to the city.
        </p>
      </div>

      {/* Image Preview */}
      <div style={{ width: '100%', height: '220px', borderRadius: '20px', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <img 
          src={draft.imageUrl} 
          alt="Captured Issue" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* AI Analysis / Category Selection */}
      <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex-row items-center justify-between mb-4">
          <div className="flex-row items-center gap-3">
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles color="#7C8FF0" size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#7C8FF0', textTransform: 'uppercase' }}>CATEGORY</div>
              <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Classified by AI</div>
            </div>
          </div>
        </div>

        <div className="flex-col gap-3">
          <div style={{ position: 'relative' }}>
            <select 
              value={draft.category}
              onChange={handleCategoryChange}
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                borderRadius: '12px', 
                backgroundColor: '#F3F4F6', 
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#1F2937',
                appearance: 'none',
                cursor: 'pointer'
              }}
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {showCustomCategory && (
            <input 
              type="text"
              placeholder="Enter custom category..."
              value={draft.customCategory}
              onChange={(e) => setDraft(prev => ({ ...prev, customCategory: e.target.value }))}
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                borderRadius: '12px', 
                border: '1px solid #E5E7EB',
                fontSize: '0.9rem',
                color: '#1F2937'
              }}
            />
          )}
        </div>
      </div>

      {/* Location Card */}
      <div style={{ backgroundColor: '#EFFFF4', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
        <div className="flex-row items-center justify-between mb-4">
          <div className="flex-row items-center gap-3">
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#9EF0C2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin color="#047857" size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#047857', textTransform: 'uppercase' }}>LOCATION</div>
              <div style={{ fontSize: '0.8rem', color: '#047857' }}>
                {isLocating ? 'Locating...' : draft.coords}
              </div>
            </div>
          </div>
          <button 
            onClick={fetchLocation}
            disabled={isLocating}
            style={{ 
              width: '32px', 
              height: '32px', 
              backgroundColor: 'white', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              border: '1px solid #E5E7EB',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} color="#047857" className={isLocating ? 'animate-spin' : ''} />
          </button>
        </div>

        <div style={{ backgroundColor: '#F8FCF9', border: '1px solid #e1f5e8', padding: '0.75rem 1rem', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1F2937' }}>{draft.address}</div>
          <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>{draft.addressSecondary}</div>
        </div>
      </div>

      {/* Description Textbox */}
      <div className="mb-6">
        <div className="flex-row justify-between mb-2">
          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#4B5563', textTransform: 'uppercase' }}>DESCRIPTION</div>
          <div style={{ fontSize: '0.65rem', color: '#6B7280' }}>{draft.description.length} / 500</div>
        </div>
        <textarea 
          value={draft.description}
          onChange={(e) => setDraft(prev => ({ ...prev, description: e.target.value }))}
          maxLength={500}
          style={{ 
            width: '100%', 
            minHeight: '120px',
            backgroundColor: '#E5E7EB', 
            padding: '1rem', 
            borderRadius: '16px', 
            fontSize: '0.9rem', 
            color: '#374151', 
            lineHeight: '1.5',
            border: 'none',
            resize: 'none'
          }}
        />
      </div>

      {/* Submit Button */}
      <button 
        className="btn-primary" 
        style={{ backgroundColor: '#7C8FF0', opacity: isSubmitting ? 0.7 : 1 }}
        onClick={handleSubmit}
        disabled={isSubmitting || isLocating}
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        {isSubmitting ? submitStatus : 'Submit Report'}
      </button>
    </div>
  );
}
