'use client';

import dynamic from 'next/dynamic';
import type { Trade } from '@/types/trade';

const ChartSkeleton = ({ height = 220 }: { height?: number }) => (
  <div
    className="flex items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-sm text-muted-foreground"
    style={{ height }}
  >
    Loading chart…
  </div>
);

const EquityCurveChart = dynamic(
  () => import('@/components/dashboard/charts').then((m) => m.EquityCurveChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const DailyPnLChart = dynamic(
  () => import('@/components/dashboard/charts').then((m) => m.DailyPnLChart),
  { ssr: false, loading: () => <ChartSkeleton height={260} /> }
);
const PerformanceRadar = dynamic(
  () => import('@/components/dashboard/charts').then((m) => m.PerformanceRadar),
  { ssr: false, loading: () => <ChartSkeleton height={260} /> }
);

export function AnalyticsCharts({
  trades,
  radar,
}: {
  trades: Trade[];
  radar: { metric: string; value: number; fullMark: number }[];
}) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EquityCurveChart trades={trades} />
        </div>
        <PerformanceRadar data={radar} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <DailyPnLChart trades={trades} days={30} />
        </div>
      </div>
    </>
  );
}
