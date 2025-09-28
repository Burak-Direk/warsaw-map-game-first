// app/game/data/attractions.ts
  export type Attraction = {
    id: number;
    name: string;
    lat: number;
    lng: number;
  };

  const baseAttractions: Attraction[] = [
    { id: 1, name: 'Old Town Market Square', lat: 52.2497, lng: 21.0122 },
    { id: 2, name: 'Royal Castle', lat: 52.247, lng: 21.015 },
    { id: 3, name: 'Łazienki Park', lat: 52.2167, lng: 21.0412 },
    { id: 4, name: 'Palace of Culture and Science', lat: 52.2318, lng: 21.0067 },
    { id: 5, name: 'POLIN Museum of the History of Polish Jews', lat: 52.2491, lng: 20.9939 },
    { id: 6, name: 'Copernicus Science Centre', lat: 52.2415, lng: 21.0289 },
    { id: 7, name: 'National Museum in Warsaw', lat: 52.2313, lng: 21.0222 },
    { id: 8, name: 'Warsaw Uprising Museum', lat: 52.2329, lng: 20.9846 },
    { id: 9, name: 'Wilanów Palace', lat: 52.1641, lng: 21.0901 },
    { id: 10, name: 'Praga Museum of Warsaw', lat: 52.2508, lng: 21.0394 },
    { id: 11, name: 'Neon Museum', lat: 52.2478, lng: 21.0558 },
    { id: 12, name: 'Złote Tarasy', lat: 52.2291, lng: 21.0012 },
    { id: 13, name: 'Saski Garden', lat: 52.2432, lng: 21.0077 },
    { id: 14, name: 'PGE Narodowy Stadium', lat: 52.2395, lng: 21.0453 },
    { id: 15, name: 'University Library Gardens', lat: 52.2408, lng: 21.0223 },
    { id: 16, name: 'Chopin Museum', lat: 52.2353, lng: 21.0226 },
    { id: 17, name: 'Presidential Palace', lat: 52.243, lng: 21.0194 },
    { id: 18, name: 'Holy Cross Church', lat: 52.2409, lng: 21.0188 },
    { id: 19, name: "Sigismund's Column", lat: 52.2472, lng: 21.0159 },
    { id: 20, name: 'Warsaw Barbican', lat: 52.2506, lng: 21.0081 },
    { id: 21, name: "St. Anne's Church", lat: 52.2476, lng: 21.0145 },
    { id: 22, name: 'Museum of Warsaw', lat: 52.2499, lng: 21.0125 },
    { id: 23, name: 'Vistula Boulevards', lat: 52.244, lng: 21.026 },
    { id: 24, name: 'Krakowskie Przedmieście', lat: 52.2418, lng: 21.0197 },
    { id: 25, name: 'Nożyk Synagogue', lat: 52.2352, lng: 20.9989 },
    { id: 26, name: 'Hala Koszyki', lat: 52.2257, lng: 21.0156 },
    { id: 27, name: 'Plac Zbawiciela', lat: 52.2217, lng: 21.017 },
    { id: 28, name: 'Plac Grzybowski', lat: 52.233, lng: 21.001 },
    { id: 29, name: 'Muranów District Murals', lat: 52.247, lng: 20.9975 },
    { id: 30, name: 'Museum of Modern Art Temporary Pavilion', lat: 52.2346, lng: 21.0098 },
    { id: 31, name: 'Norblin Factory', lat: 52.2313, lng: 20.9918 },
    { id: 32, name: 'Koneser Vodka Factory', lat: 52.2554, lng: 21.0442 },
    { id: 33, name: 'Służewiec Horse Racetrack', lat: 52.1813, lng: 20.9984 },
    { id: 34, name: 'Pole Mokotowskie Park', lat: 52.2102, lng: 20.9915 },
    { id: 35, name: 'Pole Mokotowskie Library', lat: 52.2065, lng: 20.9855 },
    { id: 36, name: 'Fort Sokolnickiego', lat: 52.2683, lng: 20.9836 },
    { id: 37, name: "Żoliborz Officers' District", lat: 52.2665, lng: 20.9897 },
    { id: 38, name: 'Arkadia Shopping Mall', lat: 52.2587, lng: 20.9856 },
    { id: 39, name: 'Powązki Cemetery', lat: 52.2555, lng: 20.9839 },
    { id: 40, name: 'Powiśle Power Station', lat: 52.2367, lng: 21.0272 },
    { id: 41, name: 'Saska Kępa Café Street', lat: 52.2397, lng: 21.055 },
    { id: 42, name: 'Czerniakowskie Lake', lat: 52.1958, lng: 21.0634 },
    { id: 43, name: 'Gocław Balaton Park', lat: 52.2204, lng: 21.0776 },
    { id: 44, name: 'Ursynów Cultural Center', lat: 52.1463, lng: 21.0375 },
    { id: 45, name: 'Wola Park Shopping Center', lat: 52.243, lng: 20.9216 },
    { id: 46, name: 'Blue City Shopping Center', lat: 52.2203, lng: 20.9722 },
    { id: 47, name: 'Fort Bema', lat: 52.2504, lng: 20.9308 },
    { id: 48, name: 'Kampinos Forest Edge', lat: 52.3091, lng: 20.8092 },
    { id: 49, name: 'Modlin Fortress', lat: 52.4334, lng: 20.716 },
    { id: 50, name: 'Zegrze Reservoir Marina', lat: 52.4426, lng: 21.0357 },
    { id: 51, name: 'Otwock Wooden Architecture Trail', lat: 52.1067, lng: 21.2697 },
  ];

  const VARIANTS_PER_ATTRACTION = 10;

  export const attractions: Attraction[] = baseAttractions.flatMap((attraction) =>
    Array.from({ length: VARIANTS_PER_ATTRACTION }, (_, variantIndex) => ({
      id: attraction.id * 100 + variantIndex,
      name: variantIndex === 0 ? attraction.name : `${attraction.name} (${variantIndex + 1})`,
      lat: parseFloat((attraction.lat + variantIndex * 0.0002).toFixed(6)),
      lng: parseFloat((attraction.lng + variantIndex * 0.0002).toFixed(6)),
    }))
  );

  export function getRandomAttractions(count: number): Attraction[] {
    if (count > attractions.length) {
      throw new Error(`Requested ${count} attractions, but only ${attractions.length} are available.`);
    }
    const pool = [...attractions];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }