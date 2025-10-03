// lib/osrm.ts
export type LatLng = { lat: number; lng: number };
export type OsrmRoute = { points: [number, number][]; distance: number } | null;

const DEFAULT_TIMEOUT = 4000;
const BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

export async function fetchRoute(
  from: LatLng,
  to: LatLng,
  timeoutMs: number = DEFAULT_TIMEOUT,
): Promise<OsrmRoute> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const url = `${BASE_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: controller?.signal });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      routes?: Array<{ distance: number; geometry?: { coordinates?: [number, number][] } }>;
    };

    const route = data.routes?.[0];
    const coordinates = route?.geometry?.coordinates;

    if (!route || !coordinates || coordinates.length < 2) {
      return null;
    }

    return {
      points: coordinates,
      distance: route.distance,
    };
  } catch (error) {
    return null;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
