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
