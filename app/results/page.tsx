// app/results/page.tsx
'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

const MAX_SCORE_TOTAL = 10000;

function ResultsInner() {
  const searchParams = useSearchParams();
  const scoreParam = Number(searchParams.get('score') ?? '0');
  const score = Number.isFinite(scoreParam) ? scoreParam : 0;
  const safeScore = Math.max(0, Math.min(MAX_SCORE_TOTAL, Math.round(score)));

  const formattedScore = useMemo(() => new Intl.NumberFormat('en-US').format(safeScore), [safeScore]);

  const headline = safeScore >= 9000 ? 'Legendary navigator!' : safeScore >= 7000 ? 'Capital city pro!' : 'Great run!';
  const subtext =
    safeScore >= 9000
      ? 'You read Warsaw like a local guide. Ready for a flawless encore?'
      : safeScore >= 7000
        ? 'So close to perfection! One more lap could seal the crown.'
        : 'Solid effort! Replay the run and see how much closer you can get.';

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-16 sm:px-8">
      <div
        className="absolute inset-x-16 top-10 hidden h-72 rounded-full bg-gradient-to-r from-blue-500/25 via-indigo-500/15 to-cyan-400/25 blur-3xl sm:block"
        aria-hidden
      />
      <div className="glass-card relative flex w-full max-w-xl flex-col items-center gap-8 overflow-hidden px-8 py-12 text-center sm:px-12">
        <div
          className="pointer-events-none absolute -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-blue-500/25 via-indigo-500/20 to-transparent blur-3xl"
          aria-hidden
        />
        <span className="pill">Mission complete</span>
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-slate-100">{headline}</h1>
          <p className="text-base text-slate-600 dark:text-slate-300">{subtext}</p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/60 bg-white/75 px-8 py-6 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/60">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Final score</span>
          <span className="text-5xl font-semibold text-slate-900 dark:text-slate-100">{formattedScore} / 10,000</span>
        </div>
        <div className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-300">
          <span>Ready for another lap around Warsaw?</span>
          <Link
            href="/game"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <span className="absolute inset-0 opacity-0 transition group-hover:opacity-20" aria-hidden />
            <span className="relative flex items-center gap-2">
              Play again
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 transition-transform group-hover:-rotate-12 group-hover:translate-x-1"
              >
                <path d="M6.28 5.22a.75.75 0 0 1 0 1.06L3.56 9l9.69.003a.75.75 0 0 1 0 1.5L3.56 10.5l2.72 2.72a.75.75 0 1 1-1.06 1.06L1.22 10.78a.75.75 0 0 1 0-1.06l4-4a.75.75 0 0 1 1.06 0Z" />
                <path d="M12.25 4a.75.75 0 0 1 .75.75V7.5h3.75a.75.75 0 0 1 0 1.5H13v2.75a.75.75 0 0 1-1.5 0V9H7.75a.75.75 0 0 1 0-1.5H11V4.75A.75.75 0 0 1 11.75 4h.5Z" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500">Loading results...</div>}>
      <ResultsInner />
    </Suspense>
  );
}
