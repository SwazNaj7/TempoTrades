'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Clock, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GradeBadge } from './grade-badge';
import { ResultBadge } from './result-badge';
import type { Trade } from '@/types/trade';
import { cn } from '@/lib/utils';
import { deleteTrade } from '@/app/actions';
import { toast } from 'sonner';

interface TradeCardProps {
  trade: Trade;
  href?: string;
}

export function TradeCard({ trade, href }: TradeCardProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isLong = trade.direction === 'long';

  // Format the time in user's local timezone
  const formatTradeTime = (timeString: string) => {
    try {
      // new Date() automatically converts ISO string to local timezone
      const date = new Date(timeString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch {
      return timeString;
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any default behavior
    e.stopPropagation(); // Prevent card click from navigating
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteTrade(trade.id);
      if (result.success) {
        toast.success('Trade deleted successfully');
        setShowDeleteDialog(false);
      } else {
        toast.error(result.error || 'Failed to delete trade');
      }
    } catch {
      toast.error('Failed to delete trade');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = () => {
    if (href && !showDeleteDialog) {
      router.push(href);
    }
  };

  return (
    <>
      <Card
        className={cn(
          'group cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 bg-card/50 backdrop-blur overflow-hidden relative',
          href && 'hover:scale-[1.02]'
        )}
        onClick={handleCardClick}
      >
        {/* Image Section */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          {trade.image_url && trade.image_url.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={trade.image_url}
              alt={`${trade.instrument} trade chart`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}

          {/* Direction indicator */}
          {trade.direction && (
            <div
              className={cn(
                'absolute top-2 right-2 p-1.5 rounded-md',
                isLong
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              )}
            >
              {isLong ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
        {/* Header with instrument, timeframe, grade and result */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">{trade.instrument}</span>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {trade.timeframe}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GradeBadge grade={trade.setup_grade} size="sm" />
            <ResultBadge result={trade.result} size="sm" />
          </div>
        </div>

        {/* Profit/Loss display */}
        {trade.profit_amount !== null && trade.profit_amount !== undefined && (
          <div className={cn(
            "text-lg font-semibold",
            trade.profit_amount > 0 && "text-emerald-500",
            trade.profit_amount < 0 && "text-red-500",
            trade.profit_amount === 0 && "text-muted-foreground"
          )}>
            {trade.profit_amount > 0 ? '+' : ''}{trade.profit_amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
        )}

        {/* Risk:Reward display */}
        {trade.risk_reward !== null && trade.risk_reward !== undefined && (
          <div className="text-sm text-muted-foreground">
            Risk:Reward <span className="font-medium text-foreground">{trade.risk_reward.toFixed(2)}R</span>
          </div>
        )}

        {/* Time info */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatTradeTime(trade.open_time)}</span>
        </div>

        {/* AI Reasoning preview */}
        {trade.ai_reasoning && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {trade.ai_reasoning}
          </p>
        )}

        {/* Notes preview */}
        {trade.notes && !trade.ai_reasoning && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {trade.notes}
          </p>
        )}

        {/* Delete button at bottom */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={handleDeleteClick}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Trade
        </Button>
      </CardContent>
    </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trade</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {trade.instrument} trade from {formatTradeTime(trade.open_time)}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Trade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
