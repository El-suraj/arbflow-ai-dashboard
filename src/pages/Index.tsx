import { useState, useEffect, useRef, useCallback } from 'react';
import { useMarketData, Signal } from '@/hooks/useMarketData';
import { useBybitData } from '@/hooks/useBybitData';
import { useAlerts } from '@/hooks/useAlerts';
import { useTradeExecution } from '@/hooks/useTradeExecution';
import { StatusBar } from '@/components/dashboard/StatusBar';
import { SignalTerminal } from '@/components/dashboard/SignalTerminal';
import { PriceChart } from '@/components/dashboard/PriceChart';
import { BotController } from '@/components/dashboard/BotController';
import { OrderbookDepth } from '@/components/dashboard/OrderbookDepth';
import { WalletPanel } from '@/components/dashboard/WalletPanel';
import { PerformanceAnalytics } from '@/components/dashboard/PerformanceAnalytics';
import { ExecutionLog } from '@/components/dashboard/ExecutionLog';
import { BacktestPanel } from '@/components/dashboard/BacktestPanel';
import { RiskManagement } from '@/components/dashboard/RiskManagement';
import { ChevronDown, ChevronUp, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

function CollapsiblePanel({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="lg:contents">
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden flex items-center justify-between w-full px-3 py-2 panel glow-border text-xs font-mono uppercase tracking-widest text-primary"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      <div className={`${open ? 'block' : 'hidden'} lg:block lg:contents`}>
        {children}
      </div>
    </div>
  );
}

const Index = () => {
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [showBacktest, setShowBacktest] = useState(false);
  const { signals, orderbooks, priceHistory, pnlData, wsStatus, latency } = useMarketData({ selectedPair });
  const { alertsEnabled, setAlertsEnabled, soundEnabled, setSoundEnabled, triggerAlert, requestNotificationPermission } = useAlerts();
  const { executions, totalSimPnl, executeSignal } = useTradeExecution();
  const [minSpread, setMinSpread] = useState('0.15');
  const [maxCapital, setMaxCapital] = useState(5000);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const minSpreadRef = useRef(parseFloat(minSpread) || 0.15);

  useEffect(() => {
    minSpreadRef.current = parseFloat(minSpread) || 0.15;
  }, [minSpread]);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  useEffect(() => {
    if (signals.length === 0) return;
    const latest = signals[0];
    if (latest.spread >= minSpreadRef.current && latest.netProfit > 0) {
      triggerAlert(latest.pair, latest.spread, latest.netProfit);
    }
  }, [signals, triggerAlert]);

  const handleExecute = useCallback((signal: Signal) => {
    executeSignal(signal, maxCapital);
  }, [executeSignal, maxCapital]);

  if (showBacktest) {
    return <BacktestPanel onClose={() => setShowBacktest(false)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <StatusBar wsStatus={wsStatus} latency={latency} onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowBacktest(true)}
          className="h-6 text-[10px] font-mono gap-1 text-muted-foreground hover:text-primary"
        >
          <History className="w-3 h-3" /> Backtest
        </Button>
      </StatusBar>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/95 overflow-y-auto pt-12 p-3 space-y-2">
          <button onClick={() => setMobileMenuOpen(false)} className="absolute top-3 right-3 text-muted-foreground text-xs font-mono">✕ Close</button>
          <BotController
            minSpread={minSpread} onMinSpreadChange={setMinSpread}
            alertsEnabled={alertsEnabled} onAlertsEnabledChange={setAlertsEnabled}
            soundEnabled={soundEnabled} onSoundEnabledChange={setSoundEnabled}
          />
          <RiskManagement
            maxCapital={maxCapital}
            onMaxCapitalChange={setMaxCapital}
            totalPnl={totalSimPnl}
          />
          <WalletPanel />
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
        <div className="lg:h-full lg:grid lg:grid-cols-[320px_1fr_320px] gap-1.5 p-1.5 space-y-1.5 lg:space-y-0">

          {/* Left: Signals + Execution Log */}
          <div className="flex flex-col gap-1.5 min-h-[300px] lg:min-h-0 lg:h-full">
            <CollapsiblePanel title="Signal Feed" defaultOpen={true}>
              <div className="flex-[2] min-h-0">
                <SignalTerminal signals={signals} onExecute={handleExecute} executions={executions} />
              </div>
            </CollapsiblePanel>
            <CollapsiblePanel title="Execution Log" defaultOpen={true}>
              <ExecutionLog executions={executions} totalPnl={totalSimPnl} />
            </CollapsiblePanel>
          </div>

          {/* Center: Chart + Orderbook + Performance */}
          <div className="flex flex-col gap-1.5 min-h-0">
            <div className="min-h-[250px] lg:flex-[2] lg:min-h-0">
              <PriceChart data={priceHistory} selectedPair={selectedPair} onPairChange={setSelectedPair} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 min-h-0">
              <CollapsiblePanel title="Orderbook Depth">
                <div className="min-h-[280px] lg:min-h-0">
                  <OrderbookDepth orderbooks={orderbooks} selectedPair={selectedPair} />
                </div>
              </CollapsiblePanel>
              <CollapsiblePanel title="Performance">
                <div className="min-h-[280px] lg:min-h-0">
                  <PerformanceAnalytics data={pnlData} />
                </div>
              </CollapsiblePanel>
            </div>
          </div>

          {/* Right: Bot + Risk + Wallet */}
          <div className="hidden lg:flex flex-col gap-1.5 min-h-0 overflow-y-auto">
            <BotController
              minSpread={minSpread} onMinSpreadChange={setMinSpread}
              alertsEnabled={alertsEnabled} onAlertsEnabledChange={setAlertsEnabled}
              soundEnabled={soundEnabled} onSoundEnabledChange={setSoundEnabled}
            />
            <RiskManagement
              maxCapital={maxCapital}
              onMaxCapitalChange={setMaxCapital}
              totalPnl={totalSimPnl}
            />
            <WalletPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
