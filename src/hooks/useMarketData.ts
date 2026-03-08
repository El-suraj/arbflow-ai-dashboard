import { useState, useEffect, useCallback, useRef } from 'react';

export interface Signal {
  id: string;
  pair: string;
  exchangeA: string;
  exchangeB: string;
  priceA: number;
  priceB: number;
  spread: number;
  netProfit: number;
  volume: number;
  timestamp: number;
  direction: 'buy-a-sell-b' | 'buy-b-sell-a';
}

export interface OrderbookLevel {
  price: number;
  size: number;
  total: number;
}

export interface Orderbook {
  exchange: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
}

export interface PricePoint {
  time: string;
  price: number;
  buySignal?: boolean;
  sellSignal?: boolean;
}

export interface PnLPoint {
  date: string;
  pnl: number;
  cumulative: number;
  trades: number;
}

const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ARB/USDT', 'AVAX/USDT', 'MATIC/USDT', 'LINK/USDT', 'DOGE/USDT'];
const EXCHANGES = ['Binance', 'Coinbase', 'Kraken', 'OKX', 'Bybit', 'KuCoin', 'Bitfinex', 'Huobi'];
const FEE = 0.002;

const BASE_PRICES: Record<string, number> = {
  'BTC/USDT': 67450, 'ETH/USDT': 3520, 'SOL/USDT': 142, 'ARB/USDT': 1.12,
  'AVAX/USDT': 35.8, 'MATIC/USDT': 0.72, 'LINK/USDT': 14.5, 'DOGE/USDT': 0.082,
};

function jitter(base: number, pct: number) {
  return base * (1 + (Math.random() - 0.5) * 2 * pct);
}

function generateSignal(): Signal {
  const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
  const exA = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
  let exB = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];
  while (exB === exA) exB = EXCHANGES[Math.floor(Math.random() * EXCHANGES.length)];

  const base = BASE_PRICES[pair];
  const priceA = jitter(base, 0.003);
  const priceB = jitter(base, 0.003);
  const spread = ((Math.abs(priceA - priceB) / Math.min(priceA, priceB)) * 100);
  const netProfit = spread - (FEE * 100 * 2);

  return {
    id: Math.random().toString(36).substr(2, 9),
    pair, exchangeA: exA, exchangeB: exB, priceA, priceB,
    spread: +spread.toFixed(4),
    netProfit: +netProfit.toFixed(4),
    volume: Math.floor(Math.random() * 500000) + 10000,
    timestamp: Date.now(),
    direction: priceA < priceB ? 'buy-a-sell-b' : 'buy-b-sell-a',
  };
}

function generateOrderbook(exchange: string, basePrice: number): Orderbook {
  const bids: OrderbookLevel[] = [];
  const asks: OrderbookLevel[] = [];
  let bidTotal = 0, askTotal = 0;
  for (let i = 0; i < 12; i++) {
    const bidSize = +(Math.random() * 5 + 0.1).toFixed(4);
    bidTotal += bidSize;
    bids.push({ price: +(basePrice - (i + 1) * basePrice * 0.0001).toFixed(2), size: bidSize, total: +bidTotal.toFixed(4) });
    const askSize = +(Math.random() * 5 + 0.1).toFixed(4);
    askTotal += askSize;
    asks.push({ price: +(basePrice + (i + 1) * basePrice * 0.0001).toFixed(2), size: askSize, total: +askTotal.toFixed(4) });
  }
  return { exchange, bids, asks };
}

export function useMarketData() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [orderbooks, setOrderbooks] = useState<[Orderbook, Orderbook]>(() => [
    generateOrderbook('Binance', BASE_PRICES['BTC/USDT']),
    generateOrderbook('Coinbase', BASE_PRICES['BTC/USDT']),
  ]);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [pnlData, setPnlData] = useState<PnLPoint[]>([]);
  const priceRef = useRef(BASE_PRICES['BTC/USDT']);

  // Init price history
  useEffect(() => {
    const now = Date.now();
    const pts: PricePoint[] = [];
    let p = priceRef.current;
    for (let i = 60; i >= 0; i--) {
      p = jitter(p, 0.001);
      const t = new Date(now - i * 5000);
      const buy = Math.random() > 0.92;
      const sell = !buy && Math.random() > 0.92;
      pts.push({ time: t.toLocaleTimeString(), price: +p.toFixed(2), buySignal: buy || undefined, sellSignal: sell || undefined });
    }
    priceRef.current = p;
    setPriceHistory(pts);

    // PnL mock
    const pnl: PnLPoint[] = [];
    let cum = 0;
    for (let i = 30; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const daily = +(Math.random() * 400 - 80).toFixed(2);
      cum += daily;
      pnl.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), pnl: daily, cumulative: +cum.toFixed(2), trades: Math.floor(Math.random() * 50 + 10) });
    }
    setPnlData(pnl);
  }, []);

  // Tick signals
  useEffect(() => {
    const iv = setInterval(() => {
      setSignals(prev => {
        const s = generateSignal();
        return [s, ...prev].slice(0, 50);
      });
    }, 800);
    return () => clearInterval(iv);
  }, []);

  // Tick orderbooks
  useEffect(() => {
    const iv = setInterval(() => {
      const base = jitter(priceRef.current, 0.0005);
      priceRef.current = base;
      setOrderbooks([
        generateOrderbook('Binance', base),
        generateOrderbook('Coinbase', jitter(base, 0.0008)),
      ]);
    }, 500);
    return () => clearInterval(iv);
  }, []);

  // Tick price history
  useEffect(() => {
    const iv = setInterval(() => {
      priceRef.current = jitter(priceRef.current, 0.0008);
      const buy = Math.random() > 0.93;
      const sell = !buy && Math.random() > 0.93;
      setPriceHistory(prev => [
        ...prev.slice(-80),
        { time: new Date().toLocaleTimeString(), price: +priceRef.current.toFixed(2), buySignal: buy || undefined, sellSignal: sell || undefined },
      ]);
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  return { signals, orderbooks, priceHistory, pnlData };
}
