'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { TradeCalendar } from '@/components/dashboard/trade-calendar';
import { useTrades } from '@/lib/use-trades';

export default function CalendarPage() {
  const { trades, loading } = useTrades();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trade Calendar</h1>
        <p className="text-sm text-muted-foreground">See your daily P&L at a glance across the month</p>
      </div>

      {loading && trades.length === 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[420px] rounded-2xl lg:col-span-2" />
          <Skeleton className="h-[420px] rounded-2xl" />
        </div>
      ) : (
        <TradeCalendar trades={trades} />
      )}
    </div>
  );
}
