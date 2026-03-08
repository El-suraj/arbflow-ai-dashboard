import { useState, useCallback } from 'react';
import { Signal, TradeExecution } from '@/hooks/useMarketData';
import { toast } from 'sonner';

export function useTradeExecution() {
  const [executions, setExecutions] = useState<TradeExecution[]>([]);
  const [totalSimPnl, setTotalSimPnl] = useState(0);

  const executeSignal = useCallback((signal: Signal, maxCapital: number) => {
    if (signal.netProfit <= 0) {
      toast.error('Cannot execute: negative expected profit', { duration: 2000 });
      return;
    }

    const execId = Math.random().toString(36).substr(2, 9);
    const slippage = +(Math.random() * 0.05).toFixed(4); // 0-0.05% slippage
    const capitalUsed = Math.min(maxCapital, signal.volume * 0.1);
    const actualProfit = +((signal.netProfit - slippage) / 100 * capitalUsed).toFixed(2);

    const execution: TradeExecution = {
      id: execId,
      signal,
      status: 'pending',
      fillPrice: signal.direction === 'buy-a-sell-b' ? signal.priceA : signal.priceB,
      slippage,
      profit: actualProfit,
      timestamp: Date.now(),
      capitalUsed,
    };

    setExecutions(prev => [execution, ...prev].slice(0, 100));

    // Simulate fill stages
    setTimeout(() => {
      setExecutions(prev => prev.map(e => e.id === execId ? { ...e, status: 'filling' } : e));
      toast.info(`⏳ Filling: Buy ${signal.pair} on ${signal.exchangeA}...`, { duration: 1500 });
    }, 300);

    setTimeout(() => {
      const failed = Math.random() < 0.05; // 5% failure rate
      if (failed) {
        setExecutions(prev => prev.map(e => e.id === execId ? { ...e, status: 'failed', profit: 0 } : e));
        toast.error(`❌ Fill failed: ${signal.pair} — price moved`, { duration: 3000 });
      } else {
        setExecutions(prev => prev.map(e => e.id === execId ? { ...e, status: 'filled' } : e));
        setTotalSimPnl(prev => +(prev + actualProfit).toFixed(2));
        toast.success(
          `✅ Filled: ${signal.pair} | +$${actualProfit.toFixed(2)}`,
          { description: `${signal.exchangeA} → ${signal.exchangeB} | Slippage: ${slippage.toFixed(3)}%`, duration: 4000 }
        );
      }
    }, 1200 + Math.random() * 800);
  }, []);

  return { executions, totalSimPnl, executeSignal };
}
