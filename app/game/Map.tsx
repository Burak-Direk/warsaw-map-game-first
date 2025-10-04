// app/game/Map.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Pane, TileLayer, ZoomControl, useMapEvent } from 'react-leaflet';
import type { LatLngExpression, LatLngLiteral } from 'leaflet';
import L from 'leaflet';
import type { Attraction } from './data/attractions';
import SnakePolyline from '../../components/SnakePolyline';
import { fetchRoute } from '../../lib/osrm';
import type { LatLng } from '../../lib/osrm';

type MapProps = {
  currentAttraction: Attraction;
  guess: LatLngLiteral | null;
  onGuess: (coords: LatLngLiteral) => void;
  solutionVisible: boolean;
  roundIndex: number;
  // difficulty?: 'easy' | 'medium' | 'hard'; // add if you use it
};

const warsawCenter: LatLngLiteral = { lat: 52.2297, lng: 21.0122 };
const EARTH_RADIUS_METERS = 6371000;

const toRadians = (v: number) => (v * Math.PI) / 180;
const haversineDistanceMeters = (a: LatLngLiteral, b: LatLngLiteral) => {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const hav =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.max(hav, 0)));
};

const MapClickHandler = ({
  onGuess,
  disabled,
}: {
  onGuess: (coords: LatLngLiteral) => void;
  disabled: boolean;
}) => {
  useMapEvent('click', (event) => {
    if (disabled) return;
    // Use a small delay to distinguish between click and drag
    setTimeout(() => {
      onGuess(event.latlng);
    }, 50);
  });
  return null;
};

const EventDebugger = () => {
  const map = useMapEvent('load', () => {
    const mapContainer = map.getContainer();
    
    console.log('Map loaded, container:', mapContainer);
    console.log('Map dragging enabled:', map.dragging?.enabled());
    
    const testClick = (e: Event) => {
      console.log('Click event detected:', e);
    };
    
    const testMouseDown = (e: Event) => {
      console.log('MouseDown event detected:', e);
    };
    
    const testMouseMove = (e: Event) => {
      console.log('MouseMove event detected');
    };

    mapContainer.addEventListener('click', testClick);
    mapContainer.addEventListener('mousedown', testMouseDown);
    mapContainer.addEventListener('mousemove', testMouseMove);
    
    // Test if we can manually move the map
    setTimeout(() => {
      console.log('Testing manual map movement...');
      map.setView([52.25, 21.02], 13);
    }, 2000);
  });
  
  return null;
};

const MapResizer = () => {
  const map = useMapEvent('load', () => {
    // Ensure the container has proper dimensions before invalidating
    const container = map.getContainer();
    const parent = container.parentElement;
    
    console.log('Container dimensions:', {
      container: { width: container.offsetWidth, height: container.offsetHeight },
      parent: parent ? { width: parent.offsetWidth, height: parent.offsetHeight } : 'no parent'
    });
    
    const fixSize = () => {
      try {
        // Force container dimensions if they're not set
        if (container.offsetWidth === 0 || container.offsetHeight === 0) {
          container.style.width = '100%';
          container.style.height = '500px';
          console.log('Forced container dimensions');
        }
        
        map.invalidateSize(true);
        console.log('Map size invalidated successfully');
      } catch (error) {
        console.error('Error invalidating map size:', error);
      }
    };

    // Multiple attempts to fix sizing
    fixSize();
    setTimeout(fixSize, 50);
    setTimeout(fixSize, 200);
    setTimeout(fixSize, 500);
    setTimeout(fixSize, 1000);
    
    // Handle window resize
    const handleResize = () => fixSize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  });
  
  return null;
};

export default function Map({
  currentAttraction,
  guess,
  onGuess,
  solutionVisible,
  roundIndex,
}: MapProps) {
  // ✅ Only allow MapContainer to render after the first client effect
  const [canMount, setCanMount] = useState(false);
  useEffect(() => { setCanMount(true); }, []);

  const actualPosition = useMemo<LatLngLiteral>(() => {
    if (!currentAttraction) return warsawCenter;
    return { lat: currentAttraction.lat, lng: currentAttraction.lng };
  }, [currentAttraction]);

  const [routePoints, setRoutePoints] = useState<LatLngExpression[] | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);

  useEffect(() => {
    if (!solutionVisible || !guess) {
      setRoutePoints(null);
      setRouteDistance(null);
      return;
    }

    let cancelled = false;

    setRoutePoints(null);
    setRouteDistance(null);

    const destination: LatLng = { lat: actualPosition.lat, lng: actualPosition.lng };
    const playerGuess: LatLng = { lat: guess.lat, lng: guess.lng };

    const loadRoute = async () => {
      const route = await fetchRoute(destination, playerGuess);
      if (cancelled) return;

      if (route && route.points.length >= 2) {
        const latLngPath: LatLngExpression[] = route.points.map(([lng, lat]) => [lat, lng]);
        setRoutePoints(latLngPath);
        setRouteDistance(route.distance);
      } else {
        const fallback: LatLngExpression[] = [
          [destination.lat, destination.lng],
          [playerGuess.lat, playerGuess.lng],
        ];
        setRoutePoints(fallback);
        setRouteDistance(haversineDistanceMeters(destination, playerGuess));
      }
    };

    void loadRoute();
    return () => { cancelled = true; };
  }, [solutionVisible, guess?.lat, guess?.lng, actualPosition.lat, actualPosition.lng, roundIndex]);

  const animationDuration = useMemo(() => {
    if (!solutionVisible || !guess) return undefined;
    const distanceMeters = routeDistance ?? haversineDistanceMeters(actualPosition, guess);
    const calibrated = 1200 + distanceMeters * 0.2;
    const clamped = Math.min(3000, Math.max(1200, calibrated));
    return clamped;
  }, [solutionVisible, guess, routeDistance, actualPosition]);

  const animationKey = useMemo(() => {
    if (!solutionVisible || !guess) return null;
    return `${roundIndex}-${guess.lat.toFixed(4)}-${guess.lng.toFixed(4)}`;
  }, [solutionVisible, guess, roundIndex]);

  const guessIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: '<span class="marker marker--guess"></span>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    [],
  );

  const targetIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: '<span class="marker marker--target"></span>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    [],
  );

  if (!canMount) {
    return <div className="h-full w-full bg-gray-200 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'absolute', top: 0, left: 0 }}>
      <MapContainer
        center={warsawCenter}
        zoom={12}
        zoomControl={false}
        scrollWheelZoom={true}
        dragging={true}
        style={{ height: '100%', width: '100%' }}
      >
        <Pane name="solution" style={{ zIndex: 500 }} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
        <ZoomControl position="bottomright" />
        <MapClickHandler onGuess={onGuess} disabled={solutionVisible} />
        
        {guess && <Marker position={guess} icon={guessIcon} pane="solution" />}
        {solutionVisible && (
          <>
            <Marker position={actualPosition} icon={targetIcon} pane="solution" />
            {guess && routePoints && routePoints.length >= 2 && animationKey && (
              <SnakePolyline
                points={routePoints}
                pane="solution"
                animKey={animationKey}
                durationMs={animationDuration}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}
