'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { JournalTable } from '@/components/dashboard/journal-table';
import { useTrades } from '@/lib/use-trades';

export default function JournalPage() {
  const { trades, loading } = useTrades();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trade Journal</h1>
          <p className="text-sm text-muted-foreground">
            Review and analyze your trading history ({trades.length} trades)
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/trade">
            <Plus className="mr-2 h-4 w-4" />
            Add New Trade
          </Link>
        </Button>
      </div>

      {loading && trades.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <JournalTable trades={trades} />
      )}
    </div>
  );
}
