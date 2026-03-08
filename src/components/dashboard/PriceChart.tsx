import { PricePoint } from '@/hooks/useMarketData';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceDot } from 'recharts';
import { TrendingUp } from 'lucide-react';

export function PriceChart({ data }: { data: PricePoint[] }) {
  const buySignals = data.filter(d => d.buySignal);
  const sellSignals = data.filter(d => d.sellSignal);
  const latest = data[data.length - 1];

  return (
    <div className="panel glow-border h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-3">
          <span className="panel-title flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" />
            BTC/USDT
          </span>
          {latest && (
            <span className="font-mono text-lg font-bold glow-text">
              ${latest.price.toLocaleString()}
            </span>
          )}
        </div>
        <span className="status-live">STREAMING</span>
      </div>
      <div className="flex-1 p-2 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(180,100%,50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(180,100%,50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(215,15%,50%)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'hsl(215,15%,50%)' }} tickLine={false} axisLine={false} width={60} tickFormatter={(v) => `$${v.toLocaleString()}`} />
            <Area type="monotone" dataKey="price" stroke="hsl(180,100%,50%)" strokeWidth={2} fill="url(#priceGrad)" animationDuration={300} />
            {buySignals.map((s, i) => (
              <ReferenceDot key={`b${i}`} x={s.time} y={s.price} r={5} fill="hsl(142,71%,45%)" stroke="none" />
            ))}
            {sellSignals.map((s, i) => (
              <ReferenceDot key={`s${i}`} x={s.time} y={s.price} r={5} fill="hsl(0,72%,51%)" stroke="none" />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="px-3 py-1.5 border-t border-border flex gap-4 text-xs font-mono text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-signal" /> Buy Signal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-signal" /> Sell Signal
        </span>
      </div>
    </div>
  );
}
