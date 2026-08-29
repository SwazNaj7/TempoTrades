import { unstable_cache } from 'next/cache';
import {
  FALLBACK_INSTRUMENTS,
  INSTRUMENT_CATEGORIES,
  type DerivInstrument,
  type DerivInstrumentCatalog,
  type InstrumentCategoryId,
} from './types';

export type {
  DerivInstrument,
  DerivInstrumentCatalog,
  InstrumentCategory,
  InstrumentCategoryId,
} from './types';
export { FALLBACK_INSTRUMENTS, INSTRUMENT_CATEGORIES } from './types';

const SEARCH_QUERIES = [
  'Deriv:',
  'Deriv:Volatility',
  'Deriv:Crash',
  'Deriv:Boom',
  'Deriv:Jump',
  'Deriv:Step',
  'Deriv:Gold',
  'Deriv:Silver',
  'Deriv:Oil',
];

const TV_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Origin: 'https://www.tradingview.com',
  Referer: 'https://www.tradingview.com/',
  Accept: 'application/json',
};

interface TradingViewSymbolHit {
  symbol?: string;
  description?: string;
  type?: string;
  typespecs?: string[];
  exchange?: string;
  prefix?: string;
  full_name?: string;
}

const SYNTHETIC_PATTERN =
  /\b(volatility|crash|boom|jump|step|range\s*break|drift|dex|derived|synthetic|1hz|r_\d)\b/i;

const COMMODITY_PATTERN =
  /\b(gold|silver|oil|brent|wti|crude|natural\s*gas|xau|xag|copper|palladium|platinum|metal)\b/i;

function isDerivSymbol(hit: TradingViewSymbolHit): boolean {
  const exchange = (hit.exchange ?? '').toUpperCase();
  const prefix = (hit.prefix ?? '').toUpperCase();
  const fullName = (hit.full_name ?? '').toUpperCase();
  return exchange === 'DERIV' || prefix === 'DERIV' || fullName.startsWith('DERIV:');
}

function stripHighlight(value: string): string {
  return value.replace(/<\/?em>/gi, '').trim();
}

function categorize(hit: TradingViewSymbolHit): InstrumentCategoryId {
  const type = (hit.type ?? '').toLowerCase();
  const specs = (hit.typespecs ?? []).map((s) => s.toLowerCase()).join(' ');
  const text = `${hit.symbol ?? ''} ${hit.description ?? ''} ${type} ${specs}`;

  if (SYNTHETIC_PATTERN.test(text)) return 'synthetics';
  if (type === 'commodity' || COMMODITY_PATTERN.test(text)) return 'commodities';
  if (type === 'forex' || type === 'fx') return 'forex';
  if (type === 'bitcoin' || type === 'crypto' || type === 'cryptocurrency' || /\b(btc|eth|crypto)\b/i.test(text)) {
    return 'crypto';
  }
  return 'indices';
}

function parseHits(payload: unknown): TradingViewSymbolHit[] {
  if (Array.isArray(payload)) {
    return payload as TradingViewSymbolHit[];
  }
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.symbols)) {
      return record.symbols as TradingViewSymbolHit[];
    }
    if (Array.isArray(record.data)) {
      return record.data as TradingViewSymbolHit[];
    }
  }
  return [];
}

async function searchTradingView(query: string): Promise<TradingViewSymbolHit[]> {
  const urls = [
    `https://symbol-search.tradingview.com/symbol_search/v3/?text=${encodeURIComponent(query)}&hl=1&lang=en&domain=production`,
    `https://symbol-search.tradingview.com/symbol_search/?text=${encodeURIComponent(query)}&hl=1&lang=en&domain=production`,
  ];

  for (const url of urls) {
    const response = await fetch(url, {
      headers: TV_HEADERS,
      cache: 'no-store',
    });

    if (!response.ok) {
      continue;
    }

    const payload: unknown = await response.json();
    const hits = parseHits(payload);
    if (hits.length > 0) {
      return hits;
    }
  }

  return [];
}

function toInstrument(hit: TradingViewSymbolHit): DerivInstrument | null {
  const rawSymbol = stripHighlight(hit.symbol ?? '');
  if (!rawSymbol) return null;

  const displayName = stripHighlight(hit.description || rawSymbol);
  return {
    symbol: rawSymbol,
    displayName,
    categoryId: categorize(hit),
  };
}

function mergeInstruments(hits: TradingViewSymbolHit[]): DerivInstrument[] {
  const bySymbol = new Map<string, DerivInstrument>();
  const usedNames = new Set<string>();

  for (const hit of hits) {
    if (!isDerivSymbol(hit)) continue;
    const instrument = toInstrument(hit);
    if (!instrument || bySymbol.has(instrument.symbol)) continue;

    let displayName = instrument.displayName;
    if (usedNames.has(displayName)) {
      displayName = `${displayName} (${instrument.symbol})`;
    }
    usedNames.add(displayName);
    bySymbol.set(instrument.symbol, { ...instrument, displayName });
  }

  return [...bySymbol.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' })
  );
}

async function fetchTradingViewInstruments(): Promise<DerivInstrument[]> {
  const results = await Promise.allSettled(
    SEARCH_QUERIES.map((query) => searchTradingView(query))
  );

  const hits: TradingViewSymbolHit[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      hits.push(...result.value);
    }
  }

  return mergeInstruments(hits);
}

async function loadCatalog(): Promise<DerivInstrumentCatalog> {
  try {
    const instruments = await fetchTradingViewInstruments();
    if (instruments.length === 0) {
      return {
        categories: INSTRUMENT_CATEGORIES,
        instruments: FALLBACK_INSTRUMENTS,
        source: 'fallback',
      };
    }

    return {
      categories: INSTRUMENT_CATEGORIES,
      instruments,
      source: 'tradingview',
    };
  } catch (error) {
    console.error('TradingView symbol search failed:', error);
    return {
      categories: INSTRUMENT_CATEGORIES,
      instruments: FALLBACK_INSTRUMENTS,
      source: 'fallback',
    };
  }
}

export const getCachedDerivInstrumentCatalog = unstable_cache(
  loadCatalog,
  ['deriv-tradingview-symbols'],
  { revalidate: 60 * 60 * 24 }
);
