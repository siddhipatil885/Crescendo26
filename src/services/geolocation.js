export async function getCurrentLocation() {
  try {
    const location = await getCurrentLocationWithMeta();
    return {
      lat: location.lat,
      lng: location.lng,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    throw error;
  }
}

export async function getCurrentLocationWithMeta() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          reject(new Error('Invalid coordinates received from geolocation'));
          return;
        }

        resolve({
          lat: latitude,
          lng: longitude,
          accuracy: Number.isFinite(accuracy) ? accuracy : null,
        });
      },
      (error) => {
        const errorMessages = {
          1: 'Location access denied. Please enable location permissions.',
          2: 'Location service unavailable.',
          3: 'Location request timed out.',
        };

        reject(new Error(errorMessages[error.code] || 'Failed to get location'));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

export function getDistanceInMeters(lat1, lng1, lat2, lng2) {
  const coords = [lat1, lng1, lat2, lng2];
  if (!coords.every((value) => Number.isFinite(Number(value)))) {
    return Number.POSITIVE_INFINITY;
  }

  const toRadians = (degrees) => (Number(degrees) * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const startLat = toRadians(lat1);
  const endLat = toRadians(lat2);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(startLat) * Math.cos(endLat) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

function pickNeighbourhood(address = {}) {
  return (
    address.suburb ||
    address.neighbourhood ||
    address.city_district ||
    address.residential ||
    address.hamlet ||
    address.village ||
    address.town ||
    address.city ||
    ''
  );
}

export async function reverseGeocode(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Valid coordinates are required for reverse geocoding');
  }

  const timeoutMs = Number(import.meta.env.VITE_NOMINATIM_TIMEOUT_MS) || 5000;
  const appName = import.meta.env.VITE_APP_NAME || 'CIVIX';
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || '';
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(lat),
      lon: String(lng),
      zoom: '18',
      addressdetails: '1',
      ...(contactEmail ? { email: contactEmail } : {}),
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'X-App-Name': appName,
      },
      // Browser fetch forbids setting a custom User-Agent/Referer header directly.
      referrerPolicy: 'origin',
    });

    if (!response.ok) {
      throw new Error('Unable to fetch address details');
    }

    const data = await response.json();
    const address = data.address || {};

    return {
      displayName: data.display_name || '',
      neighbourhood: pickNeighbourhood(address),
      address,
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Reverse geocoding timed out after ${timeoutMs}ms`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
