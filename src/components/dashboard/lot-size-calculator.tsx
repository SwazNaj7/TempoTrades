'use client';

import { useState } from 'react';
import { Calculator, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

function num(v: string, fallback = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

const CONTRACT_SIZE = 100000;

export function LotSizeCalculator() {
  const [balance, setBalance] = useState('10000');
  const [riskPct, setRiskPct] = useState('1');
  const [stopPips, setStopPips] = useState('20');

  const riskAmount = num(balance) * (num(riskPct) / 100);
  const stop = num(stopPips);
  const lotSize = stop > 0 ? riskAmount / stop : 0;
  const units = lotSize * CONTRACT_SIZE;
  const riskPerPip = stop > 0 ? riskAmount / stop : 0;

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { maximumFractionDigits: n >= 100 ? 0 : 4 });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calculator className="h-4 w-4 text-primary" />
            Position Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="balance">Account Balance ($)</Label>
            <Input id="balance" value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="decimal" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="risk">Risk per Trade (%)</Label>
            <Input id="risk" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} inputMode="decimal" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stop">Stop Loss (pips)</Label>
            <Input id="stop" value={stopPips} onChange={(e) => setStopPips(e.target.value)} inputMode="decimal" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recommended Position</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-primary/5 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Lot Size</p>
              <p className="text-3xl font-normal">{fmt(lotSize)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Units</p>
              <p className="text-lg font-semibold">{fmt(units)}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Risk Amount</p>
              <p className="font-semibold text-red-600">${fmt(riskAmount)}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Risk / Pip</p>
              <p className="font-semibold">${fmt(riskPerPip)}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Lot size = risk amount ÷ stop loss in pips (assuming a standard 100,000-unit contract).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
