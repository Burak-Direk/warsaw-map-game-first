// app/results/page.tsx
'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Vercel/Next'in bu sayfayı prerender etmesini engelle:
export const dynamic = 'force-dynamic';

function ResultsInner() {
  const searchParams = useSearchParams();
  const score = Number(searchParams.get('score') ?? '0');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div>
        <h1 className="text-4xl font-semibold">Game Complete!</h1>
        <p className="mt-4 text-lg text-neutral-600">
          Your final score: <span className="font-bold text-blue-600">{score}</span>
        </p>
      </div>
      <Link
        href="/game"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
      >
        Play Again
      </Link>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading results…</div>}>
      <ResultsInner />
    </Suspense>
  );
}
