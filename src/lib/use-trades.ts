'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getTrades } from '@/app/actions';
import type { Trade } from '@/types/trade';

const CACHE_KEY = 'tempotrades:trades';
const TTL = 30_000;

type CacheEntry = { data: Trade[]; ts: number; userId: string };

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

async function fetchTrades(userId: string): Promise<CacheEntry> {
  if (inflight) return inflight;
  inflight = (async () => {
    const supabase = createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (authError || !user) {
      memory.delete(CACHE_KEY);
      if (typeof window !== 'undefined') {
        try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
      }
      return { data: [], ts: Date.now(), userId: '' };
    }

    if (user.id !== userId) {
      // User changed - clear cache and fetch fresh data
      memory.delete(CACHE_KEY);
      try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
    }

    const result = await getTrades();

    if (!result.success || !result.data) {
      memory.delete(CACHE_KEY);
      try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
      return { data: [], ts: Date.now(), userId: user.id };
    }

    const trades = result.data;

    const entry: CacheEntry = {
      data: trades,
      ts: Date.now(),
      userId: user.id,
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

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedUserId, setCachedUserId] = useState<string>('');

  const load = useCallback(async (force = false) => {
    const current = readCache();
    if (
      !force &&
      current &&
      Date.now() - current.ts < TTL &&
      current.data.length > 0 &&
      current.userId === cachedUserId
    ) {
      setTrades(current.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const entry = await fetchTrades(cachedUserId || '');
      setTrades(entry.data);
      setCachedUserId(entry.userId);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trades');
    } finally {
      setLoading(false);
    }
  }, [cachedUserId]);

  useEffect(() => {
    load();
  }, [load, cachedUserId]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  return { trades, loading, error, refresh: () => load(true), cachedUserId };
}