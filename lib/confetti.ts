// lib/confetti.ts
type ConfettiModule = typeof import('canvas-confetti');
type ConfettiModuleWithDefault = ConfettiModule & { default?: ConfettiModule };

let confettiModule: ConfettiModule | null = null;
let loadingPromise: Promise<ConfettiModule | null> | null = null;

async function loadConfetti(): Promise<ConfettiModule | null> {
  if (typeof window === 'undefined') return null;
  if (confettiModule) return confettiModule;
  if (!loadingPromise) {
    loadingPromise = import('canvas-confetti')
      .then((mod) => {
        const moduleWithDefault = mod as ConfettiModuleWithDefault;
        const resolvedModule = moduleWithDefault.default ?? moduleWithDefault;
        confettiModule = resolvedModule;
        return resolvedModule;
      })
      .catch(() => null);
  }
  return loadingPromise;
}

async function fire(options: import('canvas-confetti').Options) {
  const confetti = await loadConfetti();
  if (!confetti) return;
  void confetti(options);
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
