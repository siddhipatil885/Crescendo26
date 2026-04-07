import React, { useState } from 'react';
import { Sparkles, Edit2, MapPin, RefreshCw, Send, Loader2 } from 'lucide-react';

export default function ReportIssue({ draftImage, onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draft, setDraft] = useState({
    imageUrl: draftImage || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop',
    category: 'Pavement / Sidewalk Damage',
    coords: '40.7128° N, 74.0060° W',
    address: '221B Baker Street, NW1 6XE',
    addressSecondary: 'Westminster, Greater London',
    description: 'The sidewalk has significant cracking and a deep pothole that creates a tripping hazard for elderly residents and school children frequently using this path.'
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // In a real app we'd call createIssue(draft) here
      await new Promise(r => setTimeout(r, 800)); // fake network
      if (onSubmit) onSubmit(draft);
    } catch(e) {
      console.error(e);
      setIsSubmitting(false);
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
          Capture a photo and we'll handle the rest.
        </p>
      </div>

      {/* Image Preview (simulated with standard male placeholder as in the mockup, though usually it's the issue image) */}
      <div style={{ width: '100%', height: '220px', borderRadius: '20px', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <img 
          src={draft.imageUrl} 
          alt="Captured Issue" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* AI Analysis Card */}
      <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex-row items-center justify-between mb-4">
          <div className="flex-row items-center gap-3">
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles color="#7C8FF0" size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#7C8FF0', textTransform: 'uppercase' }}>AI ANALYSIS</div>
              <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Scanning for details...</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#7C8FF0' }}></div>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#7C8FF0', opacity: 0.6 }}></div>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#7C8FF0', opacity: 0.3 }}></div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#4B5563', marginBottom: '0.5rem', textTransform: 'uppercase' }}>DETECTED CATEGORY</div>
          <div style={{ backgroundColor: '#F3F4F6', padding: '0.75rem 1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#1F2937' }}>{draft.category}</span>
            <Edit2 size={16} color="#6B7280" />
          </div>
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
              <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#047857', textTransform: 'uppercase' }}>DETECTED LOCATION</div>
              <div style={{ fontSize: '0.8rem', color: '#047857' }}>{draft.coords}</div>
            </div>
          </div>
          <button style={{ width: '32px', height: '32px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E5E7EB' }}>
            <RefreshCw size={14} color="#047857" />
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
          <div style={{ fontSize: '0.65rem', color: '#6B7280' }}>124 / 500</div>
        </div>
        <div style={{ backgroundColor: '#E5E7EB', padding: '1rem', borderRadius: '16px', fontSize: '0.9rem', color: '#374151', lineHeight: '1.5' }}>
          {draft.description}
        </div>
      </div>

      {/* Submit Button */}
      <button 
        className="btn-primary" 
        style={{ backgroundColor: '#7C8FF0', opacity: isSubmitting ? 0.7 : 1 }}
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        {isSubmitting ? 'Submitting...' : 'Submit Report'}
      </button>
    </div>
  );
}
