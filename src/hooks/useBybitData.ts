import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Orderbook, OrderbookLevel, PricePoint, Signal, WsStatus } from './useMarketData';

const BYBIT_WS = 'wss://stream.bybit.com/v5/public/spot';

function pairToBybitSymbol(pair: string): string {
  return pair.replace('/', '');
}

interface BybitTicker {
  lastPrice: string;
  bid1Price: string;
  ask1Price: string;
  volume24h: string;
}

export function useBybitData({ selectedPair }: { selectedPair: string }) {
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');
  const [latency, setLatency] = useState(0);
  const [lastPrice, setLastPrice] = useState(0);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [orderbooks, setOrderbooks] = useState<[Orderbook, Orderbook]>([
    { exchange: 'Bybit Spot', bids: [], asks: [] },
    { exchange: 'Bybit Spot', bids: [], asks: [] },
  ]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [balances, setBalances] = useState<{ coin: string; free: string; locked: string }[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const priceRef = useRef(0);
  const bidRef = useRef(0);
  const askRef = useRef(0);
  const lastSubRef = useRef('');

  // Fetch account balances via edge function
  const fetchBalances = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('bybit-proxy', {
        body: {
          endpoint: '/v5/account/wallet-balance',
          params: { accountType: 'UNIFIED' },
        },
      });
      if (!error && data?.result?.list?.[0]?.coin) {
        const coins = data.result.list[0].coin
          .filter((c: any) => parseFloat(c.walletBalance) > 0)
          .map((c: any) => ({
            coin: c.coin,
            free: c.availableToWithdraw,
            locked: (parseFloat(c.walletBalance) - parseFloat(c.availableToWithdraw)).toFixed(8),
          }));
        setBalances(coins);
      }
    } catch (e) {
      console.error('Failed to fetch balances:', e);
    }
  }, []);

  // Fetch orderbook via REST as backup
  const fetchOrderbook = useCallback(async (symbol: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('bybit-proxy', {
        body: {
          endpoint: '/v5/market/orderbook',
          params: { category: 'spot', symbol, limit: '25' },
        },
      });
      if (!error && data?.result) {
        const mapLevels = (levels: string[][]): OrderbookLevel[] => {
          let total = 0;
          return levels.map(([price, size]: string[]) => {
            const s = parseFloat(size);
            total += s;
            return { price: parseFloat(price), size: s, total: +total.toFixed(6) };
          });
        };
        const ob: Orderbook = {
          exchange: 'Bybit',
          bids: mapLevels(data.result.b || []),
          asks: mapLevels(data.result.a || []),
        };
        setOrderbooks([ob, ob]);
      }
    } catch (e) {
      console.error('Failed to fetch orderbook:', e);
    }
  }, []);

  // WebSocket connection for real-time data
  useEffect(() => {
    const symbol = pairToBybitSymbol(selectedPair);
    
    // Close previous connection
    if (wsRef.current) {
      try {
        if (lastSubRef.current) {
          wsRef.current.send(JSON.stringify({
            op: 'unsubscribe',
            args: [`tickers.${lastSubRef.current}`, `orderbook.25.${lastSubRef.current}`],
          }));
        }
        wsRef.current.close();
      } catch {}
    }

    setWsStatus('connecting');
    const ws = new WebSocket(BYBIT_WS);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      ws.send(JSON.stringify({
        op: 'subscribe',
        args: [`tickers.${symbol}`, `orderbook.25.${symbol}`],
      }));
      lastSubRef.current = symbol;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        if (msg.topic?.startsWith('tickers.')) {
          const d = msg.data as BybitTicker;
          const price = parseFloat(d.lastPrice);
          const bid = parseFloat(d.bid1Price);
          const ask = parseFloat(d.ask1Price);
          
          if (price > 0) {
            priceRef.current = price;
            bidRef.current = bid;
            askRef.current = ask;
            setLastPrice(price);
            setLatency(Math.max(1, Date.now() - (msg.ts || Date.now())));

            // Generate spread signal from bid-ask
            const spread = ((ask - bid) / bid) * 100;
            const netProfit = spread - 0.2; // minus fees
            if (spread > 0) {
              const signal: Signal = {
                id: Math.random().toString(36).substr(2, 9),
                pair: selectedPair,
                exchangeA: 'Bybit Bid',
                exchangeB: 'Bybit Ask',
                priceA: bid,
                priceB: ask,
                spread: +spread.toFixed(4),
                netProfit: +netProfit.toFixed(4),
                volume: parseFloat(d.volume24h || '0'),
                timestamp: Date.now(),
                direction: 'buy-a-sell-b',
              };
              setSignals(prev => [signal, ...prev].slice(0, 50));
            }
          }
        }

        if (msg.topic?.startsWith('orderbook.')) {
          const d = msg.data;
          if (d?.b && d?.a) {
            const mapLevels = (levels: string[][]): OrderbookLevel[] => {
              let total = 0;
              return levels.slice(0, 15).map(([price, size]: string[]) => {
                const s = parseFloat(size);
                total += s;
                return { price: parseFloat(price), size: s, total: +total.toFixed(6) };
              });
            };
            const ob: Orderbook = {
              exchange: 'Bybit',
              bids: mapLevels(d.b),
              asks: mapLevels(d.a),
            };
            setOrderbooks([ob, { ...ob, exchange: 'Bybit (Mirror)' }]);
          }
        }
      } catch {}
    };

    ws.onerror = () => setWsStatus('error');
    ws.onclose = () => {
      if (wsRef.current === ws) setWsStatus('fallback');
    };

    // Fetch initial orderbook via REST
    fetchOrderbook(symbol);
    // Fetch balances on mount
    fetchBalances();

    return () => {
      try { ws.close(); } catch {}
    };
  }, [selectedPair, fetchOrderbook, fetchBalances]);

  // Build price history from ticks
  useEffect(() => {
    if (lastPrice <= 0) return;
    const buy = Math.random() > 0.95;
    const sell = !buy && Math.random() > 0.95;
    setPriceHistory(prev => [
      ...prev.slice(-80),
      {
        time: new Date().toLocaleTimeString(),
        price: +lastPrice.toFixed(2),
        buySignal: buy || undefined,
        sellSignal: sell || undefined,
      },
    ]);
  }, [lastPrice]);

  // Refresh balances every 30s
  useEffect(() => {
    const iv = setInterval(fetchBalances, 30000);
    return () => clearInterval(iv);
  }, [fetchBalances]);

  return { signals, orderbooks, priceHistory, wsStatus, latency, balances, lastPrice };
}
