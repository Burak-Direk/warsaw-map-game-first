// lib/confetti.ts
let confettiModule: typeof import('canvas-confetti') | null = null;
let loadingPromise: Promise<typeof import('canvas-confetti') | null> | null = null;

async function loadConfetti(): Promise<typeof import('canvas-confetti') | null> {
  if (typeof window === 'undefined') return null;
  if (confettiModule) return confettiModule;
  if (!loadingPromise) {
    loadingPromise = import('canvas-confetti')
      .then((mod) => {
        confettiModule = mod;
        return mod;
      })
      .catch(() => null);
  }
  return loadingPromise;
}

async function fire(options: import('canvas-confetti').Options) {
  const mod = await loadConfetti();
  if (!mod) return;
  const confetti = mod.default;
  confetti(options);
}

export function celebratePerfect() {
  void fire({
    particleCount: 200,
    spread: 70,
    gravity: 0.8,
    scalar: 1,
    ticks: 200,
    origin: { y: 0.6 },
  });
}

export function celebrateGood() {
  void fire({
    particleCount: 110,
    spread: 55,
    gravity: 1,
    scalar: 0.9,
    ticks: 160,
    origin: { y: 0.7 },
  });
}

