import React from 'react';
import { CheckCircle2, UserCheck, ShieldCheck, MapPin } from 'lucide-react';

export default function IssueDetails() {
  return (
    <div className="flex-col pb-6">
      {/* Header */}
      <div className="mt-4 mb-4">
        <div className="flex-row gap-2 mb-3">
          <span className="badge badge-resolved">RESOLVED</span>
          <span className="badge" style={{ backgroundColor: '#EEF2FF', color: '#7C8FF0' }}>INFRASTRUCTURE</span>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1F2937', marginBottom: '0.5rem', lineHeight: '1.2' }}>
          Broken Streetlight: Oak & 5th Avenue
        </h1>
        <p className="text-light text-sm" style={{ lineHeight: '1.5' }}>
          The main streetlight at the intersection was flickering for weeks before failing completely, creating a safety hazard for night commuters.
        </p>
      </div>

      {/* Timeline */}
      <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex-col gap-4 relative">
          {/* Vertical line connecting timeline */}
          <div style={{ position: 'absolute', left: '16px', top: '24px', bottom: '24px', width: '2px', backgroundColor: '#E5E7EB', zIndex: 1 }}></div>
          
          <TimelineItem icon={<CheckCircle2 size={16} color="#047857" />} title="REPORTED" date="Oct 12" active={true} />
          <TimelineItem icon={<UserCheck size={16} color="#047857" />} title="IN PROGRESS" date="Oct 14" active={true} />
          <TimelineItem icon={<CheckCircle2 size={16} color="#047857" />} title="RESOLVED" date="Oct 15" active={true} bg="#9EF0C2" />
          <TimelineItem icon={<ShieldCheck size={16} color="#047857" />} title="VERIFIED" date="Today" active={true} bg="#9EF0C2" />
        </div>
      </div>

      {/* Before/After Images */}
      <div className="mb-6 flex-col gap-4">
        {/* Before */}
        <div style={{ backgroundColor: '#EEF2F6', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ position: 'relative', height: '160px' }}>
            <img src="https://images.unsplash.com/photo-1542451313056-b7c8e6266459?w=500&h=300&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Broken Streetlight Before" />
            <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: '#991B1B', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase' }}>BEFORE</div>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>Original Issue</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Light fixture completely non-functional, creating dark zones on the sidewalk.</div>
          </div>
        </div>

        {/* After */}
        <div style={{ backgroundColor: '#EEF2F6', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ position: 'relative', height: '160px' }}>
            <img src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=500&h=300&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Fixed Streetlight After" />
            <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: '#047857', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase' }}>AFTER</div>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>Resolved State</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>New LED unit installed. Full illumination restored to the intersection.</div>
          </div>
        </div>
      </div>

      {/* Community Check */}
      <div style={{ backgroundColor: '#EFFFF4', padding: '1.5rem', borderRadius: '16px', position: 'relative', marginBottom: '1.5rem' }}>
        <div style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#9EF0C2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid white' }}>
          <ShieldCheck color="#047857" size={24} />
        </div>
        
        <div className="flex-row items-center justify-center gap-2 mt-4 mb-2">
          <div style={{ height: '1px', flex: 1, backgroundColor: '#9EF0C2' }}></div>
          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#047857', letterSpacing: '0.05em' }}>COMMUNITY CHECK</span>
          <div style={{ height: '1px', flex: 1, backgroundColor: '#9EF0C2' }}></div>
        </div>
        
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', textAlign: 'center', marginBottom: '0.75rem' }}>Verified by Citizen</h3>
        
        <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: '#047857', textAlign: 'center', marginBottom: '1rem' }}>
          "Confirmed. The new light is much brighter and feels safer for my walk home from the station."
        </p>
        
        <div className="flex-row items-center justify-center gap-2">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#047857' }} alt="Sarah J" />
          <span style={{ fontSize: '0.7rem', fontWeight: '500', color: '#065F46' }}>Sarah J. — Local Resident</span>
        </div>
      </div>

      {/* Efficiency Impact */}
      <div style={{ backgroundColor: '#F3F4F6', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem' }}>EFFICIENCY IMPACT</div>
        
        <div className="flex-row justify-between mb-3">
          <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>Response Time</span>
          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1E3A8A' }}>72 Hours</span>
        </div>
        <div className="flex-row justify-between mb-3">
          <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>Civic Points</span>
          <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#047857' }}>+150</span>
        </div>
        <div className="flex-row justify-between mb-4">
          <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>Reports Linked</span>
          <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1F2937' }}>12</span>
        </div>
        
        <button style={{ backgroundColor: '#5C6BC0', color: 'white', width: '100%', padding: '0.8rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600' }}>
          Share Resolution
        </button>
      </div>

      {/* Map block */}
      <div style={{ height: '180px', backgroundColor: '#CDD0D6', borderRadius: '16px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '0.75rem 1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Oak & 5th Avenue</span>
          <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>District 4</span>
        </div>
        <MapPin size={48} fill="#7C8FF0" color="white" style={{ marginBottom: '40px' }} />
      </div>
    </div>
  );
}

function TimelineItem({ icon, title, date, active, bg = "#9EF0C2" }) {
  return (
    <div className="flex-row items-center gap-4" style={{ zIndex: 2 }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div className="flex-col">
        <div style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.05em', color: '#374151', textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{date}</div>
      </div>
    </div>
  );
}
