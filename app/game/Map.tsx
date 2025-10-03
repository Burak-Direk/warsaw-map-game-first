// app/game/Map.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Pane, TileLayer, ZoomControl, useMapEvent } from 'react-leaflet';
import type { LatLngExpression, LatLngLiteral } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Attraction } from './data/attractions';
import SnakePolyline from '../../components/SnakePolyline';
import { fetchRoute } from '../../lib/osrm';
import type { LatLng } from '../../lib/osrm';
import { warsawDistricts } from '../../data/warsawDistricts';

type MapProps = {
  currentAttraction: Attraction;
  guess: LatLngLiteral | null;
  onGuess: (coords: LatLngLiteral) => void;
  solutionVisible: boolean;
  roundIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
};

const warsawCenter: LatLngLiteral = { lat: 52.2297, lng: 21.0122 };
const EARTH_RADIUS_METERS = 6371000;

const toRadians = (value: number) => (value * Math.PI) / 180;

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
    onGuess(event.latlng);
  });
  return null;
};

const Map = ({ currentAttraction, guess, onGuess, solutionVisible, roundIndex, difficulty }: MapProps) => {
  const [canMount, setCanMount] = useState(false);

  const actualPosition = useMemo<LatLngLiteral>(() => {
    if (!currentAttraction) return warsawCenter;
    return { lat: currentAttraction.lat, lng: currentAttraction.lng };
  }, [currentAttraction]);

  const zoomLimits = useMemo(() => {
    if (difficulty === 'hard') {
      return { min: 11, max: 13 };
    }
    return { min: 10, max: 18 };
  }, [difficulty]);

  const districtLabelIcons = useMemo(() => {
    if (difficulty !== 'easy') return [];
    return warsawDistricts.map((district) => ({
      name: district.name,
      lat: district.lat,
      lng: district.lng,
      icon: L.divIcon({
        className: '',
        html: `<span class="district-label">${district.name}</span>`,
        iconSize: [160, 32],
        iconAnchor: [80, 16],
      }),
    }));
  }, [difficulty]);

  const [routePoints, setRoutePoints] = useState<LatLngExpression[] | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);

  useEffect(() => {
    setCanMount(true);
  }, []);

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
        const fallbackPath: LatLngExpression[] = [
          [destination.lat, destination.lng],
          [playerGuess.lat, playerGuess.lng],
        ];
        setRoutePoints(fallbackPath);
        setRouteDistance(haversineDistanceMeters(destination, playerGuess));
      }
    };

    void loadRoute();

    return () => {
      cancelled = true;
    };
  }, [
    solutionVisible,
    guess?.lat,
    guess?.lng,
    actualPosition.lat,
    actualPosition.lng,
    roundIndex,
  ]);

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
    return <div className="h-full w-full" />;
  }

  if (!currentAttraction) {
    return null;
  }

  return (
    <MapContainer
      key={`map-${difficulty}`}
      center={warsawCenter}
      zoom={12}
      minZoom={zoomLimits.min}
      maxZoom={zoomLimits.max}
      zoomControl={false}
      scrollWheelZoom
      className="h-full w-full"
    >
      <Pane name="solution" style={{ zIndex: 500 }} />
      {difficulty === 'easy' && (
        <Pane name="district-labels" style={{ zIndex: 650, pointerEvents: 'none' }}>
          {districtLabelIcons.map((district) => (
            <Marker
              key={district.name}
              position={{ lat: district.lat, lng: district.lng }}
              icon={district.icon}
              pane="district-labels"
              interactive={false}
            />
          ))}
        </Pane>
      )}
      <TileLayer
        attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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
  );
};

export default Map;
