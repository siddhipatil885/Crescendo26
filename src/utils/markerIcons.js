import L from 'leaflet';

const statusColors = {
  pending: '#dc2626',
  in_progress: '#f59e0b',
  resolved: '#16a34a',
};

function createMarkerSVG(status) {
  const color = statusColors[status] || '#6b7280';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 41" width="32" height="41">
      <path d="M16 0C9.39 0 4 5.39 4 12c0 8 12 29 12 29s12-21 12-29c0-6.61-5.39-12-12-12z"
            fill="${color}"
            stroke="white"
            stroke-width="1.5"/>
      <circle cx="16" cy="12" r="6" fill="white"/>
    </svg>
  `;

  const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
  const svgUrl = URL.createObjectURL(svgBlob);

  return L.icon({
    iconUrl: svgUrl,
    iconSize: [32, 41],
    popupAnchor: [1, -34],
    className: 'custom-marker',
  });
}

export function getMarkerIcon(status) {
  return createMarkerSVG(status);
}
