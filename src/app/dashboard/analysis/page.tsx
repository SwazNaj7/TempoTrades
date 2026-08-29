import {
  GradeDistribution,
  ResultDistribution,
  SessionPerformance,
  TradesOverTimeChart,
  ProfitOverTimeChart,
} from '@/components/dashboard/charts';
import { DashboardStats } from '@/components/dashboard/stats-cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTrades } from '@/app/actions';
import type { SetupGrade, TradeResult } from '@/types/trade';

export default async function AnalysisPage() {
  const tradesResult = await getTrades();
  const trades = tradesResult.success ? tradesResult.data : [];

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

  // Calculate best instrument
  const instrumentStats: Record<string, { wins: number; total: number }> = {};
  trades.forEach((t) => {
    if (!instrumentStats[t.instrument]) {
      instrumentStats[t.instrument] = { wins: 0, total: 0 };
    }
    instrumentStats[t.instrument].total++;
    if (t.result === 'take_profit') {
      instrumentStats[t.instrument].wins++;
    }
  });
  const bestInstrument = Object.entries(instrumentStats).sort(
    (a, b) => (b[1].wins / b[1].total || 0) - (a[1].wins / a[1].total || 0)
  )[0];

  // Calculate best timeframe
  const timeframeStats: Record<string, { wins: number; total: number }> = {};
  trades.forEach((t) => {
    if (!timeframeStats[t.timeframe]) {
      timeframeStats[t.timeframe] = { wins: 0, total: 0 };
    }
    timeframeStats[t.timeframe].total++;
    if (t.result === 'take_profit') {
      timeframeStats[t.timeframe].wins++;
    }
  });
  const bestTimeframe = Object.entries(timeframeStats).sort(
    (a, b) => (b[1].wins / b[1].total || 0) - (a[1].wins / a[1].total || 0)
  )[0];

  // Calculate A+ win rate
  const aPlusTrades = trades.filter((t) => t.setup_grade === 'A+');
  const aPlusWins = aPlusTrades.filter((t) => t.result === 'take_profit').length;
  const aPlusWinRate = aPlusTrades.length > 0 ? Math.round((aPlusWins / aPlusTrades.length) * 100) : 0;

  // Calculate B grade win rate
  const bTrades = trades.filter((t) => t.setup_grade === 'B');
  const bWins = bTrades.filter((t) => t.result === 'take_profit').length;
  const bWinRate = bTrades.length > 0 ? Math.round((bWins / bTrades.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Deep dive into your trading performance
        </p>
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

      {/* Time-based Area Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <TradesOverTimeChart trades={trades} />
        <ProfitOverTimeChart trades={trades} />
      </div>

      {/* Main Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <GradeDistribution distribution={gradeDistribution} />
        <ResultDistribution distribution={resultDistribution} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SessionPerformance sessions={sessionPerformance} />

        {/* Additional Insights Card */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Key Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalTrades === 0 ? (
              <p className="text-sm text-muted-foreground">
                Log some trades to see insights here.
              </p>
            ) : (
              <>
                {aPlusTrades.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="text-sm font-medium">A+ Setup Performance</p>
                      <p className="text-xs text-muted-foreground">
                        {aPlusWinRate}% win rate on A+ setups
                      </p>
                    </div>
                  </div>
                )}

                {bTrades.length > 0 && bWinRate < 50 && (
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium">B-Grade Trades Underperforming</p>
                      <p className="text-xs text-muted-foreground">
                        Only {bWinRate}% win rate — consider A-grade only
                      </p>
                    </div>
                  </div>
                )}

                {bestInstrument && (
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                    <div>
                      <p className="text-sm font-medium">Best Instrument: {bestInstrument[0]}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((bestInstrument[1].wins / bestInstrument[1].total) * 100)}% win rate
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {totalTrades === 0 ? (
            <p className="text-muted-foreground">
              No trades yet. Start logging trades to see your performance summary.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Best Instrument</p>
                <p className="text-2xl font-bold">
                  {bestInstrument ? bestInstrument[0] : 'N/A'}
                </p>
                <p className="text-xs text-emerald-500">
                  {bestInstrument
                    ? `${Math.round((bestInstrument[1].wins / bestInstrument[1].total) * 100)}% win rate`
                    : '—'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Best Timeframe</p>
                <p className="text-2xl font-bold">
                  {bestTimeframe ? bestTimeframe[0] : 'N/A'}
                </p>
                <p className="text-xs text-emerald-500">
                  {bestTimeframe
                    ? `${Math.round((bestTimeframe[1].wins / bestTimeframe[1].total) * 100)}% win rate`
                    : '—'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{totalTrades}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{thisWeekTrades} trades</p>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
