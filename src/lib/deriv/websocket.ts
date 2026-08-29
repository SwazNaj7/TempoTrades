// Client-side Deriv WebSocket integration.
// Connects to the Deriv WS API, fetches all active symbols, and groups them
// into two top-level markets: "Standard" and "Synthetics".

export type PairGroupId = 'standard' | 'synthetic';

export interface DerivPair {
  symbol: string;
  displayName: string;
  market: string;
  marketLabel: string;
  submarket: string;
  submarketLabel: string;
  group: PairGroupId;
}

export interface DerivPairSubmarket {
  label: string;
  pairs: DerivPair[];
}

export interface DerivPairGroup {
  id: PairGroupId;
  label: string;
  submarkets: DerivPairSubmarket[];
}

export interface DerivPairCatalog {
  groups: DerivPairGroup[];
  pairs: DerivPair[];
  source: 'websocket' | 'fallback';
}

// Derived from the public Deriv Options WebSocket API
// (https://api.derivws.com/trading/v1/options/ws/public).
interface RawActiveSymbol {
  underlying_symbol: string;
  underlying_symbol_name: string;
  market: string;
  submarket: string;
  underlying_symbol_type?: string;
}

const MARKET_LABELS: Record<string, string> = {
  forex: 'Forex',
  commodities: 'Commodities',
  indices: 'Stock Indices',
  cryptocurrency: 'Cryptocurrencies',
  synthetic_index: 'Synthetic Indices',
};

const DERIV_WS_URL =
  process.env.NEXT_PUBLIC_DERIV_WS_URL ?? 'wss://api.derivws.com/trading/v1/options/ws/public';

function toGroup(market: string): PairGroupId {
  return market === 'synthetic_index' ? 'synthetic' : 'standard';
}

function marketLabel(market: string): string {
  return MARKET_LABELS[market] ?? market.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettify(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function buildPairs(raw: RawActiveSymbol[]): DerivPair[] {
  return raw
    .map((symbol) => ({
      symbol: symbol.underlying_symbol,
      displayName: symbol.underlying_symbol_name || symbol.underlying_symbol,
      market: symbol.market,
      marketLabel: marketLabel(symbol.market),
      submarket: symbol.submarket,
      submarketLabel: prettify(symbol.submarket),
      group: toGroup(symbol.market),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }));
}

function buildGroups(pairs: DerivPair[]): DerivPairGroup[] {
  const groupDefs: { id: PairGroupId; label: string }[] = [
    { id: 'standard', label: 'Standard' },
    { id: 'synthetic', label: 'Synthetic' },
  ];

  return groupDefs.map((def) => {
    const groupPairs = pairs.filter((p) => p.group === def.id);
    const submarketOrder: string[] = [];
    const submarketMap = new Map<string, DerivPair[]>();

    for (const pair of groupPairs) {
      if (!submarketMap.has(pair.submarketLabel)) {
        submarketMap.set(pair.submarketLabel, []);
        submarketOrder.push(pair.submarketLabel);
      }
      submarketMap.get(pair.submarketLabel)!.push(pair);
    }

    const submarkets: DerivPairSubmarket[] = submarketOrder.map((label) => ({
      label,
      pairs: submarketMap.get(label)!,
    }));

    return { id: def.id, label: def.label, submarkets };
  });
}

/**
 * Fetch all Deriv active symbols over a WebSocket connection and return them
 * grouped into Standard and Synthetic markets.
 */
export function fetchDerivActiveSymbols(): Promise<DerivPairCatalog> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const ws = new WebSocket(DERIV_WS_URL);

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      ws.close();
      reject(new Error('Deriv WebSocket request timed out'));
    }, 15000);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          active_symbols: 'brief',
          req_id: 1,
        })
      );
    };

    ws.onmessage = (event) => {
      if (settled) return;

      try {
        const response = JSON.parse(event.data as string);

        if (response.error) {
          settled = true;
          clearTimeout(timeout);
          ws.close();
          reject(new Error(response.error.message || 'Deriv API error'));
          return;
        }

        if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
          settled = true;
          clearTimeout(timeout);
          ws.close();
          reject(new Error(response.errors[0].message || 'Deriv API error'));
          return;
        }

        if (response.msg_type === 'active_symbols') {
          settled = true;
          clearTimeout(timeout);
          ws.close();

          const pairs = buildPairs(response.active_symbols ?? []);
          resolve({
            groups: buildGroups(pairs),
            pairs,
            source: 'websocket',
          });
        }
      } catch (error) {
        settled = true;
        clearTimeout(timeout);
        ws.close();
        reject(error instanceof Error ? error : new Error('Failed to parse Deriv response'));
      }
    };

    ws.onerror = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error instanceof Error ? error : new Error('Deriv WebSocket error'));
    };
  });
}
