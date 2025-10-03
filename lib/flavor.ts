// lib/flavor.ts
export function flavor(distanceKm: number): string {
  if (distanceKm < 0.3) return 'You could smell the zapiekanka from here.';
  if (distanceKm < 1.5) return 'Close enough for the tram bell.';
  if (distanceKm < 5) return 'GPS shrugged at you.';
  return 'Other side of the Vistula vibes.';
}
