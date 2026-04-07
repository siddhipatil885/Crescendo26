import { useEffect, useRef, useState } from 'react';
import { subscribeToIssues } from '../services/issues';
import { getCurrentLocation } from '../services/geolocation';

function hasValidCoordinates(issue) {
  return (
    issue?.lat !== null &&
    issue?.lat !== undefined &&
    issue?.lng !== null &&
    issue?.lng !== undefined &&
    typeof issue.lat === 'number' &&
    typeof issue.lng === 'number' &&
    issue.lat >= -90 &&
    issue.lat <= 90 &&
    issue.lng >= -180 &&
    issue.lng <= 180
  );
}

export default function useIssueMapData(pageSize = 100) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const userLocationRef = useRef(null);

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const location = await getCurrentLocation();
        const nextCenter = [location.lat, location.lng];
        userLocationRef.current = nextCenter;
        setUserLocation(nextCenter);
        setMapCenter(nextCenter);
      } catch (locationFetchError) {
        setLocationError(locationFetchError.message);
      }
    };

    fetchUserLocation();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToIssues(
      (fetchedIssues) => {
        const validIssues = fetchedIssues.filter(hasValidCoordinates);
        setIssues(validIssues);

        if (!userLocationRef.current && validIssues.length > 0) {
          setMapCenter((currentCenter) => currentCenter ?? [validIssues[0].lat, validIssues[0].lng]);
        }

        setLoading(false);
      },
      (subscriptionError) => {
        setError(subscriptionError.message || 'Failed to fetch issues');
        setLoading(false);
      },
      pageSize
    );

    return () => unsubscribe();
  }, [pageSize]);

  return {
    issues,
    loading,
    error,
    mapCenter,
    locationError,
    userLocation,
  };
}
