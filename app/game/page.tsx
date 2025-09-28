// app/game/page.tsx
  'use client';

  import { useMemo, useState } from 'react';
  import dynamic from 'next/dynamic';
  import type { LatLngLiteral } from 'leaflet';
  import { useRouter } from 'next/navigation';
  import type { Attraction } from './data/attractions';
  import { getRandomAttractions } from './data/attractions';

  const TOTAL_ROUNDS = 10;

  const GameMap = dynamic(() => import('./Map'), { ssr: false });

  type RoundResult = {
    attractionId: number;
    guess: LatLngLiteral;
    distanceKm: number;
    score: number;
  };

  const EARTH_RADIUS_KM = 6371;

  function toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  function getDistanceKm(a: LatLngLiteral, b: LatLngLiteral): number {
    const dLat = toRadians(b.lat - a.lat);
    const dLng = toRadians(b.lng - a.lng);
    const lat1 = toRadians(a.lat);
    const lat2 = toRadians(b.lat);

    const hav =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(hav));
  }

  function getScore(distanceKm: number): number {
    const rawScore = 5000 * Math.exp(-distanceKm / 5);
    return Math.max(0, Math.round(rawScore));
  }

  const GamePage = () => {
    const router = useRouter();
    const [rounds] = useState<Attraction[]>(() => getRandomAttractions(TOTAL_ROUNDS));
    const [roundIndex, setRoundIndex] = useState(0);
    const [guess, setGuess] = useState<LatLngLiteral | null>(null);
    const [distanceKm, setDistanceKm] = useState<number | null>(null);
    const [roundScore, setRoundScore] = useState<number | null>(null);
    const [totalScore, setTotalScore] = useState(0);
    const [history, setHistory] = useState<RoundResult[]>([]);

    const currentAttraction = rounds[roundIndex];
    const currentRoundNumber = roundIndex + 1;
    const hasGuessed = guess !== null;

    const roundSummary = useMemo(
      () => ({
        distance: distanceKm !== null ? distanceKm.toFixed(2) : null,
        score: roundScore,
      }),
      [distanceKm, roundScore],
    );

    const handleGuess = (coordinates: LatLngLiteral) => {
      if (hasGuessed) return;

      const actualPosition: LatLngLiteral = {
        lat: currentAttraction.lat,
        lng: currentAttraction.lng,
      };

      const distance = getDistanceKm(coordinates, actualPosition);
      const scoreAwarded = getScore(distance);

      setGuess(coordinates);
      setDistanceKm(distance);
      setRoundScore(scoreAwarded);
      setTotalScore((prev) => prev + scoreAwarded);
      setHistory((prev) => [
        ...prev,
        {
          attractionId: currentAttraction.id,
          guess: coordinates,
          distanceKm: distance,
          score: scoreAwarded,
        },
      ]);
    };

    const handleNextRound = () => {
      if (!hasGuessed) return;

      if (roundIndex === TOTAL_ROUNDS - 1) {
        router.push(`/results?score=${totalScore}`);
        return;
      }

      setRoundIndex((prev) => prev + 1);
      setGuess(null);
      setDistanceKm(null);
      setRoundScore(null);
    };

    return (
      <div className="flex min-h-screen flex-col gap-6 p-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Warsaw Map Challenge</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
            <span className="font-medium text-neutral-900">
              Round {currentRoundNumber} of {TOTAL_ROUNDS}
            </span>
            <span>Total score: {totalScore}</span>
            {roundSummary.distance && roundSummary.score !== null && (
              <span>
                Last guess: {roundSummary.distance} km away, {roundSummary.score} pts
              </span>
            )}
          </div>
          <p className="text-base text-neutral-700">
            Find: <span className="font-semibold">{currentAttraction.name}</span>
          </p>
          <p className="text-sm text-neutral-500">
            Click on the map where you think the attraction is located.
          </p>
        </header>

        <div className="h-[520px] overflow-hidden rounded-lg border border-neutral-200 shadow-sm">
         {currentAttraction && (
  <GameMap
    currentAttraction={currentAttraction}
    guess={guess}
    onGuess={handleGuess}
    solutionVisible={hasGuessed}
  />
)}

        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            {hasGuessed ? (
              <>
                <div>
                  Distance: {distanceKm?.toFixed(2)} km &middot; Round score:{' '}
                  {roundScore}
                </div>
                <div>Total score: {totalScore}</div>
              </>
            ) : (
              <span>Tap the map to lock in your guess.</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleNextRound}
            disabled={!hasGuessed}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500
  disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {currentRoundNumber === TOTAL_ROUNDS ? 'See Results' : 'Next Round'}
          </button>
        </div>
      </div>
    );
  };

  export default GamePage;