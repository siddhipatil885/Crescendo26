import React, { useState } from 'react';
import { Camera, Image as ImageIcon, UploadCloud, X } from 'lucide-react';

export default function CaptureIssue({ onAnalyze }) {
  const [selectedImage, setSelectedImage] = useState(null);

  const simulateCapture = () => {
    // Just simulating a photo capture/selection with a default image for demo
    setSelectedImage('https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop');
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
          Capture a photo and the AI will analyze it.
        </p>
      </div>

      {/* Upload/Capture Area */}
      {!selectedImage ? (
        <div className="flex-col gap-4">
          <button 
            onClick={simulateCapture}
            style={{ 
              width: '100%', 
              height: '240px', 
              borderRadius: '20px', 
              border: '2px dashed #A8BAFA',
              backgroundColor: '#EEF2FF',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
          >
            <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <Camera size={32} color="#7C8FF0" />
            </div>
            <div className="flex-col items-center">
              <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1F2937' }}>Take Photo</span>
              <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Open device camera</span>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
            <span style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
          </div>

          <button 
            onClick={simulateCapture}
            style={{ 
              width: '100%', 
              padding: '1.25rem', 
              borderRadius: '16px', 
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              border: '1px solid #E5E7EB'
            }}
          >
            <div style={{ backgroundColor: '#F3F4F6', padding: '0.75rem', borderRadius: '12px' }}>
              <ImageIcon size={24} color="#4B5563" />
            </div>
            <div className="flex-col" style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '1rem', fontWeight: '600', color: '#1F2937' }}>Upload from Gallery</span>
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Choose an existing image</span>
            </div>
          </button>
        </div>
      ) : (
        <div className="flex-col">
          <div style={{ position: 'relative', width: '100%', height: '240px', borderRadius: '20px', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <img 
              src={selectedImage} 
              alt="Selected Issue" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button 
              onClick={() => setSelectedImage(null)}
              style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '6px', borderRadius: '50%' }}
            >
              <X size={18} />
            </button>
          </div>

          <button 
            onClick={onAnalyze}
            className="btn-primary" 
            style={{ backgroundColor: '#7C8FF0' }}
          >
            <UploadCloud size={18} />
            Analyze with AI
          </button>
        </div>
      )}
    </div>
  );
}
