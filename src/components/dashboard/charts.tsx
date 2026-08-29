'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SetupGrade, TradeResult, Trade } from '@/types/trade';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, subMonths, subYears, startOfDay, isAfter } from 'date-fns';

interface GradeDistributionProps {
  distribution: Record<SetupGrade, number>;
}

const gradeConfig: Record<SetupGrade, { color: string; bgColor: string }> = {
  'A+': { color: 'bg-emerald-500', bgColor: 'bg-emerald-500/20' },
  'A': { color: 'bg-green-500', bgColor: 'bg-green-500/20' },
  'A-': { color: 'bg-lime-500', bgColor: 'bg-lime-500/20' },
  'B': { color: 'bg-amber-500', bgColor: 'bg-amber-500/20' },
  'C': { color: 'bg-red-500', bgColor: 'bg-red-500/20' },
};

export function GradeDistribution({ distribution }: GradeDistributionProps) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const grades: SetupGrade[] = ['A+', 'A', 'A-', 'B', 'C'];

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Grade Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {grades.map((grade) => {
          const count = distribution[grade] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={grade} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{grade}</span>
                <span className="text-muted-foreground">
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className={cn('h-2 rounded-full', gradeConfig[grade].bgColor)}>
                <div
                  className={cn('h-full rounded-full transition-all', gradeConfig[grade].color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface ResultDistributionProps {
  distribution: Record<TradeResult, number>;
}

const resultConfig: Record<TradeResult, { label: string; color: string; bgColor: string }> = {
  take_profit: { label: 'Take Profit', color: 'bg-emerald-500', bgColor: 'bg-emerald-500/20' },
  break_even: { label: 'Break Even', color: 'bg-zinc-500', bgColor: 'bg-zinc-500/20' },
  stopped_out: { label: 'Stopped Out', color: 'bg-red-500', bgColor: 'bg-red-500/20' },
};

export function ResultDistribution({ distribution }: ResultDistributionProps) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const results: TradeResult[] = ['take_profit', 'break_even', 'stopped_out'];

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Trade Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.map((result) => {
          const count = distribution[result] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const config = resultConfig[result];

          return (
            <div key={result} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{config.label}</span>
                <span className="text-muted-foreground">
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className={cn('h-2 rounded-full', config.bgColor)}>
                <div
                  className={cn('h-full rounded-full transition-all', config.color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface SessionPerformanceProps {
  sessions: {
    new_york_am: { wins: number; total: number };
    new_york_pm: { wins: number; total: number };
    asia: { wins: number; total: number };
    london: { wins: number; total: number };
  };
}

export function SessionPerformance({ sessions }: SessionPerformanceProps) {
  const sessionData = [
    { name: 'New York AM', ...sessions.new_york_am },
    { name: 'New York PM', ...sessions.new_york_pm },
    { name: 'London', ...sessions.london },
    { name: 'Asia', ...sessions.asia },
  ];

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Session Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessionData.map((session) => {
            const winRate = session.total > 0 ? (session.wins / session.total) * 100 : 0;

            return (
              <div key={session.name} className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{session.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.wins}/{session.total} trades
                  </p>
                </div>
                <div
                  className={cn(
                    'text-lg font-bold',
                    winRate >= 60 && 'text-emerald-500',
                    winRate >= 40 && winRate < 60 && 'text-amber-500',
                    winRate < 40 && 'text-red-500'
                  )}
                >
                  {session.total > 0 ? `${winRate.toFixed(0)}%` : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Time period filter options
type TimePeriod = 'week' | 'month' | 'year' | 'all';

interface TradesOverTimeProps {
  trades: Trade[];
}

export function TradesOverTimeChart({ trades }: TradesOverTimeProps) {
  const [period, setPeriod] = useState<TimePeriod>('all');

  // Filter trades based on selected period
  const getFilteredTrades = () => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case 'year':
        startDate = subYears(now, 1);
        break;
      case 'all':
      default:
        return trades;
    }

    return trades.filter((t) => isAfter(new Date(t.open_time), startDate));
  };

  // Group trades by date and count
  const getChartData = () => {
    const filtered = getFilteredTrades();
    const grouped: Record<string, { count: number; timestamp: number }> = {};

    filtered.forEach((trade) => {
      const tradeDate = startOfDay(new Date(trade.open_time));
      const dateKey = format(tradeDate, 'MMM d');
      if (!grouped[dateKey]) {
        grouped[dateKey] = { count: 0, timestamp: tradeDate.getTime() };
      }
      grouped[dateKey].count += 1;
    });

    // Convert to array and sort by timestamp
    return Object.entries(grouped)
      .map(([date, { count, timestamp }]) => ({ date, trades: count, timestamp }))
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  const data = getChartData();

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Trades Over Time</CardTitle>
          <div className="flex gap-1">
            {(['week', 'month', 'year', 'all'] as TimePeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-2 py-1 text-xs rounded-md transition-colors',
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                {p === 'week' ? '7D' : p === 'month' ? '1M' : p === 'year' ? '1Y' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            No trades in this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="tradesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(99, 102, 241)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="rgb(99, 102, 241)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-foreground/15" vertical={false} />
              <XAxis
                dataKey="date"
                className="text-xs fill-foreground"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                className="text-xs fill-foreground"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  color: 'var(--popover-foreground)',
                }}
                labelStyle={{ color: 'var(--popover-foreground)' }}
                itemStyle={{ color: 'rgb(129, 140, 248)' }}
              />
              <Area
                type="monotone"
                dataKey="trades"
                stroke="rgb(129, 140, 248)"
                fillOpacity={1}
                fill="url(#tradesGradient)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

interface ProfitOverTimeProps {
  trades: Trade[];
}

export function ProfitOverTimeChart({ trades }: ProfitOverTimeProps) {
  const [period, setPeriod] = useState<TimePeriod>('all');

  // Filter trades based on selected period
  const getFilteredTrades = () => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case 'year':
        startDate = subYears(now, 1);
        break;
      case 'all':
      default:
        return trades;
    }

    return trades.filter((t) => isAfter(new Date(t.open_time), startDate));
  };

  // Calculate cumulative P&L over time
  const getChartData = () => {
    const filtered = getFilteredTrades()
      .filter((t) => t.profit_amount !== null && t.profit_amount !== undefined)
      .sort((a, b) => new Date(a.open_time).getTime() - new Date(b.open_time).getTime());

    let cumulative = 0;
    const data: { date: string; profit: number; cumulative: number; timestamp: number }[] = [];

    filtered.forEach((trade) => {
      const tradeDate = startOfDay(new Date(trade.open_time));
      const dateKey = format(tradeDate, 'MMM d');
      const timestamp = tradeDate.getTime();
      cumulative += trade.profit_amount || 0;
      
      // Find existing entry or create new
      const existing = data.find((d) => d.date === dateKey);
      if (existing) {
        existing.profit += trade.profit_amount || 0;
        existing.cumulative = cumulative;
      } else {
        data.push({
          date: dateKey,
          profit: trade.profit_amount || 0,
          cumulative,
          timestamp,
        });
      }
    });

    // Sort by timestamp to ensure correct order
    return data.sort((a, b) => a.timestamp - b.timestamp);
  };

  const data = getChartData();
  const totalProfit = data.length > 0 ? data[data.length - 1]?.cumulative || 0 : 0;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Cumulative P&L</CardTitle>
            <p className={cn(
              "text-2xl font-bold mt-1",
              totalProfit > 0 && "text-emerald-500",
              totalProfit < 0 && "text-red-500",
              totalProfit === 0 && "text-muted-foreground"
            )}>
              {totalProfit > 0 ? '+' : ''}{totalProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
          </div>
          <div className="flex gap-1">
            {(['week', 'month', 'year', 'all'] as TimePeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-2 py-1 text-xs rounded-md transition-colors',
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                {p === 'week' ? '7D' : p === 'month' ? '1M' : p === 'year' ? '1Y' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            No P&L data in this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(52, 211, 153)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="rgb(52, 211, 153)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(248, 113, 113)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="rgb(248, 113, 113)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-foreground/15" vertical={false} />
              <XAxis
                dataKey="date"
                className="text-xs fill-foreground"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                className="text-xs fill-foreground"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                  color: 'var(--popover-foreground)',
                }}
                labelStyle={{ color: 'var(--popover-foreground)' }}
                formatter={(value) => {
                  const numValue = Number(value) || 0;
                  return [
                    `${numValue >= 0 ? '+' : ''}${numValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
                    'Cumulative P&L'
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke={totalProfit >= 0 ? 'rgb(52, 211, 153)' : 'rgb(248, 113, 113)'}
                fillOpacity={1}
                fill={totalProfit >= 0 ? 'url(#profitGradient)' : 'url(#lossGradient)'}
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

interface DailyPnLProps {
  trades: Trade[];
  days?: number;
}

export function DailyPnLChart({ trades, days = 14 }: DailyPnLProps) {
  const data = (() => {
    const buckets: Record<string, { date: string; timestamp: number; pl: number; wins: number; losses: number }> = {};
    const sorted = [...trades]
      .filter((t) => t.profit_amount !== null && t.profit_amount !== undefined)
      .sort((a, b) => new Date(a.open_time).getTime() - new Date(b.open_time).getTime());

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = format(startOfDay(d), 'MMM d');
      buckets[key] = { date: key, timestamp: startOfDay(d).getTime(), pl: 0, wins: 0, losses: 0 };
    }

    sorted.forEach((t) => {
      const key = format(startOfDay(new Date(t.open_time)), 'MMM d');
      if (buckets[key]) {
        const p = t.profit_amount || 0;
        buckets[key].pl += p;
        if (p >= 0) buckets[key].wins += 1;
        else buckets[key].losses += 1;
      }
    });

    return Object.values(buckets);
  })();

  return (
    <Card className="bg-card border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 10, right: 6, left: 6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-foreground/15" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              cursor={{ fill: 'var(--muted)', fillOpacity: 0.4 }}
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--popover-foreground)',
                fontSize: 12,
              }}
              formatter={(value) => [
                `${Number(value) >= 0 ? '+' : ''}${Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
                'P&L',
              ]}
            />
            <Bar dataKey="pl" radius={[4, 4, 4, 4]} maxBarSize={28}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.pl >= 0 ? 'var(--chart-1)' : 'var(--chart-4)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface PerformanceRadarProps {
  data: { metric: string; value: number; fullMark: number }[];
}

export function PerformanceRadar({ data }: PerformanceRadarProps) {
  return (
    <Card className="bg-card border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Performance Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid stroke="var(--muted-foreground)" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              dataKey="value"
              stroke="var(--chart-2)"
              fill="var(--chart-2)"
              fillOpacity={0.35}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--popover-foreground)',
                fontSize: 12,
              }}
              formatter={(value) => [`${Number(value) || 0}/100`, 'Score']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface EquityCurveProps {
  trades: Trade[];
}

export function EquityCurveChart({ trades }: EquityCurveProps) {
  const data = (() => {
    const sorted = [...trades]
      .filter((t) => t.profit_amount !== null && t.profit_amount !== undefined)
      .sort((a, b) => new Date(a.open_time).getTime() - new Date(b.open_time).getTime());
    const points: { date: string; equity: number }[] = [];
    for (const t of sorted) {
      const prev = points.length ? points[points.length - 1].equity : 0;
      points.push({
        date: format(new Date(t.open_time), 'MMM d'),
        equity: prev + (t.profit_amount || 0),
      });
    }
    return points;
  })();

  const last = data.length ? data[data.length - 1].equity : 0;

  return (
    <Card className="bg-card border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Equity Curve</CardTitle>
          <span className={cn('text-sm font-semibold', last >= 0 ? 'text-emerald-600' : 'text-red-600')}>
            {last >= 0 ? '+' : ''}
            {last.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            No P&L data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 10, right: 6, left: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-foreground/15" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  color: 'var(--popover-foreground)',
                  fontSize: 12,
                }}
                formatter={(value) => [
                  `${Number(value) >= 0 ? '+' : ''}${Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
                  'Equity',
                ]}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke="var(--chart-2)"
                strokeWidth={2.5}
                fill="url(#equityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
