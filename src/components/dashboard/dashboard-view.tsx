'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Target,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatsCard } from '@/components/dashboard/stats-cards';
import dynamic from 'next/dynamic';
import { useTrades } from '@/lib/use-trades';
import { Skeleton } from '@/components/ui/skeleton';
import type { SetupGrade } from '@/types/trade';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ChartSkeleton = () => (
  <div className="flex h-[260px] items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-sm text-muted-foreground">
    Loading chart…
  </div>
);

const DailyPnLChart = dynamic(
  () => import('@/components/dashboard/charts').then((m) => m.DailyPnLChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const PerformanceRadar = dynamic(
  () => import('@/components/dashboard/charts').then((m) => m.PerformanceRadar),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[300px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

const GRADE_SCORE: Record<SetupGrade, number> = {
  'A+': 100,
  A: 85,
  'A-': 70,
  B: 50,
  C: 25,
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function fmtCurrency(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`;
}

export function DashboardView() {
  const { trades, loading } = useTrades();
  const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const chartDays = range === '7d' ? 7 : range === '30d' ? 30 : 90;

  const filtered = useMemo(() => {
    if (range === 'all') return trades;
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return trades.filter((t) => new Date(t.open_time) >= cutoff);
  }, [trades, range]);

  const stats = useMemo(() => {
    const withPnl = filtered.filter((t) => t.profit_amount !== null && t.profit_amount !== undefined);
    const wins = filtered.filter((t) => t.result === 'take_profit').length;
    const total = filtered.length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;

    const totalPnL = withPnl.reduce((s, t) => s + (t.profit_amount || 0), 0);
    const grossProfit = withPnl.filter((t) => (t.profit_amount || 0) > 0).reduce((s, t) => s + (t.profit_amount || 0), 0);
    const grossLoss = withPnl.filter((t) => (t.profit_amount || 0) < 0).reduce((s, t) => s + (t.profit_amount || 0), 0);
    const profitFactor = grossLoss !== 0 ? grossProfit / Math.abs(grossLoss) : grossProfit > 0 ? Infinity : 0;
    const returnsPct = grossProfit + Math.abs(grossLoss) > 0 ? (totalPnL / (grossProfit + Math.abs(grossLoss))) * 100 : 0;

    const rrValues = filtered.filter((t) => t.risk_reward !== null && t.risk_reward !== undefined).map((t) => t.risk_reward as number);
    const avgRR = rrValues.length ? rrValues.reduce((s, v) => s + v, 0) / rrValues.length : 0;

    const notesPct = total > 0 ? (filtered.filter((t) => t.notes && t.notes.trim().length > 0).length / total) * 100 : 0;

    const daily: Record<string, number> = {};
    withPnl.forEach((t) => {
      const k = format(new Date(t.open_time), 'yyyy-MM-dd');
      daily[k] = (daily[k] || 0) + (t.profit_amount || 0);
    });
    const dailyVals = Object.values(daily);
    const mean = dailyVals.length ? dailyVals.reduce((s, v) => s + v, 0) / dailyVals.length : 0;
    const variance = dailyVals.length ? dailyVals.reduce((s, v) => s + (v - mean) ** 2, 0) / dailyVals.length : 0;
    const std = Math.sqrt(variance);
    const consistency = dailyVals.length ? clamp(100 - (std / (Math.abs(mean) + 1)) * 60) : 0;

    const gradeScores = filtered.map((t) => (t.setup_grade ? GRADE_SCORE[t.setup_grade] : 0)).filter(Boolean);
    const avgGradeScore = gradeScores.length ? gradeScores.reduce((s, v) => s + v, 0) / gradeScores.length : 0;

    const radar = [
      { metric: 'Win Rate', value: Math.round(winRate), fullMark: 100 },
      { metric: 'Profitability', value: Math.round(clamp(profitFactor === Infinity ? 100 : 50 + (profitFactor - 1) * 25)), fullMark: 100 },
      { metric: 'Risk Mgmt', value: Math.round(clamp((avgRR / 3) * 100)), fullMark: 100 },
      { metric: 'Consistency', value: Math.round(consistency), fullMark: 100 },
      { metric: 'Quality', value: Math.round(avgGradeScore), fullMark: 100 },
      { metric: 'Discipline', value: Math.round(notesPct), fullMark: 100 },
    ];

    const instrumentStats: Record<string, { pl: number; wins: number; total: number; avg: number }> = {};
    filtered.forEach((t) => {
      const s = t.instrument;
      if (!instrumentStats[s]) instrumentStats[s] = { pl: 0, wins: 0, total: 0, avg: 0 };
      instrumentStats[s].total += 1;
      if (t.result === 'take_profit') instrumentStats[s].wins += 1;
      instrumentStats[s].pl += t.profit_amount || 0;
    });
    Object.values(instrumentStats).forEach((v) => {
      v.avg = v.total ? v.pl / v.total : 0;
    });

    const recent = [...filtered]
      .sort((a, b) => new Date(b.open_time).getTime() - new Date(a.open_time).getTime())
      .slice(0, 6);

    return {
      total,
      winRate,
      totalPnL,
      profitFactor,
      returnsPct,
      avgRR,
      radar,
      instrumentStats,
      recent,
    };
  }, [filtered]);

  const instruments = Object.entries(stats.instrumentStats).sort((a, b) => b[1].pl - a[1].pl);
  const featured = instruments.find(([name]) => /volatility 75( 1s)?/i.test(name)) || instruments[0];
  const others = instruments.filter(([name]) => name !== featured?.[0]);

  const empty = trades.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trading Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Track your performance and spot opportunities at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Weekly</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && empty ? (
        <DashboardSkeleton />
      ) : empty ? (
        <Card className="border-dashed border-2 bg-card/50">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">No trades logged yet</p>
              <p className="text-sm text-muted-foreground">Add your first trade to start building your dashboard.</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/trade">Add New Trade</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!empty && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Win Rate"
              value={`${stats.winRate.toFixed(1)}%`}
              subtitle={`${stats.total} trades`}
              icon={<Target className="h-4 w-4" />}
              valueTone="default"
            />
            <StatsCard
              title="Total P&L"
              value={fmtCurrency(stats.totalPnL)}
              subtitle="Net realized"
              icon={<DollarSign className="h-4 w-4" />}
              valueTone={stats.totalPnL >= 0 ? 'positive' : 'negative'}
            />
            <StatsCard
              title="Returns"
              value={`${stats.returnsPct >= 0 ? '+' : ''}${stats.returnsPct.toFixed(1)}%`}
              subtitle="Net efficiency"
              icon={<TrendingUp className="h-4 w-4" />}
              valueTone={stats.returnsPct >= 0 ? 'positive' : 'negative'}
            />
            <StatsCard
              title="Profit Factor"
              value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
              subtitle="Gross win / loss"
              icon={<Activity className="h-4 w-4" />}
              valueTone={stats.profitFactor >= 1 ? 'positive' : 'negative'}
            />
          </div>

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DailyPnLChart trades={filtered} days={chartDays} />
            </div>
            <PerformanceRadar data={stats.radar} />
          </div>

          {/* Instruments + Activity */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="bg-card border-border/60 shadow-sm lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Instrument Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {featured && (
                  <div className="mb-4 flex items-center justify-between rounded-2xl bg-primary p-5 text-primary-foreground">
                    <div>
                      <p className="text-xs opacity-80">Top Performer</p>
                      <p className="text-lg font-semibold">{featured[0]}</p>
                      <p className="text-sm opacity-80">
                        {featured[1].total} trades ·{' '}
                        {featured[1].total ? Math.round((featured[1].wins / featured[1].total) * 100) : 0}% win
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-normal">{fmtCurrency(featured[1].pl)}</p>
                      <p className="text-xs opacity-80">avg {fmtCurrency(featured[1].avg)}</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {others.slice(0, 6).map(([name, s]) => (
                    <div key={name} className="rounded-xl border border-border/60 p-3">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <p className={cn('text-base font-normal', s.pl >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {fmtCurrency(s.pl)}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.total} trades</p>
                    </div>
                  ))}
                  {others.length === 0 && (
                    <p className="col-span-full text-sm text-muted-foreground">Only one instrument traded.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                  <Link href="/dashboard/journal">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-1">
                {stats.recent.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent trades.</p>
                )}
                {stats.recent.map((t) => (
                  <Link
                    key={t.id}
                    href={`/dashboard/journal/${t.id}`}
                    className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.instrument}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.direction === 'long' ? 'Long' : 'Short'} · {format(new Date(t.open_time), 'MMM d')}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'flex items-center gap-1 text-sm font-semibold',
                        (t.profit_amount || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}
                    >
                      {(t.profit_amount || 0) >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {fmtCurrency(t.profit_amount || 0)}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
