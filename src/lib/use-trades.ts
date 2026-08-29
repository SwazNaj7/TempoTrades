'use client';

import { useCallback, useEffect, useState } from 'react';
import { getTrades } from '@/app/actions';
import type { Trade } from '@/types/trade';

const CACHE_KEY = 'tempotrades:trades';
const TTL = 30_000;

type CacheEntry = { data: Trade[]; ts: number };

const memory = new Map<string, CacheEntry>();
let inflight: Promise<CacheEntry> | null = null;

function readSession(): CacheEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheEntry) : null;
  } catch {
    return null;
  }
}

function writeSession(entry: CacheEntry) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* ignore quota errors */
  }
}

function readCache(): CacheEntry | null {
  return memory.get(CACHE_KEY) ?? readSession();
}

async function fetchTrades(): Promise<CacheEntry> {
  if (inflight) return inflight;
  inflight = (async () => {
    const res = await getTrades();
    const entry: CacheEntry = {
      data: res.success ? (res.data as Trade[]) : [],
      ts: Date.now(),
    };
    memory.set(CACHE_KEY, entry);
    writeSession(entry);
    return entry;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function useTrades() {
  const cached = readCache();
  const [trades, setTrades] = useState<Trade[]>(cached ? cached.data : []);
  const [loading, setLoading] = useState(() => (cached ? Date.now() - cached.ts > TTL : true));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    const current = readCache();
    if (!force && current && Date.now() - current.ts < TTL) {
      setTrades(current.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const entry = await fetchTrades();
      setTrades(entry.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trades');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  return { trades, loading, error, refresh: () => load(true) };
}

export function invalidateTrades() {
  memory.delete(CACHE_KEY);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch {
      /* ignore */
    }
  }
}
