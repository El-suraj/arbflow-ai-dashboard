import { Signal, TradeExecution } from '@/hooks/useMarketData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Crosshair } from 'lucide-react';

interface SignalTerminalProps {
  signals: Signal[];
  onExecute?: (signal: Signal) => void;
  executions?: TradeExecution[];
}

export function SignalTerminal({ signals, onExecute, executions = [] }: SignalTerminalProps) {
  const executingIds = new Set(executions.map(e => e.signal.id));

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
              <th className="data-cell text-center p-2 text-muted-foreground w-10"></th>
            </tr>
          </thead>
          <tbody>
            {signals.slice(0, 30).map((s) => {
              const isProfitable = s.netProfit > 0;
              const isExecuted = executingIds.has(s.id);
              return (
                <tr key={s.id} className="border-b border-border/50 ticker-flash hover:bg-secondary/30 transition-colors group">
                  <td className="data-cell p-2 font-semibold glow-text">{s.pair}</td>
                  <td className="data-cell p-2 text-muted-foreground">
                    <span className="text-foreground">{s.exchangeA}</span>
                    <span className="text-primary mx-1">→</span>
                    <span className="text-foreground">{s.exchangeB}</span>
                  </td>
                  <td className={`data-cell p-2 text-right ${s.spread > 0.4 ? 'spread-positive' : 'text-muted-foreground'}`}>
                    {s.spread.toFixed(3)}%
                  </td>
                  <td className={`data-cell p-2 text-right font-semibold ${isProfitable ? 'spread-positive' : 'spread-negative'}`}>
                    {isProfitable ? '+' : ''}{s.netProfit.toFixed(3)}%
                  </td>
                  <td className="p-1 text-center">
                    {isProfitable && !isExecuted && onExecute ? (
                      <button
                        onClick={() => onExecute(s)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-primary/20 text-primary"
                        title="Execute trade"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                      </button>
                    ) : isExecuted ? (
                      <span className="text-[9px] font-mono text-green-signal">EXEC</span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}
