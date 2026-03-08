import { Orderbook } from '@/hooks/useMarketData';
import { BookOpen } from 'lucide-react';

function OrderbookSide({ book }: { book: Orderbook }) {
  const maxTotal = Math.max(...book.bids.map(b => b.total), ...book.asks.map(a => a.total));

  return (
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 px-1">{book.exchange}</div>
      <div className="space-y-px">
        {book.asks.slice().reverse().map((l, i) => (
          <div key={`a${i}`} className="relative flex justify-between px-1 py-0.5 data-cell">
            <div className="ask-bar absolute inset-0" style={{ width: `${(l.total / maxTotal) * 100}%`, right: 0, left: 'auto' }} />
            <span className="relative z-10 spread-negative">{l.price.toLocaleString()}</span>
            <span className="relative z-10 text-muted-foreground">{l.size.toFixed(4)}</span>
          </div>
        ))}
        <div className="border-y border-primary/30 py-1 px-1 my-0.5">
          <span className="glow-text font-semibold data-cell">
            {((book.bids[0]?.price + book.asks[0]?.price) / 2).toLocaleString()} Mid
          </span>
        </div>
        {book.bids.map((l, i) => (
          <div key={`b${i}`} className="relative flex justify-between px-1 py-0.5 data-cell">
            <div className="bid-bar absolute inset-0" style={{ width: `${(l.total / maxTotal) * 100}%` }} />
            <span className="relative z-10 spread-positive">{l.price.toLocaleString()}</span>
            <span className="relative z-10 text-muted-foreground">{l.size.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderbookDepth({ orderbooks }: { orderbooks: [Orderbook, Orderbook] }) {
  return (
    <div className="panel glow-border flex flex-col">
      <div className="panel-header">
        <span className="panel-title flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5" />
          Orderbook Depth
        </span>
        <span className="data-cell text-muted-foreground">BTC/USDT</span>
      </div>
      <div className="flex gap-2 p-2 overflow-hidden flex-1">
        <OrderbookSide book={orderbooks[0]} />
        <div className="w-px bg-border" />
        <OrderbookSide book={orderbooks[1]} />
      </div>
    </div>
  );
}
