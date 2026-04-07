import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, UploadCloud, X } from 'lucide-react';
import { uploadImage } from '../../services/storage';

export default function CaptureIssue({ onAnalyze }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const uploadedUrl = await uploadImage(file);
      setSelectedImage(uploadedUrl);
    } catch (error) {
      console.error(error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleCameraCapture = () => cameraInputRef.current?.click();
  const handleGallerySelect = () => galleryInputRef.current?.click();

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
          {/* Hidden File Inputs */}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={cameraInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
          />
          <input 
            type="file" 
            accept="image/*" 
            ref={galleryInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
          />

          <button 
            onClick={handleCameraCapture}
            disabled={loading}
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
              <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1F2937' }}>
                {loading ? 'Uploading...' : 'Take Photo'}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Open device camera</span>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
            <span style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
          </div>

          <button 
            onClick={handleGallerySelect}
            disabled={loading}
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
            onClick={() => onAnalyze(selectedImage)}
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
