import { Marker, Popup } from 'react-leaflet';
import { useState } from 'react';
import { getMarkerIcon } from '../../utils/markerIcons';
import { isPendingStatus, isInProgressStatus, isResolvedStatus } from '../../utils/constants';

export default function IssueMarker({ issue }) {
  const [isImageBroken, setIsImageBroken] = useState(false);

  if (issue?.lat == null || issue?.lng == null) {
    return null;
  }

  const { id, lat, lng, category, description, text, status, beforeImage, beforeImageUrl } = issue;
  const previewImage = beforeImage || beforeImageUrl || null;
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
      <Popup className="custom-popup">
        <div className="w-[280px] p-1 font-sans">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider">
              {category || 'Unknown'}
            </span>
            <span
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                isPendingStatus(status)
                  ? 'bg-rose-100 text-rose-700'
                  : isInProgressStatus(status)
                    ? 'bg-amber-100 text-amber-700'
                    : isResolvedStatus(status)
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-700'
              }`}
            >
              {statusDisplay}
            </span>
          </div>

          <div className="max-h-[140px] overflow-y-auto mb-4 custom-scrollbar bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <p className="text-xs text-slate-600 leading-relaxed break-words font-medium">
              {description || text || 'No description'}
            </p>
          </div>

          {previewImage ? (
            <div className="mt-2 rounded-xl overflow-hidden shadow-sm border border-slate-200">
              <img
                src={isImageBroken ? 'https://via.placeholder.com/300x150?text=Image+Unavailable' : previewImage}
                alt="Issue evidence"
                loading="lazy"
                onError={handleImageError}
                className="w-full h-36 object-cover bg-slate-100"
              />
            </div>
          ) : (
             <div className="mt-2 w-full h-36 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 text-xs text-slate-400 font-medium">
               No Media Uploaded
             </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-400 flex justify-between items-center tracking-wide">
            <span>Coordinates</span>
            <span>{lat?.toFixed(4)}, {lng?.toFixed(4)}</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
