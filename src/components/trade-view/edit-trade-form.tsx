'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { updateTrade } from '@/app/actions';
import { invalidateTrades } from '@/lib/use-trades';
import type { Trade, SetupGrade, TradeDirection, TradeResult, TradeSession } from '@/types/trade';

const timeframes = ['1m', '5m', '15m', '1h', '4h', 'D', 'W', 'M'];

const sessions: { value: TradeSession; label: string }[] = [
  { value: 'new_york_am', label: 'New York AM' },
  { value: 'new_york_pm', label: 'New York PM' },
  { value: 'asia', label: 'Asia' },
  { value: 'london', label: 'London' },
];

const results: { value: TradeResult; label: string }[] = [
  { value: 'take_profit', label: 'Take Profit' },
  { value: 'stopped_out', label: 'Stopped Out' },
  { value: 'break_even', label: 'Break Even' },
];

const grades: { value: SetupGrade; label: string }[] = [
  { value: 'A+', label: 'A+' },
  { value: 'A', label: 'A' },
  { value: 'A-', label: 'A-' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
];

interface EditTradeFormProps {
  trade: Trade;
}

export function EditTradeForm({ trade }: EditTradeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [instrument, setInstrument] = useState(trade.instrument);
  const [timeframe, setTimeframe] = useState(trade.timeframe);
  const [direction, setDirection] = useState<TradeDirection>(trade.direction ?? 'long');
  const [result, setResult] = useState<TradeResult>(trade.result);
  const [grade, setGrade] = useState<SetupGrade>(trade.setup_grade ?? 'C');
  const [session, setSession] = useState<TradeSession | ''>(trade.session ?? '');
  const [riskReward, setRiskReward] = useState(
    trade.risk_reward !== null && trade.risk_reward !== undefined
      ? String(trade.risk_reward)
      : ''
  );
  const [profitAmount, setProfitAmount] = useState(
    trade.profit_amount ? String(Math.abs(trade.profit_amount)) : ''
  );
  const [openTime, setOpenTime] = useState(
    format(new Date(trade.open_time), "yyyy-MM-dd'T'HH:mm")
  );
  const [closeTime, setCloseTime] = useState(
    format(new Date(trade.close_time), "yyyy-MM-dd'T'HH:mm")
  );
  const [notes, setNotes] = useState(trade.notes ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!instrument || !timeframe) {
      toast.error('Please fill in all required fields');
      return;
    }

    let finalProfitAmount = 0;
    if (profitAmount) {
      const amount = Math.abs(parseFloat(profitAmount));
      if (result === 'take_profit') {
        finalProfitAmount = amount;
      } else if (result === 'stopped_out') {
        finalProfitAmount = -amount;
      } else {
        finalProfitAmount = 0;
      }
    }

    setIsSubmitting(true);
    try {
      const result2 = await updateTrade(trade.id, {
        instrument,
        timeframe,
        direction,
        result,
        session: session || null,
        setup_grade: grade,
        risk_reward: riskReward ? parseFloat(riskReward) : null,
        profit_amount: profitAmount ? finalProfitAmount : null,
        open_time: new Date(openTime).toISOString(),
        close_time: new Date(closeTime).toISOString(),
        notes: notes || null,
      });

      if (!result2.success) {
        toast.error(result2.error || 'Failed to update trade');
        return;
      }

      toast.success('Trade updated successfully!');
      invalidateTrades();
      router.push(`/dashboard/journal/${trade.id}`);
      router.refresh();
    } catch {
      toast.error('Failed to update trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Edit Trade</CardTitle>
          <CardDescription>Update the trade details below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="instrument">Instrument *</Label>
              <Input
                id="instrument"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe *</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger id="timeframe" className="w-full bg-background/50">
                  <SelectValue placeholder="Select TF" />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map((tf) => (
                    <SelectItem key={tf} value={tf}>
                      {tf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as TradeDirection)}>
                <SelectTrigger id="direction" className="w-full bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="result">Result *</Label>
              <Select value={result} onValueChange={(v) => setResult(v as TradeResult)}>
                <SelectTrigger id="result" className="w-full bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {results.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="grade">Setup Grade *</Label>
              <Select value={grade} onValueChange={(v) => setGrade(v as SetupGrade)}>
                <SelectTrigger id="grade" className="w-full bg-background/50">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session">Session</Label>
              <Select value={session || undefined} onValueChange={(v) => setSession(v as TradeSession)}>
                <SelectTrigger id="session" className="w-full bg-background/50">
                  <SelectValue placeholder="Select session (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="riskReward">Risk : Reward</Label>
              <Input
                id="riskReward"
                type="number"
                step="0.1"
                min="0"
                placeholder="2.0"
                value={riskReward}
                onChange={(e) => setRiskReward(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profitAmount" className="flex items-center gap-2">
                Profit/Loss Amount
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  result === 'take_profit'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : result === 'stopped_out'
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {result === 'take_profit' ? '+' : result === 'stopped_out' ? '-' : '±0'}
                </span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="profitAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={result === 'break_even' ? '0.00' : '100.00'}
                  value={result === 'break_even' ? '' : profitAmount}
                  onChange={(e) => setProfitAmount(e.target.value)}
                  disabled={result === 'break_even'}
                  className="bg-background/50 pl-7"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="openTime" className="flex items-center gap-1.5">
                Open Time
              </Label>
              <Input
                id="openTime"
                type="datetime-local"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closeTime" className="flex items-center gap-1.5">
                Close Time
              </Label>
              <Input
                id="closeTime"
                type="datetime-local"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Session narrative, liquidity observations, psychology notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background/50 min-h-25"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          type="submit"
          size="lg"
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push(`/dashboard/journal/${trade.id}`)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
