import { useMarketData } from '@/hooks/useMarketData';
import { StatusBar } from '@/components/dashboard/StatusBar';
import { SignalTerminal } from '@/components/dashboard/SignalTerminal';
import { PriceChart } from '@/components/dashboard/PriceChart';
import { BotController } from '@/components/dashboard/BotController';
import { OrderbookDepth } from '@/components/dashboard/OrderbookDepth';
import { WalletPanel } from '@/components/dashboard/WalletPanel';
import { PerformanceAnalytics } from '@/components/dashboard/PerformanceAnalytics';

const Index = () => {
  const { signals, orderbooks, priceHistory, pnlData } = useMarketData();

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <StatusBar />
      <div className="flex-1 grid grid-cols-[320px_1fr_320px] gap-1.5 p-1.5 min-h-0">
        {/* Left Column: Signal Feed */}
        <div className="min-h-0">
          <SignalTerminal signals={signals} />
        </div>

        {/* Center Column: Chart + Orderbook + Performance */}
        <div className="flex flex-col gap-1.5 min-h-0">
          <div className="flex-[2] min-h-0">
            <PriceChart data={priceHistory} />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-1.5 min-h-0">
            <OrderbookDepth orderbooks={orderbooks} />
            <PerformanceAnalytics data={pnlData} />
          </div>
        </div>

        {/* Right Column: Bot + Wallet */}
        <div className="flex flex-col gap-1.5 min-h-0">
          <BotController />
          <WalletPanel />
        </div>
      </div>
    </div>
  );
};

export default Index;
