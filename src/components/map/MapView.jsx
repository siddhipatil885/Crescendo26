import { useEffect } from 'react';
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
} from 'react-leaflet';
import IssueMarker from './IssueMarker';
import 'leaflet/dist/leaflet.css';

const STATUS_DOT_STYLES = {
  pending: '#dc2626',
  in_progress: '#f59e0b',
  resolved: '#16a34a',
};

function SyncMapView({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (!Array.isArray(center) || center.length !== 2) {
      return;
    }

    map.setView(center, zoom, { animate: true });
  }, [center, map, zoom]);

  return null;
}

function UserLocationMarker({ position }) {
  if (!Array.isArray(position) || position.length !== 2) {
    return null;
  }

  return (
    <CircleMarker
      center={position}
      radius={10}
      pathOptions={{
        color: '#ffffff',
        weight: 3,
        fillColor: '#2563eb',
        fillOpacity: 0.95,
      }}
    >
      <Tooltip direction="top" offset={[0, -8]}>
        You are here
      </Tooltip>
    </CircleMarker>
  );
}

export default function MapView({
  issues = [],
  center = null,
  zoom = 12,
  loading = false,
  error = null,
  locationError = null,
  userLocation = null,
  variant = 'full',
  onExpand = null,
}) {
  const hasIssues = issues.length > 0;
  const hasCenter = Array.isArray(center) && center.length === 2;
  const isCompact = variant === 'compact';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: isCompact ? '0' : '0 20px 20px',
      }}
    >
      {!isCompact && (
        <div
          style={{
            marginTop: '4px',
            padding: '18px 16px 14px',
            backgroundColor: '#f8f8fb',
            border: '1px solid #ececf3',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
          }}
        >
          <h1 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
            Live Issue Map
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '12px' }}>Location</span>
            <span>
              {loading ? 'Loading issues...' : `${issues.length} issue${issues.length !== 1 ? 's' : ''} reported`}
            </span>
          </p>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            fontSize: '13px',
            borderRadius: isCompact ? '16px' : '14px',
          }}
        >
          Error: {error}
        </div>
      )}

      {locationError && !error && (
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: '#fef3c7',
            border: '1px solid #fcd34d',
            color: '#92400e',
            fontSize: '13px',
            borderRadius: isCompact ? '16px' : '14px',
          }}
        >
          {locationError}. Showing nearby reported issues instead.
        </div>
      )}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          borderRadius: isCompact ? '16px' : '24px',
          overflow: 'hidden',
          background: '#eef2ff',
          boxShadow: 'inset 0 0 0 1px rgba(124, 143, 240, 0.08)',
        }}
      >
        {hasCenter ? (
          <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom
            zoomControl={false}
            style={{ width: '100%', height: '100%' }}
          >
            <SyncMapView center={center} zoom={zoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="topright" />
            <UserLocationMarker position={userLocation} />
            {issues.map((issue, index) => (
              <IssueMarker key={issue.id || `issue-${index}`} issue={issue} />
            ))}
          </MapContainer>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '24px',
              color: '#4b5563',
              fontSize: '14px',
              lineHeight: 1.5,
            }}
          >
            {loading ? 'Finding your location...' : 'No map location is available yet.'}
          </div>
        )}

        {!loading && hasCenter && !hasIssues && !error && (
          <div
            style={{
              position: 'absolute',
              inset: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.88)',
              borderRadius: '20px',
              color: '#4b5563',
              fontSize: '14px',
              lineHeight: 1.5,
              zIndex: 500,
            }}
          >
            {isCompact
              ? 'No nearby issues yet. New reports will appear here automatically.'
              : 'No issues reported yet. New reports will appear here automatically.'}
          </div>
        )}

        {loading && hasCenter && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(248, 250, 252, 0.7)',
              color: '#1f2937',
              fontSize: '15px',
              fontWeight: '600',
              zIndex: 600,
            }}
          >
            {isCompact ? 'Loading live heatmap...' : 'Loading issues...'}
          </div>
        )}

        {isCompact && typeof onExpand === 'function' && (
          <button
            type="button"
            onClick={onExpand}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 650,
              padding: '8px 12px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.92)',
              color: '#1f2937',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.04em',
              boxShadow: '0 6px 16px rgba(15, 23, 42, 0.14)',
            }}
          >
            OPEN MAP
          </button>
        )}
      </div>

      {!isCompact && (
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '12px',
            color: '#6b7280',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: STATUS_DOT_STYLES.pending,
                flexShrink: 0,
              }}
            />
            <span>Pending</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: STATUS_DOT_STYLES.in_progress,
                flexShrink: 0,
              }}
            />
            <span>In Progress</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: STATUS_DOT_STYLES.resolved,
                flexShrink: 0,
              }}
            />
            <span>Resolved</span>
          </div>
        </div>
      )}
    </div>
  );
}
