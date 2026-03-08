import { PnLPoint } from '@/hooks/useMarketData';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { BarChart3 } from 'lucide-react';

export function PerformanceAnalytics({ data }: { data: PnLPoint[] }) {
  const totalPnl = data[data.length - 1]?.cumulative ?? 0;
  const totalTrades = data.reduce((s, d) => s + d.trades, 0);

  return (
    <div className="panel glow-border flex flex-col">
      <div className="panel-header">
        <span className="panel-title flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5" />
          Performance
        </span>
        <div className="flex gap-3 data-cell">
          <span className={totalPnl >= 0 ? 'spread-positive' : 'spread-negative'}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()}
          </span>
          <span className="text-muted-foreground">{totalTrades} trades</span>
        </div>
      </div>
      <div className="flex-1 p-2 space-y-1 min-h-0">
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-1">Cumulative P&L</div>
        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142,71%,45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142,71%,45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(215,15%,50%)' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(215,15%,50%)' }} tickLine={false} axisLine={false} width={45} tickFormatter={v => `$${v}`} />
              <Area type="monotone" dataKey="cumulative" stroke="hsl(142,71%,45%)" strokeWidth={1.5} fill="url(#pnlGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-1 pt-1">Daily P&L Heatmap</div>
        <div className="h-[80px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(215,15%,50%)' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(215,15%,50%)' }} tickLine={false} axisLine={false} width={45} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: 'hsl(215,25%,12%)', border: '1px solid hsl(215,20%,20%)', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                labelStyle={{ color: 'hsl(180,100%,50%)' }}
              />
              <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? 'hsl(142,71%,45%)' : 'hsl(0,72%,51%)'} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
