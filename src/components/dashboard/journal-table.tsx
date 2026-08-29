'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpDown, Search, ArrowUpRight, ArrowDownRight, List, LayoutGrid, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Trade, TradeResult, SetupGrade, Confidence } from '@/types/trade';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const SESSION_LABEL: Record<string, string> = {
  new_york_am: 'NY AM',
  new_york_pm: 'NY PM',
  london: 'London',
  asia: 'Asia',
};

const GRADE_CLASS: Record<SetupGrade, string> = {
  'A+': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  A: 'bg-green-500/15 text-green-700 dark:text-green-400',
  'A-': 'bg-lime-500/15 text-lime-700 dark:text-lime-400',
  B: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  C: 'bg-red-500/15 text-red-700 dark:text-red-400',
};

const resultBadge: Record<TradeResult, { label: string; cls: string }> = {
  take_profit: { label: 'Take Profit', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  break_even: { label: 'Break Even', cls: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300' },
  stopped_out: { label: 'Stopped Out', cls: 'bg-red-500/15 text-red-700 dark:text-red-400' },
};

const AI_CONF_LABEL: Record<Confidence, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

type ViewMode = 'compact' | 'cards';

export function JournalTable({ trades }: { trades: Trade[] }) {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<string>('all');
  const [direction, setDirection] = useState<string>('all');
  const [grade, setGrade] = useState<string>('all');
  const [sort, setSort] = useState<{ key: 'date' | 'pnl'; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' });
  const [view, setView] = useState<ViewMode>('compact');

  const filtered = useMemo(() => {
    let list = trades;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.instrument.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.setup_grade && t.setup_grade.toLowerCase().includes(q))
      );
    }
    if (result !== 'all') list = list.filter((t) => t.result === result);
    if (direction !== 'all') list = list.filter((t) => t.direction === direction);
    if (grade !== 'all') list = list.filter((t) => t.setup_grade === grade);

    const sorted = [...list].sort((a, b) => {
      if (sort.key === 'date') {
        return sort.dir === 'asc'
          ? new Date(a.open_time).getTime() - new Date(b.open_time).getTime()
          : new Date(b.open_time).getTime() - new Date(a.open_time).getTime();
      }
      return sort.dir === 'asc'
        ? (a.profit_amount || 0) - (b.profit_amount || 0)
        : (b.profit_amount || 0) - (a.profit_amount || 0);
    });

    return sorted;
  }, [trades, search, result, direction, grade, sort]);

  const toggleSort = (key: 'date' | 'pnl') =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search instrument, notes, grade…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={result} onValueChange={setResult}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Result" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="take_profit">Take Profit</SelectItem>
              <SelectItem value="break_even">Break Even</SelectItem>
              <SelectItem value="stopped_out">Stopped Out</SelectItem>
            </SelectContent>
          </Select>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Side" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Both Sides</SelectItem>
              <SelectItem value="long">Long</SelectItem>
              <SelectItem value="short">Short</SelectItem>
            </SelectContent>
          </Select>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="w-28"><SelectValue placeholder="Grade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {(['A+', 'A', 'A-', 'B', 'C'] as SetupGrade[]).map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="inline-flex rounded-lg border border-border/60 bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setView('compact')}
              aria-pressed={view === 'compact'}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                view === 'compact' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-4 w-4" /> Compact
            </button>
            <button
              type="button"
              onClick={() => setView('cards')}
              aria-pressed={view === 'cards'}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                view === 'cards' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-4 w-4" /> Cards
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="px-4 py-12 text-center text-muted-foreground">No trades match your filters.</div>
        </div>
      ) : view === 'compact' ? (
        <CompactTable filtered={filtered} sort={sort} toggleSort={toggleSort} />
      ) : (
        <CardGrid trades={filtered} />
      )}

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {trades.length} trades
      </p>
    </div>
  );
}

function CompactTable({
  filtered,
  sort,
  toggleSort,
}: {
  filtered: Trade[];
  sort: { key: 'date' | 'pnl'; dir: 'asc' | 'desc' };
  toggleSort: (key: 'date' | 'pnl') => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="cursor-pointer px-4 py-3 font-medium" onClick={() => toggleSort('date')}>
                <span className="inline-flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th className="px-4 py-3 font-medium">Instrument</th>
              <th className="px-4 py-3 font-medium">Direction</th>
              <th className="px-4 py-3 font-medium">Session</th>
              <th className="px-4 py-3 font-medium">R:R</th>
              <th className="cursor-pointer px-4 py-3 font-medium" onClick={() => toggleSort('pnl')}>
                <span className="inline-flex items-center gap-1">P&L <ArrowUpDown className="h-3 w-3" /></span>
              </th>
              <th className="px-4 py-3 font-medium">Result</th>
              <th className="px-4 py-3 font-medium">Setup</th>
              <th className="px-4 py-3 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const pnl = t.profit_amount || 0;
              const rb = resultBadge[t.result];
              return (
                <tr
                  key={t.id}
                  className="group border-b border-border/40 transition-colors last:border-0 hover:bg-muted/50"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`/dashboard/journal/${t.id}`} className="font-medium text-foreground hover:text-primary">
                      {format(new Date(t.open_time), 'MMM d, yyyy')}
                    </Link>
                    <p className="text-xs text-muted-foreground">{format(new Date(t.open_time), 'HH:mm')}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">{t.instrument}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
                        t.direction === 'long'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-700 dark:text-red-400'
                      )}
                    >
                      {t.direction === 'long' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {t.direction === 'long' ? 'Long' : 'Short'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.session ? SESSION_LABEL[t.session] ?? t.session : '—'}
                  </td>
                  <td className="px-4 py-3">{t.risk_reward ? `${t.risk_reward.toFixed(2)}R` : '—'}</td>
                  <td className={cn('px-4 py-3 font-semibold', pnl >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {pnl >= 0 ? '+' : ''}{pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn('font-medium', rb.cls)} variant="secondary">{rb.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn('font-medium', GRADE_CLASS[t.setup_grade ?? 'B'])} variant="secondary">
                      {t.setup_grade ?? '—'}
                    </Badge>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                    {t.notes ? t.notes : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CardGrid({ trades }: { trades: Trade[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {trades.map((t) => {
        const pnl = t.profit_amount || 0;
        const rb = resultBadge[t.result];
        return (
          <Link
            key={t.id}
            href={`/dashboard/journal/${t.id}`}
            className="group block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
              {t.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.image_url}
                  alt={`${t.instrument} trade`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
              <div className="absolute left-3 top-3 flex gap-2">
                <Badge className={cn('font-medium', GRADE_CLASS[t.setup_grade ?? 'B'])} variant="secondary">
                  {t.setup_grade ?? '—'}
                </Badge>
                <Badge className={cn('font-medium', rb.cls)} variant="secondary">{rb.label}</Badge>
              </div>
              <div
                className={cn(
                  'absolute right-3 top-3 rounded-lg px-2.5 py-1 text-sm font-bold text-white shadow',
                  pnl >= 0 ? 'bg-emerald-500/90' : 'bg-red-500/90'
                )}
              >
                {pnl >= 0 ? '+' : ''}
                {pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t.instrument}</span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
                      t.direction === 'long'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-500/10 text-red-700 dark:text-red-400'
                    )}
                  >
                    {t.direction === 'long' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {t.direction === 'long' ? 'Long' : 'Short'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{t.timeframe}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(t.open_time), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Session</p>
                  <p className="font-medium">{t.session ? (SESSION_LABEL[t.session] ?? t.session) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">R:R</p>
                  <p className="font-medium">{t.risk_reward ? `${t.risk_reward.toFixed(2)}R` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">AI Confidence</p>
                  <p className="font-medium">{t.ai_confidence ? AI_CONF_LABEL[t.ai_confidence] : '—'}</p>
                </div>
              </div>

              {t.notes && <p className="line-clamp-2 text-sm text-muted-foreground">{t.notes}</p>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
