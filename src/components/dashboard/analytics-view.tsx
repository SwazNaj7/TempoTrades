'use client';

import {
  GradeDistribution,
  ResultDistribution,
  SessionPerformance,
} from '@/components/dashboard/charts';
import { AnalyticsCharts } from '@/components/dashboard/analytics-charts';
import { StatsCard } from '@/components/dashboard/stats-cards';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrades } from '@/lib/use-trades';
import type { SetupGrade, TradeResult } from '@/types/trade';
import { TrendingUp, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

export function AnalyticsView() {
  const { trades, loading } = useTrades();

  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.result === 'take_profit').length;
  const losses = trades.filter((t) => t.result === 'stopped_out').length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  const withPnl = trades.filter((t) => t.profit_amount !== null && t.profit_amount !== undefined);
  const totalPnL = withPnl.reduce((s, t) => s + (t.profit_amount || 0), 0);
  const grossProfit = withPnl.filter((t) => (t.profit_amount || 0) > 0).reduce((s, t) => s + (t.profit_amount || 0), 0);
  const grossLoss = withPnl.filter((t) => (t.profit_amount || 0) < 0).reduce((s, t) => s + (t.profit_amount || 0), 0);
  const profitFactor = grossLoss !== 0 ? grossProfit / Math.abs(grossLoss) : grossProfit > 0 ? Infinity : 0;
  const avgWin = wins > 0 ? grossProfit / wins : 0;
  const avgLoss = losses > 0 ? grossLoss / losses : 0;
  const largestWin = withPnl.length ? Math.max(...withPnl.map((t) => t.profit_amount || 0)) : 0;

  const rrValues = trades.filter((t) => t.risk_reward !== null && t.risk_reward !== undefined).map((t) => t.risk_reward as number);
  const avgRR = rrValues.length ? rrValues.reduce((s, v) => s + v, 0) / rrValues.length : 0;
  const gradeScore: Record<SetupGrade, number> = { 'A+': 100, A: 85, 'A-': 70, B: 50, C: 25 };
  const grades = trades.map((t) => (t.setup_grade ? gradeScore[t.setup_grade] : 0)).filter(Boolean);
  const avgGradeScore = grades.length ? grades.reduce((s, v) => s + v, 0) / grades.length : 0;
  const radar = [
    { metric: 'Win Rate', value: Math.round(winRate), fullMark: 100 },
    { metric: 'Profitability', value: Math.round(clamp(profitFactor === Infinity ? 100 : 50 + (profitFactor - 1) * 25)), fullMark: 100 },
    { metric: 'Risk Mgmt', value: Math.round(clamp((avgRR / 3) * 100)), fullMark: 100 },
    { metric: 'Consistency', value: Math.round(clamp(winRate * 0.6 + 40)), fullMark: 100 },
    { metric: 'Quality', value: Math.round(avgGradeScore), fullMark: 100 },
    { metric: 'Discipline', value: Math.round(trades.length ? (trades.filter((t) => t.notes && t.notes.trim()).length / trades.length) * 100 : 0), fullMark: 100 },
  ];

  const gradeDistribution: Record<SetupGrade, number> = { 'A+': 0, A: 0, 'A-': 0, B: 0, C: 0 };
  trades.forEach((t) => {
    if (t.setup_grade && t.setup_grade in gradeDistribution) gradeDistribution[t.setup_grade as SetupGrade]++;
  });
  const resultDistribution: Record<TradeResult, number> = { take_profit: 0, stopped_out: 0, break_even: 0 };
  trades.forEach((t) => {
    if (t.result in resultDistribution) resultDistribution[t.result as TradeResult]++;
  });
  const sessionPerformance = {
    new_york_am: { wins: 0, total: 0 },
    new_york_pm: { wins: 0, total: 0 },
    asia: { wins: 0, total: 0 },
    london: { wins: 0, total: 0 },
  };
  trades.forEach((t) => {
    const s = t.session;
    if (s && s in sessionPerformance) {
      const key = s as keyof typeof sessionPerformance;
      sessionPerformance[key].total++;
      if (t.result === 'take_profit') sessionPerformance[key].wins++;
    }
  });

  if (loading && trades.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[300px] rounded-xl lg:col-span-2" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Deep dive into your trading performance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Win Rate" value={`${winRate.toFixed(1)}%`} subtitle={`${totalTrades} trades`} icon={<Activity className="h-4 w-4" />} valueTone="default" />
        <StatsCard title="Total P&L" value={`${totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`} icon={<DollarSign className="h-4 w-4" />} valueTone={totalPnL >= 0 ? 'positive' : 'negative'} />
        <StatsCard title="Profit Factor" value={profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)} icon={<TrendingUp className="h-4 w-4" />} valueTone={profitFactor >= 1 ? 'positive' : 'negative'} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Avg Win" value={`+${avgWin.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`} icon={<ArrowUpRight className="h-4 w-4" />} valueTone="positive" />
        <StatsCard title="Avg Loss" value={`${avgLoss.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`} icon={<ArrowDownRight className="h-4 w-4" />} valueTone="negative" />
        <StatsCard title="Largest Win" value={`+${largestWin.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`} valueTone="positive" />
      </div>

      <AnalyticsCharts trades={trades} radar={radar} />
      <div className="grid gap-4 lg:grid-cols-3">
        <SessionPerformance sessions={sessionPerformance} />
        <GradeDistribution distribution={gradeDistribution} />
        <ResultDistribution distribution={resultDistribution} />
      </div>
    </div>
  );
}
