import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GradeBadge } from '@/components/trade-view/grade-badge';
import { ResultBadge } from '@/components/trade-view/result-badge';
import { getTradeById } from '@/app/actions';
import { DeleteTradeButton } from './delete-button';

interface TradeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TradeDetailPage({ params }: TradeDetailPageProps) {
  const { id } = await params;
  const result = await getTradeById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const trade = result.data;
  const isLong = trade.direction === 'long';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/journal">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Journal
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-bold">{trade.instrument}</h1>
          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
            {trade.timeframe}
          </span>
          {trade.direction && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                isLong
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {isLong ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {isLong ? 'Long' : 'Short'}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GradeBadge grade={trade.setup_grade} />
          <ResultBadge result={trade.result} />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/journal/${trade.id}/edit`}>
              Edit Trade
            </Link>
          </Button>
        </div>
      </div>

      {/* Chart Image */}
      {trade.image_url && trade.image_url.length > 0 && (
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={trade.image_url}
              alt={`${trade.instrument} trade chart`}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
        </Card>
      )}

      {/* Trade Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trade Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trade Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Open Time</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {format(new Date(trade.open_time), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Close Time</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {format(new Date(trade.close_time), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Setup Grade</span>
              <GradeBadge grade={trade.setup_grade} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Confidence</span>
              <span
                className={`capitalize ${
                  trade.ai_confidence === 'high'
                    ? 'text-emerald-400'
                    : trade.ai_confidence === 'medium'
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}
              >
                {trade.ai_confidence || 'N/A'}
              </span>
            </div>
            {trade.ai_reasoning && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground text-sm">Reasoning</span>
                  <p className="mt-1 text-sm">{trade.ai_reasoning}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {trade.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {trade.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteTradeButton tradeId={trade.id} />
        </CardContent>
      </Card>
    </div>
  );
}
