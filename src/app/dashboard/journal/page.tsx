import Link from 'next/link';
import { Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTrades } from '@/app/actions';
import { TradeCard } from '@/components/trade-view/trade-card';
import { TradeFilters } from '@/components/trade-view/trade-filters';

interface Props {
  searchParams: Promise<{
    result?: string;
    grade?: string;
    instrument?: string;
    session?: string;
  }>;
}

export default async function JournalPage({ searchParams }: Props) {
  const params = await searchParams;
  const result = await getTrades();
  const allTrades = result.success ? result.data : [];

  // Apply filters
  let trades = allTrades;

  if (params.result) {
    trades = trades.filter((t) => t.result === params.result);
  }

  if (params.grade) {
    trades = trades.filter((t) => t.setup_grade === params.grade);
  }

  if (params.instrument) {
    trades = trades.filter((t) =>
      t.instrument.toLowerCase().includes(params.instrument!.toLowerCase())
    );
  }

  if (params.session) {
    trades = trades.filter((t) => t.session === params.session);
  }

  // Get unique instruments for filter
  const instruments = [...new Set(allTrades.map((t) => t.instrument))];

  const hasFilters = params.result || params.grade || params.instrument || params.session;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Trade Journal</h1>
          <p className="text-muted-foreground">
            Review and analyze your trading history ({trades.length} trades)
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/trade">
            <Plus className="h-4 w-4 mr-2" />
            New Trade
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <TradeFilters instruments={instruments} />

      {/* Trades Grid */}
      {trades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            {hasFilters ? (
              <Filter className="h-8 w-8 text-muted-foreground" />
            ) : (
              <Plus className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {hasFilters
              ? 'No trades match your filters'
              : 'No trades yet'}
          </h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            {hasFilters
              ? 'Try adjusting your filters to see more trades.'
              : 'Start building your trade journal by logging your first trade.'}
          </p>
          {hasFilters ? (
            <Button variant="outline" asChild>
              <Link href="/dashboard/journal">Clear Filters</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/dashboard/trade">Log Your First Trade</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} href={`/dashboard/journal/${trade.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
