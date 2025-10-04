// data/attractionFacts.ts
export type AttractionFacts = {
  thumbnail?: string;
  facts: string[];
};

type FactsDictionary = Record<number, AttractionFacts | undefined>;

const PLACEHOLDER_THUMB = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2264%22%20height%3D%2264%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2216%22%20fill%3D%22%232563eb%22%20/%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2256%25%22%20text-anchor%3D%22middle%22%20font-size%3D%2228%22%20fill%3D%22white%22%20font-family%3D%22Segoe%20UI%2C%20sans-serif%22%3EW%3C/text%3E%3C/svg%3E';

export const attractionFacts: FactsDictionary = {
  1: {
    thumbnail: PLACEHOLDER_THUMB,
    facts: [
      'Old Town was rebuilt from wartime rubble using 18th-century paintings as references.',
      'The square hosts the Mermaid of Warsaw statue, a symbol of the city.'
    ],
  },
  4: {
    thumbnail: PLACEHOLDER_THUMB,
    facts: [
      'The Palace of Culture and Science was a "gift" from the Soviet Union in 1955.',
      'At 237 metres, it is still the tallest building in Poland.'
    ],
  },
  6: {
    thumbnail: PLACEHOLDER_THUMB,
    facts: [
      'Copernicus Science Centre opened in 2010 and now welcomes more than one million visitors a year.',
      'Its rooftop garden offers one of the best Vistula River panoramas.'
    ],
  },
  8: {
    thumbnail: PLACEHOLDER_THUMB,
    facts: [
      'The Warsaw Uprising Museum opened on the 60th anniversary of the 1944 uprising.',
      'Its centrepiece is a 1940s bomber replica suspended through the main hall.'
    ],
  },
  9: {
    thumbnail: PLACEHOLDER_THUMB,
    facts: [
      'Wilanow Palace is often called the "Polish Versailles".',
      'It survived the partitions and both world wars almost untouched.'
    ],
  },
  14: {
    thumbnail: PLACEHOLDER_THUMB,
    facts: [
      'PGE Narodowy hosted the opening match of UEFA Euro 2012.',
      'Its retractable roof can close in about 20 minutes.'
    ],
  },
  31: {
    thumbnail: PLACEHOLDER_THUMB,
    facts: [
      'Norblin Factory has been reinvented as a cultural and gastronomic hub.',
      'Original machinery lines several museum-style corridors.'
    ],
  },
};

export function getAttractionFacts(attractionId: number): AttractionFacts | undefined {
  const baseId = Math.floor(attractionId / 100);
  return attractionFacts[baseId];
}
