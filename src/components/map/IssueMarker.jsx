import { Marker, Popup } from 'react-leaflet';
import { useState } from 'react';
import { getMarkerIcon } from '../../utils/markerIcons';

export default function IssueMarker({ issue }) {
  const [isImageBroken, setIsImageBroken] = useState(false);

  if (issue?.lat == null || issue?.lng == null) {
    return null;
  }

  const { id, lat, lng, category, description, status, beforeImageUrl } = issue;
  const statusDisplay = status && typeof status === 'string'
    ? status
        .replace(/_/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Unknown';

  const handleImageError = () => {
    setIsImageBroken(true);
  };

  return (
    <Marker
      position={[lat, lng]}
      icon={getMarkerIcon(status)}
      title={`${category} - ${statusDisplay}`}
    >
      <Popup>
        <div style={{ minWidth: '250px' }}>
          <div style={{ marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              {category || 'Unknown'}
            </span>
          </div>

          <p
            style={{
              margin: '8px 0',
              fontSize: '14px',
              lineHeight: '1.4',
              color: '#1f2937',
            }}
          >
            {description || 'No description'}
          </p>

          <div style={{ marginTop: '12px', marginBottom: '12px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                backgroundColor:
                  status === 'pending'
                    ? '#dc2626'
                    : status === 'in_progress'
                      ? '#f59e0b'
                      : '#16a34a',
                color: 'white',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              {statusDisplay}
            </span>
          </div>

          {beforeImageUrl && !isImageBroken && (
            <div style={{ marginTop: '12px' }}>
              <img
                src={beforeImageUrl}
                alt="Issue"
                loading="lazy"
                onError={handleImageError}
                style={{
                  width: '100%',
                  height: '150px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                }}
              />
            </div>
          )}

          <div
            style={{
              marginTop: '12px',
              fontSize: '11px',
              color: '#6b7280',
              borderTop: '1px solid #e5e7eb',
              paddingTop: '8px',
            }}
          >
            Location: {lat?.toFixed(4)}, {lng?.toFixed(4)}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
