 // app/game/Map.tsx
  'use client';

  import { useMemo } from 'react';
  import dynamic from 'next/dynamic';
  import { MapContainer, Marker, Polyline, TileLayer, useMapEvent } from 'react-leaflet';
  import type { LatLngLiteral } from 'leaflet';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import type { Attraction } from './data/attractions';

  type MapProps = {
    currentAttraction: Attraction;
    guess: LatLngLiteral | null;
    onGuess: (coords: LatLngLiteral) => void;
    solutionVisible: boolean;
  };

  const warsawCenter: LatLngLiteral = { lat: 52.2297, lng: 21.0122 };

  if (typeof window !== 'undefined') {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }

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

  const Map = ({ currentAttraction, guess, onGuess, solutionVisible }: MapProps) => {
  const actualPosition = useMemo<LatLngLiteral>(() => {
  if (!currentAttraction) return warsawCenter; // fallback
  return { lat: currentAttraction.lat, lng: currentAttraction.lng };
}, [currentAttraction]);


    return (
      <MapContainer center={warsawCenter} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onGuess={onGuess} disabled={solutionVisible} />
        {guess && <Marker position={guess} />}
        {solutionVisible && (
          <>
            <Marker position={actualPosition} />
            {guess && (
              <Polyline
                positions={[guess, actualPosition]}
                color="#ef4444"
                weight={4}
                opacity={0.8}
              />
            )}
          </>
        )}
      </MapContainer>
    );
  };

  export default Map;