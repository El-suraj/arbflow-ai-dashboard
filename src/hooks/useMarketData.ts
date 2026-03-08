import { useState, useEffect, useRef } from 'react';

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

export interface TradeExecution {
  id: string;
  signal: Signal;
  status: 'pending' | 'filling' | 'filled' | 'failed';
  fillPrice: number;
  slippage: number;
  profit: number;
  timestamp: number;
  capitalUsed: number;
}

export type WsStatus = 'connecting' | 'connected' | 'fallback' | 'error';

export const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ARB/USDT', 'AVAX/USDT', 'MATIC/USDT', 'LINK/USDT', 'DOGE/USDT'];
const EXCHANGES = ['Binance', 'Coinbase', 'Kraken', 'OKX', 'Bybit', 'KuCoin', 'Bitfinex', 'Huobi'];
const FEE = 0.002;

export const BASE_PRICES: Record<string, number> = {
  'BTC/USDT': 67450, 'ETH/USDT': 3520, 'SOL/USDT': 142, 'ARB/USDT': 1.12,
  'AVAX/USDT': 35.8, 'MATIC/USDT': 0.72, 'LINK/USDT': 14.5, 'DOGE/USDT': 0.082,
};

function jitter(base: number, pct: number) {
  return base * (1 + (Math.random() - 0.5) * 2 * pct);
}

export function generateOrderbook(exchange: string, basePrice: number): Orderbook {
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

function generateSignalFromPrices(binancePrice: number, coinbasePrice: number, pair: string): Signal {
  const spread = ((Math.abs(binancePrice - coinbasePrice) / Math.min(binancePrice, coinbasePrice)) * 100);
  const netProfit = spread - (FEE * 100 * 2);
  return {
    id: Math.random().toString(36).substr(2, 9),
    pair,
    exchangeA: 'Binance',
    exchangeB: 'Coinbase',
    priceA: binancePrice,
    priceB: coinbasePrice,
    spread: +spread.toFixed(4),
    netProfit: +netProfit.toFixed(4),
    volume: Math.floor(Math.random() * 500000) + 10000,
    timestamp: Date.now(),
    direction: binancePrice < coinbasePrice ? 'buy-a-sell-b' : 'buy-b-sell-a',
  };
}

function generateMockSignal(): Signal {
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
    spread: +spread.toFixed(4), netProfit: +netProfit.toFixed(4),
    volume: Math.floor(Math.random() * 500000) + 10000,
    timestamp: Date.now(),
    direction: priceA < priceB ? 'buy-a-sell-b' : 'buy-b-sell-a',
  };
}

interface UseMarketDataOptions {
  selectedPair: string;
}

export function useMarketData({ selectedPair }: UseMarketDataOptions) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [orderbooks, setOrderbooks] = useState<[Orderbook, Orderbook]>(() => [
    generateOrderbook('Binance', BASE_PRICES[selectedPair] || BASE_PRICES['BTC/USDT']),
    generateOrderbook('Coinbase', BASE_PRICES[selectedPair] || BASE_PRICES['BTC/USDT']),
  ]);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [pnlData, setPnlData] = useState<PnLPoint[]>([]);
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');
  const [latency, setLatency] = useState(0);

  const binancePriceRef = useRef(BASE_PRICES[selectedPair] || BASE_PRICES['BTC/USDT']);
  const coinbasePriceRef = useRef(BASE_PRICES[selectedPair] || BASE_PRICES['BTC/USDT']);
  const priceRef = useRef(BASE_PRICES[selectedPair] || BASE_PRICES['BTC/USDT']);
  const wsRefs = useRef<WebSocket[]>([]);
  const usingLiveRef = useRef(false);
  const selectedPairRef = useRef(selectedPair);

  // Reset when pair changes
  useEffect(() => {
    selectedPairRef.current = selectedPair;
    const base = BASE_PRICES[selectedPair] || BASE_PRICES['BTC/USDT'];
    priceRef.current = base;
    binancePriceRef.current = base;
    coinbasePriceRef.current = base;

    // Re-init price history for new pair
    const now = Date.now();
    const pts: PricePoint[] = [];
    let p = base;
    for (let i = 60; i >= 0; i--) {
      p = jitter(p, 0.001);
      const t = new Date(now - i * 5000);
      const buy = Math.random() > 0.92;
      const sell = !buy && Math.random() > 0.92;
      pts.push({ time: t.toLocaleTimeString(), price: +p.toFixed(2), buySignal: buy || undefined, sellSignal: sell || undefined });
    }
    priceRef.current = p;
    setPriceHistory(pts);
  }, [selectedPair]);

  // Init PnL
  useEffect(() => {
    const now = Date.now();
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

  // Connect to real WebSockets (BTC only, others use mock)
  useEffect(() => {
    let fallbackTimeout: ReturnType<typeof setTimeout>;
    let binanceConnected = false;
    let coinbaseConnected = false;

    const checkBothConnected = () => {
      if (binanceConnected && coinbaseConnected) {
        usingLiveRef.current = true;
        setWsStatus('connected');
      }
    };

    try {
      const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
      wsRefs.current.push(binanceWs);
      binanceWs.onopen = () => { binanceConnected = true; checkBothConnected(); };
      binanceWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.p && selectedPairRef.current === 'BTC/USDT') {
            const price = parseFloat(data.p);
            binancePriceRef.current = price;
            priceRef.current = price;
            setLatency(Math.max(1, Math.min(Date.now() - data.T, 200)));
          }
        } catch {}
      };
      binanceWs.onerror = () => { binanceConnected = false; };
      binanceWs.onclose = () => { binanceConnected = false; if (!coinbaseConnected) startFallback(); };
    } catch {}

    try {
      const coinbaseWs = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      wsRefs.current.push(coinbaseWs);
      coinbaseWs.onopen = () => {
        coinbaseWs.send(JSON.stringify({ type: 'subscribe', product_ids: ['BTC-USD'], channels: ['ticker'] }));
        coinbaseConnected = true;
        checkBothConnected();
      };
      coinbaseWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ticker' && data.price && selectedPairRef.current === 'BTC/USDT') {
            coinbasePriceRef.current = parseFloat(data.price);
          }
        } catch {}
      };
      coinbaseWs.onerror = () => { coinbaseConnected = false; };
      coinbaseWs.onclose = () => { coinbaseConnected = false; if (!binanceConnected) startFallback(); };
    } catch {}

    const startFallback = () => {
      if (!usingLiveRef.current) {
        setWsStatus('fallback');
        setLatency(Math.floor(Math.random() * 15) + 8);
      }
    };

    fallbackTimeout = setTimeout(() => {
      if (!binanceConnected && !coinbaseConnected) startFallback();
    }, 5000);

    return () => {
      clearTimeout(fallbackTimeout);
      wsRefs.current.forEach(ws => { try { ws.close(); } catch {} });
      wsRefs.current = [];
    };
  }, []);

  // Tick signals
  useEffect(() => {
    const iv = setInterval(() => {
      if (usingLiveRef.current && selectedPairRef.current === 'BTC/USDT') {
        const realSignal = generateSignalFromPrices(binancePriceRef.current, coinbasePriceRef.current, 'BTC/USDT');
        const mockSignal = generateMockSignal();
        setSignals(prev => [realSignal, mockSignal, ...prev].slice(0, 50));
      } else {
        setSignals(prev => [generateMockSignal(), ...prev].slice(0, 50));
      }
    }, 800);
    return () => clearInterval(iv);
  }, []);

  // Tick orderbooks
  useEffect(() => {
    const iv = setInterval(() => {
      const useLive = usingLiveRef.current && selectedPairRef.current === 'BTC/USDT';
      const binPrice = useLive ? binancePriceRef.current : jitter(priceRef.current, 0.0005);
      const cbPrice = useLive ? coinbasePriceRef.current : jitter(priceRef.current, 0.0008);
      if (!useLive) priceRef.current = binPrice;
      setOrderbooks([
        generateOrderbook('Binance', binPrice),
        generateOrderbook('Coinbase', cbPrice),
      ]);
    }, 500);
    return () => clearInterval(iv);
  }, []);

  // Tick price history
  useEffect(() => {
    const iv = setInterval(() => {
      const useLive = usingLiveRef.current && selectedPairRef.current === 'BTC/USDT';
      const currentPrice = useLive ? binancePriceRef.current : jitter(priceRef.current, 0.0008);
      if (!useLive) priceRef.current = currentPrice;
      const buy = Math.random() > 0.93;
      const sell = !buy && Math.random() > 0.93;
      setPriceHistory(prev => [
        ...prev.slice(-80),
        { time: new Date().toLocaleTimeString(), price: +currentPrice.toFixed(2), buySignal: buy || undefined, sellSignal: sell || undefined },
      ]);
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  return { signals, orderbooks, priceHistory, pnlData, wsStatus, latency };
}
