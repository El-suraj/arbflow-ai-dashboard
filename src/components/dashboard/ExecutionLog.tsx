import { TradeExecution } from '@/hooks/useMarketData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListOrdered } from 'lucide-react';

interface ExecutionLogProps {
  executions: TradeExecution[];
  totalPnl: number;
}

export function ExecutionLog({ executions, totalPnl }: ExecutionLogProps) {
  return (
    <div className="panel glow-border flex flex-col">
      <div className="panel-header">
        <span className="panel-title flex items-center gap-2">
          <ListOrdered className="w-3.5 h-3.5" />
          Execution Log
        </span>
        <span className={`data-cell font-semibold ${totalPnl >= 0 ? 'spread-positive' : 'spread-negative'}`}>
          Sim P&L: {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
        </span>
      </div>
      <ScrollArea className="flex-1 max-h-[180px]">
        {executions.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground font-mono text-center">
            Click <span className="text-primary">⊕</span> on profitable signals to simulate trades
          </div>
        ) : (
          <div className="space-y-px">
            {executions.slice(0, 20).map(e => (
              <div key={e.id} className={`flex items-center justify-between px-3 py-1.5 text-xs font-mono border-b border-border/30 ${
                e.status === 'filled' ? 'bg-green-signal/5' : e.status === 'failed' ? 'bg-red-signal/5' : 'bg-amber-signal/5'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    e.status === 'filled' ? 'bg-green-signal' :
                    e.status === 'failed' ? 'bg-red-signal' :
                    'bg-amber-signal animate-pulse'
                  }`} />
                  <span className="glow-text">{e.signal.pair}</span>
                  <span className="text-muted-foreground">
                    {e.signal.exchangeA}→{e.signal.exchangeB}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">${e.capitalUsed.toFixed(0)}</span>
                  {e.status === 'filled' ? (
                    <span className="spread-positive font-semibold">+${e.profit.toFixed(2)}</span>
                  ) : e.status === 'failed' ? (
                    <span className="spread-negative">FAILED</span>
                  ) : (
                    <span className="text-amber-signal">{e.status.toUpperCase()}...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
