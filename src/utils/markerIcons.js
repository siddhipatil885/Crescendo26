import L from 'leaflet';
import { isPendingStatus, isInProgressStatus, isResolvedStatus } from './constants';

function getStatusColor(status) {
  if (isPendingStatus(status)) return '#dc2626'; // rose (pending/open)
  if (isInProgressStatus(status)) return '#f59e0b'; // amber (in progress)
  if (isResolvedStatus(status)) return '#16a34a'; // emerald (resolved)
  return '#6b7280'; // gray (unknown)
}

function createMarkerSVG(status) {
  const color = getStatusColor(status);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 41" width="32" height="41">
      <path d="M16 0C9.39 0 4 5.39 4 12c0 8 12 29 12 29s12-21 12-29c0-6.61-5.39-12-12-12z"
            fill="${color}"
            stroke="white"
            stroke-width="1.5"/>
      <circle cx="16" cy="12" r="6" fill="white"/>
    </svg>
  `;

  const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return L.icon({
    iconUrl: svgUrl,
    iconSize: [32, 41],
    iconAnchor: [16, 41],
    popupAnchor: [1, -34],
    className: 'custom-marker',
  });
}

export function getMarkerIcon(status) {
  return createMarkerSVG(status);
}
