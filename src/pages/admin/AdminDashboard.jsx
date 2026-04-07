import React from 'react';
import { MapPin, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard({ onNavigate }) {
  const handleArchive = () => {
    alert("Issue archived successfully.");
  };
  return (
    <div className="flex-col pb-6">
      {/* Header */}
      <div className="mt-6 mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1F2937' }}>
          Issue Management
        </h1>
        <p className="text-light text-sm mt-2" style={{ lineHeight: '1.4' }}>
          Review and update the status of citizen<br/>reports in real-time.
        </p>
      </div>

      {/* Stats Wrapper */}
      <div className="flex-col gap-4 mb-6">
        {/* Total Reports */}
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>TOTAL REPORTS</div>
          <div className="flex-row items-baseline gap-2">
            <span style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1F2937' }}>1,284</span>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#047857' }}>+12%</span>
          </div>
        </div>

        {/* Pending Review */}
        <div style={{ backgroundColor: '#FAF0E6', padding: '1.25rem', borderRadius: '16px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#92400E', textTransform: 'uppercase', marginBottom: '0.5rem' }}>PENDING REVIEW</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#92400E' }}>42</div>
        </div>

        {/* In Progress */}
        <div style={{ backgroundColor: '#EEF2FF', padding: '1.25rem', borderRadius: '16px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#1E3A8A', textTransform: 'uppercase', marginBottom: '0.5rem' }}>IN PROGRESS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1E3A8A' }}>18</div>
        </div>

        {/* Resolved Today */}
        <div style={{ backgroundColor: '#DCFCE7', padding: '1.25rem', borderRadius: '16px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#065F46', textTransform: 'uppercase', marginBottom: '0.5rem' }}>RESOLVED (TODAY)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#065F46' }}>15</div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-col gap-6">
        
        {/* Issue 1: Pending */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB' }}>
          <div style={{ height: '140px' }}>
            <img src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&h=300&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Pothole" />
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div className="flex-row items-center gap-2 mb-2">
              <span style={{ fontSize: '0.65rem', fontWeight: '600', backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', color: '#6B7280' }}>ID: #8821</span>
              <span style={{ fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>• 2 HOURS AGO</span>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1F2937' }}>Severe Pothole on Oak Street</h3>
            <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '1rem', lineHeight: '1.5' }}>
              The pothole is roughly 3 feet wide and causing significant traffic slowing. Dangerou...
            </p>
            <div className="flex-row items-center gap-1 mb-4">
              <MapPin size={12} color="#6B7280" />
              <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>West District, Sector 4</span>
            </div>
            
            <div style={{ backgroundColor: '#FFE4B5', padding: '0.6rem 1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#B45309', letterSpacing: '0.05em' }}>PENDING</span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#B45309' }}></div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#4B5563', letterSpacing: '0.05em', cursor: 'pointer' }} onClick={() => onNavigate('details')}>VIEW DETAILS</span>
            </div>
          </div>
        </div>

        {/* Issue 2: In Progress */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB' }}>
          <div style={{ height: '140px' }}>
            <img src="https://images.unsplash.com/photo-1542451313056-b7c8e6266459?w=500&h=300&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Broken Streetlight" />
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div className="flex-row items-center gap-2 mb-2">
              <span style={{ fontSize: '0.65rem', fontWeight: '600', backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', color: '#6B7280' }}>ID: #8819</span>
              <span style={{ fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>• 5 HOURS AGO</span>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1F2937' }}>Broken Street Light - Ave 5</h3>
            <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '1rem', lineHeight: '1.5' }}>
              Main lamp post is flickering and creating a safety concern for the bus stop area...
            </p>
            <div className="flex-row items-center gap-1 mb-4">
              <MapPin size={12} color="#6B7280" />
              <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>Central Hub, Station Road</span>
            </div>
            
            <div style={{ backgroundColor: '#A8BAFA', padding: '0.6rem 1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1E3A8A', letterSpacing: '0.05em' }}>IN PROGRESS</span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1E3A8A' }}></div>
            </div>
            <div style={{ textAlign: 'center' }}>
               <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#4B5563', letterSpacing: '0.05em', cursor: 'pointer' }} onClick={() => onNavigate('details')}>VIEW DETAILS</span>
            </div>
          </div>
        </div>

        {/* Issue 3: Resolved */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB' }}>
          <div style={{ height: '140px', opacity: 0.8 }}>
            <img src="https://images.unsplash.com/photo-1574805723922-29fc2fec66c7?w=500&h=300&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Clean Wall" />
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div className="flex-row items-center gap-2 mb-2">
              <span style={{ fontSize: '0.65rem', fontWeight: '600', backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', color: '#6B7280' }}>ID: #8810</span>
              <span style={{ fontSize: '0.65rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>• YESTERDAY</span>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1F2937' }}>Graffiti Removal - Park Wall</h3>
            <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '1rem', lineHeight: '1.5' }}>
              Clean-up crew has finished the removal of unauthorized paintings on the east side...
            </p>
            <div className="flex-row items-center gap-1 mb-4">
              <MapPin size={12} color="#6B7280" />
              <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>North Parkview, East Wall</span>
            </div>
            
            <div style={{ backgroundColor: '#C6F6D5', padding: '0.6rem 1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#047857', letterSpacing: '0.05em' }}>RESOLVED</span>
              <CheckCircle2 size={16} color="#047857" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#4B5563', letterSpacing: '0.05em', cursor: 'pointer' }} onClick={handleArchive} role="button" tabIndex={0}>ARCHIVE</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
