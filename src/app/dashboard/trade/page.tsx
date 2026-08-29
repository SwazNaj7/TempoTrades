import { WsTradeForm } from '@/components/trade-view/trade-form-ws';

export default function TradePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Trade</h1>
        <p className="text-muted-foreground mt-1">
          Live Deriv pairs, grouped into Standard and Synthetic markets
        </p>
      </div>

      <WsTradeForm />
    </div>
  );
}
