import { LotSizeCalculator } from '@/components/dashboard/lot-size-calculator';

export default function CalculatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lot Size Calculator</h1>
        <p className="text-sm text-muted-foreground">Size your positions with a fixed risk percentage</p>
      </div>
      <LotSizeCalculator />
    </div>
  );
}
