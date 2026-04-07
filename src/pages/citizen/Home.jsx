import React from 'react';
import { MoreHorizontal, Clock, RefreshCw, CheckCircle2, MapPin } from 'lucide-react';

export default function Home({ onNavigate }) {
  return (
    <div className="flex-col pb-6">
      {/* Header section */}
      <div className="mt-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1F2937', marginBottom: '0.25rem' }}>
          Welcome back,<br/>
          <span style={{ color: '#7C8FF0' }}>Civic Guardian.</span>
        </h1>
        <p className="text-light text-sm" style={{ marginTop: '0.5rem', lineHeight: '1.4' }}>
          Your neighborhood is 82% resolved<br/>this month. Keep it up!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 flex-col gap-4">
        {/* Pending Card */}
        <div style={{ backgroundColor: '#FFE4B5', padding: '1.25rem', borderRadius: '16px' }}>
          <div className="flex-row justify-between items-center mb-4">
            <MoreHorizontal color="#B45309" size={20} />
            <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#B45309', background: 'rgba(255,255,255,0.4)', padding: '4px 8px', borderRadius: '12px' }}>STATUS</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#B45309', marginBottom: '2px' }}>12</div>
          <div style={{ fontSize: '0.8rem', color: '#B45309' }}>Pending Issues</div>
        </div>

        {/* Under Review Card */}
        <div style={{ backgroundColor: '#BBC6FF', padding: '1.25rem', borderRadius: '16px' }}>
          <div className="flex-row justify-between items-center mb-4">
            <RefreshCw color="#1E3A8A" size={20} />
            <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#1E3A8A', background: 'rgba(255,255,255,0.4)', padding: '4px 8px', borderRadius: '12px' }}>IN PROGRESS</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1E3A8A', marginBottom: '2px' }}>08</div>
          <div style={{ fontSize: '0.8rem', color: '#1E3A8A' }}>Under Review</div>
        </div>

        {/* Completed Card */}
        <div style={{ backgroundColor: '#9EF0C2', padding: '1.25rem', borderRadius: '16px' }}>
          <div className="flex-row justify-between items-center mb-4">
            <CheckCircle2 color="#047857" size={20} />
            <span style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#047857', background: 'rgba(255,255,255,0.4)', padding: '4px 8px', borderRadius: '12px' }}>COMPLETED</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#047857', marginBottom: '2px' }}>145</div>
          <div style={{ fontSize: '0.8rem', color: '#047857' }}>Resolved This Year</div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="mt-8">
        <div className="flex-row justify-between items-center mb-4">
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Active Heatmap</h2>
          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#7C8FF0', letterSpacing: '0.05em' }}>EXPAND VIEW</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '240px', 
          backgroundColor: '#E5E7EB', 
          borderRadius: '16px',
          backgroundImage: 'radial-gradient(#D1D5DB 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Map placeholder elements */}
          <div style={{ position: 'absolute', top: '40%', left: '30%' }}>
            <MapPin fill="#FFE4B5" color="#B45309" size={28} />
          </div>
          <div style={{ position: 'absolute', top: '60%', left: '55%' }}>
            <MapPin fill="#BBC6FF" color="#1E3A8A" size={28} />
          </div>
          <div style={{ position: 'absolute', top: '65%', left: '70%' }}>
            <MapPin fill="#9EF0C2" color="#047857" size={28} />
          </div>

          <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '8px', borderRadius: '20px', display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '0.6rem', fontWeight: '600', color: '#4B5563' }}>
            <span className="flex-row items-center gap-2"><div style={{width: 8, height: 8, borderRadius: '50%', background: '#FFE4B5'}}></div> UNRESOLVED</span>
            <span className="flex-row items-center gap-2"><div style={{width: 8, height: 8, borderRadius: '50%', background: '#BBC6FF'}}></div> ACTIVE</span>
            <span className="flex-row items-center gap-2"><div style={{width: 8, height: 8, borderRadius: '50%', background: '#9EF0C2'}}></div> RESOLVED</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="flex-row justify-between items-center mb-4">
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Recent Activity</h2>
          <ListFilter size={18} color="#6B7280" />
        </div>

        <div className="flex-col gap-4">
          {/* Activity Item 1 */}
          <div onClick={() => onNavigate('details')} style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '16px', display: 'flex', gap: '1rem', cursor: 'pointer' }}>
            <img src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=100&h=100&fit=crop" style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} alt="Pothole" />
            <div className="flex-col justify-center flex-1">
              <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>Cracked Sidewalk on 5th Ave</h3>
              <p style={{ fontSize: '0.75rem', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>Safety hazard reported near the school</p>
              <div className="flex-row items-center gap-2 mt-2">
                <span className="badge badge-pending">PENDING</span>
                <span style={{ fontSize: '0.65rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10} /> 2h ago</span>
              </div>
            </div>
          </div>

          {/* Activity Item 2 */}
          <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '16px', display: 'flex', gap: '1rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{width: '20px', height: '30px', background: 'linear-gradient(to bottom, #FFE4B5, #e67e22)', borderRadius: '4px'}}></div>
            </div>
            <div className="flex-col justify-center flex-1">
              <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>Streetlamp Flickering</h3>
              <p style={{ fontSize: '0.75rem', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>Unit #442 on Oak Street has...</p>
              <div className="flex-row items-center gap-2 mt-2">
                <span className="badge badge-review">UNDER REVIEW</span>
                <span style={{ fontSize: '0.65rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10} /> 5h ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListFilter(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" x2="21" y1="6" y2="6"/>
      <line x1="8" x2="16" y1="12" y2="12"/>
      <line x1="11" x2="13" y1="18" y2="18"/>
    </svg>
  );
}
