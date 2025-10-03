// app/game/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import dynamic from 'next/dynamic';
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

const GameMap = dynamic(() => import('./Map'), { ssr: false });

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
  const [rounds] = useState<Attraction[]>(() => getRandomAttractions(TOTAL_ROUNDS));
  const [roundIndex, setRoundIndex] = useState(0);
  const [guess, setGuess] = useState<LatLngLiteral | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [roundScore, setRoundScore] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [roundTimeSec, setRoundTimeSec] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [showPreGame, setShowPreGame] = useState(true);
  const [timerRunning, setTimerRunning] = useState(false);
  const [roundKey, setRoundKey] = useState(0);
  const [roundTimedOut, setRoundTimedOut] = useState(false);
  const [showTimeoutToast, setShowTimeoutToast] = useState(false);

  const toastTimeoutRef = useRef<number | null>(null);

  const currentAttraction = rounds[roundIndex];
  const currentRoundNumber = roundIndex + 1;
  const hasGuessed = guess !== null;
  const isFinalRound = currentRoundNumber === TOTAL_ROUNDS;
  const roundResolved = roundScore !== null;
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

  const factsEntry = useMemo(() => getAttractionFacts(currentAttraction.id), [currentAttraction.id]);

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
    if (hasGuessed || roundTimedOut || !timerRunning) return;

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
  const totalScoreBarPct = (totalScore / MAX_SCORE_TOTAL) * 100;
  const roundScoreBarPct = roundScore !== null ? (roundScore / MAX_SCORE_PER_ROUND) * 100 : 0;
  const disableNextButton = timerRunning || !roundResolved;

  const handleSecondsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (Number.isNaN(value)) {
      setRoundTimeSec(5);
      return;
    }
    setRoundTimeSec(clamp(Math.round(value), 5, 60));
  };

  const handleStartGame = () => {
    clearToastTimeout();
    setRoundTimeSec((prev) => clamp(Math.round(prev), 5, 60));
    setShowPreGame(false);
    setRoundTimedOut(false);
    setRoundScore(null);
    setDistanceKm(null);
    setGuess(null);
    startTimer();
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-8">
      <div
        className="absolute inset-x-12 top-12 hidden h-64 rounded-full bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-cyan-400/20 blur-3xl md:block"
        aria-hidden
      />

      <div className="relative w-full max-w-6xl">
        <section className="glass-card grid gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div className="flex flex-col justify-between gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                <span className="pill">Round {currentRoundNumber} / {TOTAL_ROUNDS}</span>
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                  {totalScore} / {MAX_SCORE_TOTAL}
                </span>
              </div>

              <div>
                <h1 className="text-4xl font-semibold text-slate-900 text-balance dark:text-slate-100">
                  Warsaw Map Challenge
                </h1>
                <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                  Drop your pin on the exact spot of iconic Warsaw attractions. The closer you are, the higher your score.
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <span>Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/60">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-200">Now spotting</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {currentAttraction?.name}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  Place a marker on the map and lock in your best guess to reveal the real location.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-[220px] flex-col gap-3 rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-sm shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/50">
                {hasGuessed && roundSummary.distance && roundSummary.score !== null ? (
                  <>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Last guess</span>
                    <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {roundSummary.distance} km away
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Round score</span>
                    <span className="text-base font-semibold text-slate-900 dark:text-slate-100">{roundSummary.score} pts</span>
                  </>
                ) : roundTimedOut && roundResolved ? (
                  <span className="text-base font-semibold text-rose-500">Time's up! Score: 0</span>
                ) : (
                  <>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tip</span>
                    <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Tap the map to lock in your marker before time runs out.
                    </span>
                  </>
                )}

                <div className="rounded-lg border border-indigo-400/40 bg-white/70 p-3 dark:border-indigo-400/30 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-300">
                    <span className="flex items-center gap-2">
                      Round points
                      {isHard && <span className="multiplier-pill">+15%</span>}
                    </span>
                    <span>{roundScore ?? 0} / {MAX_SCORE_PER_ROUND}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-indigo-200/50 dark:bg-indigo-900/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-300 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, roundScoreBarPct))}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200/60 bg-white/70 p-3 dark:border-slate-700/60 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                    <span>Total points</span>
                    <span>{totalScore} / {MAX_SCORE_TOTAL}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, totalScoreBarPct))}%` }}
                    />
                  </div>
                </div>

                {flavorLine && (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-300">{flavorLine}</p>
                )}

                {roundResolved && factsEntry && factsEntry.facts.length > 0 && (
                  <div className="facts-card">
                    {factsEntry.thumbnail && (
                      <img src={factsEntry.thumbnail} alt="Attraction thumbnail" className="facts-card__thumb" />
                    )}
                    <div className="facts-card__body">
                      <span className="facts-card__title">Quick facts</span>
                      <ul className="facts-card__list">
                        {factsEntry.facts.slice(0, 2).map((fact) => (
                          <li key={fact}>{fact}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleNextRound}
                disabled={disableNextButton}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="absolute inset-0 opacity-0 transition group-hover:opacity-20" aria-hidden />
                <span className="relative flex items-center gap-2">
                  {isFinalRound ? 'See Results' : 'Next Round'}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 10a.75.75 0 0 1 .75-.75h9.69l-2.72-2.72a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06l2.72-2.72H3.75A.75.75 0 0 1 3 10Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-transparent blur-3xl"
              aria-hidden
            />
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-white/50 bg-slate-950/5 shadow-xl backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/40">
              {!showPreGame && (
                <CountdownPill
                  seconds={roundTimeSec}
                  running={timerRunning}
                  onExpire={handleTimerExpire}
                  keySeed={roundKey}
                />
              )}

              {distancePrompt && (
                <div className="pointer-events-none absolute inset-x-6 top-6 flex items-center justify-center rounded-full bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-md dark:bg-slate-900/80 dark:text-slate-100">
                  {distancePrompt}
                </div>
              )}

              {!showPreGame && roundTimedOut && !hasGuessed && !timerRunning && (
                <div className="pointer-events-none absolute inset-x-6 top-6 flex items-center justify-center rounded-full bg-white/85 px-4 py-2 text-sm font-medium text-rose-500 shadow-sm backdrop-blur-md dark:bg-slate-900/80">
                  Time's up! The real spot is highlighted.
                </div>
              )}

              {showTimeoutToast && (
                <div className="timeout-toast">Time's up!</div>
              )}

              {currentAttraction && !showPreGame && (
                <GameMap
                  currentAttraction={currentAttraction}
                  guess={guess}
                  onGuess={handleGuess}
                  solutionVisible={hasGuessed || roundTimedOut}
                  roundIndex={roundIndex}
                  difficulty={difficulty}
                />
              )}

              {!showPreGame && !hasGuessed && !timerRunning && (
                <div className="pointer-events-none absolute inset-x-6 bottom-6 flex items-center justify-center rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-md dark:bg-slate-900/80 dark:text-slate-200">
                  {roundTimedOut ? "Time's up! Review the answer and continue." : 'Click anywhere on the map to place your guess'}
                </div>
              )}

              {showPreGame && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/70 backdrop-blur-md">
                  <div className="glass-card relative w-full max-w-md space-y-6 px-8 py-10 text-left">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Set your pace</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Choose how many seconds you want for each guess. You will have {TOTAL_ROUNDS} rounds to score a perfect {MAX_SCORE_TOTAL} points.
                    </p>
                    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Seconds per guess
                      <input
                        type="number"
                        min={5}
                        max={60}
                        value={roundTimeSec}
                        onChange={handleSecondsChange}
                        className="w-full rounded-lg border border-slate-200 bg-white/80 px-4 py-2 text-base text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
                      />
                    </label>
                    <fieldset className="flex flex-col gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <legend className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Difficulty</legend>
                      {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                        <label key={level} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="difficulty"
                            value={level}
                            checked={difficulty === level}
                            onChange={() => setDifficulty(level)}
                            className="h-4 w-4 accent-indigo-500"
                          />
                          <span className="capitalize">{level}</span>
                        </label>
                      ))}
                    </fieldset>
                    <button
                      type="button"
                      onClick={handleStartGame}
                      className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-blue-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      Start game
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default GamePage;








