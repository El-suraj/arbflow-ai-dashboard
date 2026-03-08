import { Signal } from '@/hooks/useMarketData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity } from 'lucide-react';

export function SignalTerminal({ signals }: { signals: Signal[] }) {
  return (
    <div className="panel glow-border h-full flex flex-col">
      <div className="panel-header">
        <span className="panel-title flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" />
          Signal Feed
        </span>
        <span className="status-live">LIVE</span>
      </div>
      <ScrollArea className="flex-1">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="data-cell text-left p-2 text-muted-foreground">Pair</th>
              <th className="data-cell text-left p-2 text-muted-foreground">Route</th>
              <th className="data-cell text-right p-2 text-muted-foreground">Spread</th>
              <th className="data-cell text-right p-2 text-muted-foreground">Net P/L</th>
            </tr>
          </thead>
          <tbody>
            {signals.slice(0, 30).map((s) => (
              <tr key={s.id} className="border-b border-border/50 ticker-flash hover:bg-secondary/30 transition-colors">
                <td className="data-cell p-2 font-semibold glow-text">{s.pair}</td>
                <td className="data-cell p-2 text-muted-foreground">
                  <span className="text-foreground">{s.exchangeA}</span>
                  <span className="text-primary mx-1">→</span>
                  <span className="text-foreground">{s.exchangeB}</span>
                </td>
                <td className={`data-cell p-2 text-right ${s.spread > 0.4 ? 'spread-positive' : 'text-muted-foreground'}`}>
                  {s.spread.toFixed(3)}%
                </td>
                <td className={`data-cell p-2 text-right font-semibold ${s.netProfit > 0 ? 'spread-positive' : 'spread-negative'}`}>
                  {s.netProfit > 0 ? '+' : ''}{s.netProfit.toFixed(3)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}
