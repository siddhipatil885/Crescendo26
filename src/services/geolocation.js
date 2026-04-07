export async function getCurrentLocation() {
  try {
    return await new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Validate that coordinates are finite numbers
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            reject(new Error('Invalid coordinates received from geolocation'));
            return;
          }

          resolve({
            lat: latitude,
            lng: longitude,
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
  } catch (error) {
    console.error('Error getting current location:', error);
    throw error;
  }
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

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`,
    {
      headers: {
        Accept: 'application/json',
      },
    }
  );

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
}
