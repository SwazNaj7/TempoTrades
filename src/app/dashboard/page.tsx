import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/components/dashboard/stats-cards';
import {
  GradeDistribution,
  ResultDistribution,
  SessionPerformance,
} from '@/components/dashboard/charts';
import { TradeCard } from '@/components/trade-view/trade-card';
import { getTrades } from '@/app/actions';
import type { SetupGrade, TradeResult } from '@/types/trade';

export default async function DashboardPage() {
  const tradesResult = await getTrades();
  const trades = tradesResult.success ? tradesResult.data : [];
  const recentTrades = trades.slice(0, 6);

  // Calculate stats from real data
  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.result === 'take_profit').length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

  // Calculate average grade
  const gradeValues: Record<SetupGrade, number> = {
    'A+': 5,
    'A': 4,
    'A-': 3,
    'B': 2,
    'C': 1,
  };
  const gradedTrades = trades.filter((t) => t.setup_grade);
  const avgGradeValue =
    gradedTrades.length > 0
      ? gradedTrades.reduce(
          (acc, t) => acc + (gradeValues[t.setup_grade as SetupGrade] || 0),
          0
        ) / gradedTrades.length
      : 0;
  const averageGrade =
    avgGradeValue >= 4.5
      ? 'A+'
      : avgGradeValue >= 3.5
      ? 'A'
      : avgGradeValue >= 2.5
      ? 'A-'
      : avgGradeValue >= 1.5
      ? 'B'
      : 'C';

  // Count trades this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekTrades = trades.filter(
    (t) => new Date(t.created_at) >= oneWeekAgo
  ).length;

  // Average risk:reward (only trades that have a value set)
  const rrTrades = trades.filter(
    (t) => t.risk_reward !== null && t.risk_reward !== undefined
  );
  const averageRiskReward =
    rrTrades.length > 0
      ? rrTrades.reduce((acc, t) => acc + (t.risk_reward as number), 0) / rrTrades.length
      : 0;

  // Average profit (signed profit_amount across all trades)
  const averageProfit =
    trades.length > 0
      ? trades.reduce((acc, t) => acc + (t.profit_amount ?? 0), 0) / trades.length
      : 0;

  // Calculate grade distribution
  const gradeDistribution: Record<SetupGrade, number> = {
    'A+': 0,
    'A': 0,
    'A-': 0,
    'B': 0,
    'C': 0,
  };
  trades.forEach((t) => {
    if (t.setup_grade && t.setup_grade in gradeDistribution) {
      gradeDistribution[t.setup_grade as SetupGrade]++;
    }
  });

  // Calculate result distribution
  const resultDistribution: Record<TradeResult, number> = {
    take_profit: 0,
    stopped_out: 0,
    break_even: 0,
  };
  trades.forEach((t) => {
    if (t.result in resultDistribution) {
      resultDistribution[t.result]++;
    }
  });

  // Session performance - calculated from actual trade data
  const sessionPerformance = {
    new_york_am: { wins: 0, total: 0 },
    new_york_pm: { wins: 0, total: 0 },
    asia: { wins: 0, total: 0 },
    london: { wins: 0, total: 0 },
  };
  trades.forEach((t) => {
    if (t.session && t.session in sessionPerformance) {
      sessionPerformance[t.session].total++;
      if (t.result === 'take_profit') {
        sessionPerformance[t.session].wins++;
      }
    }
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your mechanical trading journey
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/trade">
            <Plus className="mr-2 h-4 w-4" />
            New Trade
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <DashboardStats
        totalTrades={totalTrades}
        winRate={winRate}
        averageGrade={averageGrade}
        thisWeekTrades={thisWeekTrades}
        averageRiskReward={averageRiskReward}
        averageProfit={averageProfit}
      />

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <GradeDistribution distribution={gradeDistribution} />
        <ResultDistribution distribution={resultDistribution} />
        <SessionPerformance sessions={sessionPerformance} />
      </div>

      {/* Recent Trades */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Trades</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/journal">View all</Link>
          </Button>
        </div>

        {recentTrades.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No trades yet. Start logging your trades to see them here!</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/trade">Log Your First Trade</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentTrades.map((trade) => (
              <Link key={trade.id} href={`/dashboard/journal/${trade.id}`}>
                <TradeCard trade={trade} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
