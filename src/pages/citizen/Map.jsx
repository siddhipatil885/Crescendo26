import MapView from '../../components/map/MapView';
import useIssueMapData from '../../hooks/useIssueMapData';

export default function Map() {
  const { issues, loading, error, mapCenter, locationError, userLocation } = useIssueMapData();

  return (
    <MapView
      issues={issues}
      center={mapCenter}
      zoom={12}
      loading={loading}
      error={error}
      locationError={locationError}
      userLocation={userLocation}
    />
  );
}
