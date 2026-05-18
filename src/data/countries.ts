import { Country } from '../types';

// Eurovision 2026 Grand Final running order (Vienna, May 16 2026)
export const COUNTRIES: Country[] = [
  { id: 'denmark',   name: 'דנמרק',     flag: '🇩🇰', isoCode: 'dk', performanceOrder: 1  },
  { id: 'germany',   name: 'גרמניה',    flag: '🇩🇪', isoCode: 'de', performanceOrder: 2  },
  { id: 'israel',    name: 'ישראל',     flag: '🇮🇱', isoCode: 'il', performanceOrder: 3  },
  { id: 'belgium',   name: 'בלגיה',     flag: '🇧🇪', isoCode: 'be', performanceOrder: 4  },
  { id: 'albania',   name: 'אלבניה',    flag: '🇦🇱', isoCode: 'al', performanceOrder: 5  },
  { id: 'greece',    name: 'יוון',      flag: '🇬🇷', isoCode: 'gr', performanceOrder: 6  },
  { id: 'ukraine',   name: 'אוקראינה',  flag: '🇺🇦', isoCode: 'ua', performanceOrder: 7  },
  { id: 'australia', name: 'אוסטרליה',  flag: '🇦🇺', isoCode: 'au', performanceOrder: 8  },
  { id: 'serbia',    name: 'סרביה',     flag: '🇷🇸', isoCode: 'rs', performanceOrder: 9  },
  { id: 'malta',     name: 'מלטה',      flag: '🇲🇹', isoCode: 'mt', performanceOrder: 10 },
  { id: 'czechia',   name: "צ'כיה",     flag: '🇨🇿', isoCode: 'cz', performanceOrder: 11 },
  { id: 'bulgaria',  name: 'בולגריה',   flag: '🇧🇬', isoCode: 'bg', performanceOrder: 12 },
  { id: 'croatia',   name: 'קרואטיה',   flag: '🇭🇷', isoCode: 'hr', performanceOrder: 13 },
  { id: 'uk',        name: 'בריטניה',   flag: '🇬🇧', isoCode: 'gb', performanceOrder: 14 },
  { id: 'france',    name: 'צרפת',      flag: '🇫🇷', isoCode: 'fr', performanceOrder: 15 },
  { id: 'moldova',   name: 'מולדובה',   flag: '🇲🇩', isoCode: 'md', performanceOrder: 16 },
  { id: 'finland',   name: 'פינלנד',    flag: '🇫🇮', isoCode: 'fi', performanceOrder: 17 },
  { id: 'poland',    name: 'פולין',     flag: '🇵🇱', isoCode: 'pl', performanceOrder: 18 },
  { id: 'lithuania', name: 'ליטא',      flag: '🇱🇹', isoCode: 'lt', performanceOrder: 19 },
  { id: 'sweden',    name: 'שוודיה',    flag: '🇸🇪', isoCode: 'se', performanceOrder: 20 },
  { id: 'cyprus',    name: 'קפריסין',   flag: '🇨🇾', isoCode: 'cy', performanceOrder: 21 },
  { id: 'italy',     name: 'איטליה',    flag: '🇮🇹', isoCode: 'it', performanceOrder: 22 },
  { id: 'norway',    name: 'נורווגיה',  flag: '🇳🇴', isoCode: 'no', performanceOrder: 23 },
  { id: 'romania',   name: 'רומניה',    flag: '🇷🇴', isoCode: 'ro', performanceOrder: 24 },
  { id: 'austria',   name: 'אוסטריה',   flag: '🇦🇹', isoCode: 'at', performanceOrder: 25 },
];

export const COUNTRY_MAP = Object.fromEntries(COUNTRIES.map(c => [c.id, c]));

export function flagUrl(isoCode: string) {
  return `https://flagcdn.com/32x24/${isoCode}.png`;
}
