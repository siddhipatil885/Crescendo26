export async function getCurrentLocation() {
  try {
    if (window.Capacitor && window.Capacitor.isPluginAvailable('Geolocation')) {
      try {
        const { Geolocation } = window.Capacitor.Plugins;
        const coordinates = await Geolocation.getCurrentPosition();

        if (coordinates?.coords) {
          return {
            lat: coordinates.coords.latitude,
            lng: coordinates.coords.longitude,
          };
        }
      } catch (capacitorError) {
        console.warn('Capacitor geolocation failed, falling back to browser geolocation:', capacitorError);
      }
    }

    return await new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
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
