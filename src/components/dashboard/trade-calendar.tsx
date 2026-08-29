'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
} from 'date-fns';
import { cn } from '@/lib/utils';
import type { Trade } from '@/types/trade';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TradeCalendar({ trades }: { trades: Trade[] }) {
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);

  const daily = useMemo(() => {
    const map: Record<string, { pl: number; count: number; trades: Trade[] }> = {};
    trades.forEach((t) => {
      const key = format(new Date(t.open_time), 'yyyy-MM-dd');
      if (!map[key]) map[key] = { pl: 0, count: 0, trades: [] };
      map[key].pl += t.profit_amount || 0;
      map[key].count += 1;
      map[key].trades.push(t);
    });
    return map;
  }, [trades]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const selectedKey = selected ? format(selected, 'yyyy-MM-dd') : null;
  const selectedTrades = selectedKey ? daily[selectedKey]?.trades ?? [] : [];

  const maxAbs = useMemo(() => {
    const vals = Object.values(daily).map((d) => Math.abs(d.pl));
    return vals.length ? Math.max(...vals) : 1;
  }, [daily]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{format(cursor, 'MMMM yyyy')}</h2>
          <div className="flex gap-1">
            <button
              onClick={() => setCursor((c) => addMonths(c, -1))}
              className="rounded-lg border border-border/60 p-1.5 transition-colors hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCursor(new Date())}
              className="rounded-lg border border-border/60 px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              Today
            </button>
            <button
              onClick={() => setCursor((c) => addMonths(c, 1))}
              className="rounded-lg border border-border/60 p-1.5 transition-colors hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-1 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const cell = daily[key];
            const inMonth = isSameMonth(day, cursor);
            const isSel = selected && isSameDay(day, selected);
            const intensity = cell ? Math.round((Math.abs(cell.pl) / maxAbs) * 100) : 0;
            return (
              <button
                key={key}
                onClick={() => setSelected(isSel ? null : day)}
                className={cn(
                  'flex h-20 flex-col justify-between rounded-xl border p-2 text-left transition-colors',
                  inMonth ? 'border-border/50 bg-background' : 'border-transparent bg-muted/30 text-muted-foreground',
                  isSel && 'ring-2 ring-primary',
                  !cell && 'hover:bg-muted/60',
                  cell && cell.pl >= 0 && 'hover:bg-emerald-500/10',
                  cell && cell.pl < 0 && 'hover:bg-red-500/10'
                )}
                style={
                  cell
                    ? cell.pl >= 0
                      ? { backgroundColor: `rgba(16,185,129,${0.08 + (intensity / 100) * 0.22})` }
                      : { backgroundColor: `rgba(239,68,68,${0.08 + (intensity / 100) * 0.22})` }
                    : undefined
                }
              >
                <span className={cn('text-xs font-medium', !inMonth && 'opacity-50')}>
                  {format(day, 'd')}
                </span>
                {cell && (
                  <span
                    className={cn(
                      'flex items-center gap-0.5 text-xs font-semibold',
                      cell.pl >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                    )}
                  >
                    {cell.pl >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(cell.pl).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-medium">
          {selected ? format(selected, 'EEEE, MMM d') : 'Select a day'}
        </h3>
        {!selected && <p className="text-sm text-muted-foreground">Click a day on the calendar to view its trades.</p>}
        {selected && selectedTrades.length === 0 && (
          <p className="text-sm text-muted-foreground">No trades on this day.</p>
        )}
        <div className="space-y-2">
          {selectedTrades.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/journal/${t.id}`}
              className="block rounded-xl border border-border/60 p-3 transition-colors hover:bg-muted"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t.instrument}</span>
                <span className={cn('text-sm font-semibold', (t.profit_amount || 0) >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                  {(t.profit_amount || 0) >= 0 ? '+' : ''}
                  {(t.profit_amount || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t.direction === 'long' ? 'Long' : 'Short'} · {t.setup_grade} · {format(new Date(t.open_time), 'HH:mm')}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
