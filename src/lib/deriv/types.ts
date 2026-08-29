export type InstrumentCategoryId =
  | 'synthetics'
  | 'commodities'
  | 'forex'
  | 'crypto'
  | 'indices';

export interface InstrumentCategory {
  id: InstrumentCategoryId;
  label: string;
}

export interface DerivInstrument {
  symbol: string;
  displayName: string;
  categoryId: InstrumentCategoryId;
}

export interface DerivInstrumentCatalog {
  categories: InstrumentCategory[];
  instruments: DerivInstrument[];
  source: 'tradingview' | 'fallback';
}

export const INSTRUMENT_CATEGORIES: InstrumentCategory[] = [
  { id: 'synthetics', label: 'Synthetics' },
  { id: 'commodities', label: 'Commodities' },
  { id: 'forex', label: 'Forex' },
  { id: 'crypto', label: 'Cryptocurrencies' },
  { id: 'indices', label: 'Stock Indices' },
];

export const FALLBACK_INSTRUMENTS: DerivInstrument[] = [
  { symbol: 'R_10', displayName: 'Volatility 10 Index', categoryId: 'synthetics' },
  { symbol: 'R_25', displayName: 'Volatility 25 Index', categoryId: 'synthetics' },
  { symbol: 'R_50', displayName: 'Volatility 50 Index', categoryId: 'synthetics' },
  { symbol: 'R_75', displayName: 'Volatility 75 Index', categoryId: 'synthetics' },
  { symbol: 'R_100', displayName: 'Volatility 100 Index', categoryId: 'synthetics' },
  { symbol: '1HZ10V', displayName: 'Volatility 10 (1s) Index', categoryId: 'synthetics' },
  { symbol: '1HZ25V', displayName: 'Volatility 25 (1s) Index', categoryId: 'synthetics' },
  { symbol: '1HZ50V', displayName: 'Volatility 50 (1s) Index', categoryId: 'synthetics' },
  { symbol: '1HZ75V', displayName: 'Volatility 75 (1s) Index', categoryId: 'synthetics' },
  { symbol: '1HZ100V', displayName: 'Volatility 100 (1s) Index', categoryId: 'synthetics' },
  { symbol: 'BOOM300N', displayName: 'Boom 300 Index', categoryId: 'synthetics' },
  { symbol: 'BOOM500', displayName: 'Boom 500 Index', categoryId: 'synthetics' },
  { symbol: 'BOOM1000', displayName: 'Boom 1000 Index', categoryId: 'synthetics' },
  { symbol: 'CRASH300N', displayName: 'Crash 300 Index', categoryId: 'synthetics' },
  { symbol: 'CRASH500', displayName: 'Crash 500 Index', categoryId: 'synthetics' },
  { symbol: 'CRASH1000', displayName: 'Crash 1000 Index', categoryId: 'synthetics' },
  { symbol: 'JD10', displayName: 'Jump 10 Index', categoryId: 'synthetics' },
  { symbol: 'JD25', displayName: 'Jump 25 Index', categoryId: 'synthetics' },
  { symbol: 'JD50', displayName: 'Jump 50 Index', categoryId: 'synthetics' },
  { symbol: 'JD75', displayName: 'Jump 75 Index', categoryId: 'synthetics' },
  { symbol: 'JD100', displayName: 'Jump 100 Index', categoryId: 'synthetics' },
  { symbol: 'stpRNG', displayName: 'Step Index', categoryId: 'synthetics' },
  { symbol: 'frxXAUUSD', displayName: 'Gold', categoryId: 'commodities' },
  { symbol: 'frxXAGUSD', displayName: 'Silver', categoryId: 'commodities' },
  { symbol: 'frxXBRUSD', displayName: 'Brent Crude Oil', categoryId: 'commodities' },
  { symbol: 'frxXTIUSD', displayName: 'WTI Crude Oil', categoryId: 'commodities' },
];
