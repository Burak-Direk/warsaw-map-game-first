// app/game/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import NextDynamic from 'next/dynamic';
import MapErrorBoundary from '../../components/MapErrorBoundary';
import type { LatLngLiteral } from 'leaflet';
import { useRouter } from 'next/navigation';
import type { Attraction } from './data/attractions';
import { getRandomAttractions } from './data/attractions';
import CountdownPill from '../../components/CountdownPill';
import { celebrateGood, celebratePerfect } from '../../lib/confetti';
import { flavor } from '../../lib/flavor';
import { getAttractionFacts } from '../../data/attractionFacts';

const TOTAL_ROUNDS = 10;
const MAX_SCORE_PER_ROUND = 1000;
const MAX_SCORE_TOTAL = TOTAL_ROUNDS * MAX_SCORE_PER_ROUND;

const GameMap = NextDynamic(() => import('./Map').then((m) => ({ default: m.default })), { ssr: false });

export const dynamic = 'force-dynamic';

const EARTH_RADIUS_KM = 6371;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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

function scoreFromDistanceKm(distanceKm: number): number {
  const DECAY_KM = 2.5;
  const score = Math.round(MAX_SCORE_PER_ROUND * Math.exp(-distanceKm / DECAY_KM));
  return Math.max(0, Math.min(MAX_SCORE_PER_ROUND, score));
}

type Difficulty = 'easy' | 'medium' | 'hard';

const GamePage = () => {
  const router = useRouter();
  const [rounds, setRounds] = useState<Attraction[] | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [guess, setGuess] = useState<LatLngLiteral | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [roundScore, setRoundScore] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [roundTimeSec, setRoundTimeSec] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [started, setStarted] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [roundKey, setRoundKey] = useState(0);
  const [roundTimedOut, setRoundTimedOut] = useState(false);
  const [showTimeoutToast, setShowTimeoutToast] = useState(false);

  useEffect(() => {
    setRounds(getRandomAttractions(TOTAL_ROUNDS));
  }, []);

  const toastTimeoutRef = useRef<number | null>(null);

  const currentAttraction = rounds ? rounds[roundIndex] : null;
  const currentRoundNumber = roundIndex + 1;
  const hasGuessed = guess !== null;
  const roundResolved = roundScore !== null;
  const isFinalRound = currentRoundNumber === TOTAL_ROUNDS;
  const isHard = difficulty === 'hard';

  const progressPercent = useMemo(
    () =>
      Math.min(
        100,
        Math.round(((roundIndex + (roundResolved ? 1 : 0)) / TOTAL_ROUNDS) * 100),
      ),
    [roundIndex, roundResolved],
  );

  const roundSummary = useMemo(
    () => ({
      distance: distanceKm !== null ? distanceKm.toFixed(2) : null,
      score: roundScore,
    }),
    [distanceKm, roundScore],
  );

  const flavorLine = useMemo(() => {
    if (distanceKm !== null) {
      return flavor(distanceKm);
    }
    if (roundTimedOut && roundResolved) {
      return 'Warsaw waited... maybe not for long next time.';
    }
    return null;
  }, [distanceKm, roundTimedOut, roundResolved]);

  const factsEntry = useMemo(
    () => (currentAttraction ? getAttractionFacts(currentAttraction.id) : null),
    [currentAttraction?.id],
  );

  const startTimer = useCallback(() => {
    setTimerRunning(true);
    setRoundKey((prev) => prev + 1);
  }, []);

  const stopTimer = useCallback(() => {
    setTimerRunning(false);
  }, []);

  const clearToastTimeout = useCallback(() => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
  }, []);

  const triggerTimeoutToast = useCallback(() => {
    clearToastTimeout();
    setShowTimeoutToast(true);
    toastTimeoutRef.current = window.setTimeout(() => {
      setShowTimeoutToast(false);
      toastTimeoutRef.current = null;
    }, 2600);
  }, [clearToastTimeout]);

  useEffect(() => () => {
    clearToastTimeout();
  }, [clearToastTimeout]);

  const handleGuess = (coordinates: LatLngLiteral) => {
    if (!started || hasGuessed || roundTimedOut || !timerRunning || !currentAttraction) return;

    const actualPosition: LatLngLiteral = {
      lat: currentAttraction.lat,
      lng: currentAttraction.lng,
    };

    const distance = getDistanceKm(coordinates, actualPosition);
    const baseScore = scoreFromDistanceKm(distance);
    const multiplier = isHard ? 1.15 : 1;
    const scoreAwarded = Math.min(MAX_SCORE_PER_ROUND, Math.round(baseScore * multiplier));

    setRoundTimedOut(false);
    setGuess(coordinates);
    setDistanceKm(distance);
    setRoundScore(scoreAwarded);
    setTotalScore((prev) => prev + scoreAwarded);
    stopTimer();

    if (distance < 0.5) {
      void celebratePerfect();
      navigator.vibrate?.(30);
    } else if (distance < 3) {
      void celebrateGood();
    }
  };

  const lockRoundWithTimeout = useCallback(() => {
    if (hasGuessed || roundTimedOut || !timerRunning) return;

    setRoundTimedOut(true);
    setGuess(null);
    setDistanceKm(null);
    setRoundScore(0);
    stopTimer();
    triggerTimeoutToast();
  }, [hasGuessed, roundTimedOut, timerRunning, stopTimer, triggerTimeoutToast]);

  const handleTimerExpire = useCallback(() => {
    lockRoundWithTimeout();
  }, [lockRoundWithTimeout]);

  const handleNextRound = () => {
    if (!roundResolved || timerRunning) return;

    if (roundIndex === TOTAL_ROUNDS - 1) {
      router.push(`/results?score=${totalScore}`);
      return;
    }

    clearToastTimeout();
    setShowTimeoutToast(false);
    setRoundIndex((prev) => prev + 1);
    setGuess(null);
    setDistanceKm(null);
    setRoundScore(null);
    setRoundTimedOut(false);
    startTimer();
  };

  const distancePrompt = hasGuessed && distanceKm !== null ? `Your guess was ${distanceKm.toFixed(2)} km away.` : null;
  const disableNextButton = timerRunning || !roundResolved;
  const showInstruction = !roundResolved && !roundTimedOut;

  const handleSecondsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (Number.isNaN(value)) {
      setRoundTimeSec(5);
      return;
    }
    setRoundTimeSec(clamp(Math.round(value), 5, 60));
  };

  const handleStart = () => {
    if (started) return;

    clearToastTimeout();
    setRoundTimeSec((prev) => clamp(Math.round(prev), 5, 60));
    setRoundTimedOut(false);
    setRoundScore(null);
    setDistanceKm(null);
    setGuess(null);
    setStarted(true);
    startTimer();
  };

  if (!rounds) {
    return (
      <main className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-300">
        Preparing game...
      </main>
    );
  }

  if (!started) {
    return (
      <main className="relative flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),transparent_65%)]"
          aria-hidden
        />
        <div className="relative z-10 w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-slate-950/80 p-10 shadow-2xl backdrop-blur-xl">
          <header className="space-y-2 text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">Warsaw Map Challenge</span>
            <h1 className="text-3xl font-semibold">Set your game pace</h1>
            <p className="text-sm text-slate-300">
              Choose your difficulty and the time you want for each guess. You have {TOTAL_ROUNDS} rounds to chase {MAX_SCORE_TOTAL} points.
            </p>
          </header>
          <div className="space-y-6">
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-200">
              Seconds per guess
              <input
                type="number"
                min={5}
                max={60}
                value={roundTimeSec}
                onChange={handleSecondsChange}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-base text-white shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </label>
            <fieldset className="flex flex-col gap-3 text-sm font-semibold text-slate-200">
              <legend className="text-xs uppercase tracking-[0.18em] text-indigo-300">Difficulty</legend>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                <label key={level} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="capitalize">{level}</span>
                  <input
                    type="radio"
                    name="difficulty"
                    value={level}
                    checked={difficulty === level}
                    onChange={() => setDifficulty(level)}
                    className="h-4 w-4 accent-indigo-500"
                  />
                </label>
              ))}
            </fieldset>
            <button
              type="button"
              onClick={handleStart}
              className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-blue-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Start game
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950 text-white">
      {/* Map container - NO DIFFICULTY PROP */}
      <div className="absolute inset-0">
        <MapErrorBoundary>
          <GameMap
            currentAttraction={rounds[roundIndex]}
            guess={guess}
            onGuess={handleGuess}
            solutionVisible={hasGuessed || roundTimedOut}
            roundIndex={roundIndex}
          />
        </MapErrorBoundary>
      </div>

      {showTimeoutToast && (
        <div className="pointer-events-none absolute top-6 left-1/2 z-[1200] -translate-x-1/2 rounded-full bg-rose-500/90 px-4 py-2 text-sm font-semibold shadow-xl">
          Time's up!
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-[1000] flex flex-col">
        <header className="flex items-start justify-between gap-6 px-6 pt-6">
          <div className="pointer-events-auto space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">Progress</div>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-xs text-slate-300">{progressPercent}% complete</div>
          </div>

          <div className="pointer-events-auto flex flex-col items-center gap-2">
            <CountdownPill
              seconds={roundTimeSec}
              running={timerRunning}
              onExpire={handleTimerExpire}
              keySeed={roundKey}
            />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Timer</span>
          </div>

          <div className="pointer-events-auto text-right space-y-1">
            <div className="text-sm font-semibold text-white">
              Score {totalScore} / {MAX_SCORE_TOTAL}
            </div>
            <div className="text-xs text-slate-300">
              Round {currentRoundNumber} / {TOTAL_ROUNDS}
            </div>
            <div className="text-xs text-slate-400">
              Difficulty: <span className="capitalize">{difficulty}</span> - {roundTimeSec}s per guess
            </div>
          </div>
        </header>

        <div className="mt-6 flex justify-center">
          <div className="pointer-events-auto rounded-full bg-slate-900/70 px-5 py-2 text-lg font-semibold shadow-lg">
            {currentAttraction?.name ?? 'Unknown location'}
          </div>
        </div>

        <div className="flex-1" />

        {showInstruction && (
          <div className="mb-10 flex justify-center">
            <div className="pointer-events-auto rounded-full bg-slate-900/80 px-6 py-3 text-sm font-medium shadow-lg">
              Click anywhere on the map to place your guess.
            </div>
          </div>
        )}
      </div>

      {(hasGuessed || roundTimedOut) && (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 z-[1100] w-[min(520px,90vw)] -translate-x-1/2">
          <div className="space-y-5 rounded-3xl border border-white/10 bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between text-sm uppercase tracking-[0.2em] text-slate-400">
              <span>
                Round {currentRoundNumber} of {TOTAL_ROUNDS}
              </span>
              <span className="text-base font-semibold text-indigo-300">
                {roundSummary.score ?? 0} pts
              </span>
            </div>

            {roundTimedOut && !hasGuessed ? (
              <p className="text-sm font-semibold text-rose-300">
                Time's up! The real location is highlighted on the map.
              </p>
            ) : null}

            {distancePrompt && (
              <div className="rounded-xl bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                {distancePrompt}
              </div>
            )}

            {flavorLine && (
              <p className="text-lg font-semibold text-sky-300">
                {flavorLine}
              </p>
            )}

            {factsEntry?.facts?.length ? (
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Fun facts</span>
                <ul className="space-y-1 text-sm text-slate-200">
                  {factsEntry.facts.map((fact, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-blue-300">-</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex justify-between text-sm text-slate-300">
              <span>Total score</span>
              <span className="font-semibold text-white">{totalScore} / {MAX_SCORE_TOTAL}</span>
            </div>

            <button
              type="button"
              onClick={handleNextRound}
              disabled={disableNextButton}
              className={`w-full rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                disableNextButton
                  ? 'cursor-not-allowed bg-slate-600/60 text-slate-300'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 text-white hover:shadow-blue-500/30'
              }`}
            >
              {isFinalRound ? 'View results' : 'Next round'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default GamePage;
