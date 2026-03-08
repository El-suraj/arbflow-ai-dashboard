import { useState, useEffect, useRef, useCallback } from 'react';
import { BASE_PRICES, PAIRS, PricePoint, generateOrderbook } from '@/hooks/useMarketData';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, ReferenceDot } from 'recharts';
import { Play, Pause, SkipForward, RotateCcw, History, FastForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PairSelector } from './PairSelector';

interface BacktestTrade {
  time: string;
  type: 'buy' | 'sell';
  price: number;
  profit: number;
}

interface BacktestResult {
  priceData: PricePoint[];
  trades: BacktestTrade[];
  equity: { time: string; value: number }[];
  totalProfit: number;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
  sharpe: number;
}

function jitter(base: number, pct: number) {
  return base * (1 + (Math.random() - 0.5) * 2 * pct);
}

function generateBacktestData(pair: string, days: number, strategy: string): BacktestResult {
  const base = BASE_PRICES[pair] || 67450;
  const points: PricePoint[] = [];
  const trades: BacktestTrade[] = [];
  const equity: { time: string; value: number }[] = [];
  let price = base;
  let balance = 10000;
  let wins = 0;
  let peak = balance;
  let maxDd = 0;
  const returns: number[] = [];

  const totalPoints = days * 24; // hourly candles

  for (let i = 0; i < totalPoints; i++) {
    const trend = Math.sin(i / (totalPoints * 0.15)) * 0.002;
    price = price * (1 + trend + (Math.random() - 0.498) * 0.008);
    const t = new Date(Date.now() - (totalPoints - i) * 3600000);
    const timeStr = t.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });

    let buySignal = false;
    let sellSignal = false;

    // Strategy-based signal generation
    if (strategy === 'spatial' && i > 5) {
      const lookback = points.slice(-5);
      const avgPrice = lookback.reduce((s, p) => s + p.price, 0) / lookback.length;
      const spread = Math.abs(price - avgPrice) / avgPrice * 100;
      if (spread > 0.3 && price < avgPrice && Math.random() > 0.6) {
        buySignal = true;
        const profit = +(spread * 0.4 * (balance * 0.1) / 100).toFixed(2);
        balance += profit;
        if (profit > 0) wins++;
        trades.push({ time: timeStr, type: 'buy', price: +price.toFixed(2), profit });
        returns.push(profit / balance);
      } else if (spread > 0.25 && price > avgPrice && Math.random() > 0.65) {
        sellSignal = true;
        const profit = +(spread * 0.35 * (balance * 0.1) / 100).toFixed(2);
        balance += profit;
        if (profit > 0) wins++;
        trades.push({ time: timeStr, type: 'sell', price: +price.toFixed(2), profit });
        returns.push(profit / balance);
      }
    } else if (strategy === 'triangular' && i > 10) {
      if (Math.random() > 0.85) {
        const profit = +((Math.random() * 0.8 - 0.15) * (balance * 0.05) / 100 * 100).toFixed(2);
        balance += profit;
        if (profit > 0) wins++;
        buySignal = profit > 0;
        sellSignal = profit <= 0;
        trades.push({ time: timeStr, type: profit > 0 ? 'buy' : 'sell', price: +price.toFixed(2), profit });
        returns.push(profit / balance);
      }
    } else if (strategy === 'flash' && i > 3) {
      if (Math.random() > 0.92) {
        const profit = +((Math.random() * 2 - 0.3) * (balance * 0.15) / 100 * 100).toFixed(2);
        balance += profit;
        if (profit > 0) wins++;
        buySignal = true;
        trades.push({ time: timeStr, type: 'buy', price: +price.toFixed(2), profit });
        returns.push(profit / balance);
      }
    }

    peak = Math.max(peak, balance);
    const dd = (peak - balance) / peak * 100;
    maxDd = Math.max(maxDd, dd);

    points.push({ time: timeStr, price: +price.toFixed(2), buySignal: buySignal || undefined, sellSignal: sellSignal || undefined });
    equity.push({ time: timeStr, value: +balance.toFixed(2) });
  }

  const avgReturn = returns.length > 0 ? returns.reduce((s, r) => s + r, 0) / returns.length : 0;
  const stdReturn = returns.length > 1 ? Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (returns.length - 1)) : 1;
  const sharpe = stdReturn > 0 ? +(avgReturn / stdReturn * Math.sqrt(252)).toFixed(2) : 0;

  return {
    priceData: points,
    trades,
    equity,
    totalProfit: +(balance - 10000).toFixed(2),
    winRate: trades.length > 0 ? +(wins / trades.length * 100).toFixed(1) : 0,
    totalTrades: trades.length,
    maxDrawdown: +maxDd.toFixed(2),
    sharpe,
  };
}

interface BacktestPanelProps {
  onClose: () => void;
}

export function BacktestPanel({ onClose }: BacktestPanelProps) {
  const [pair, setPair] = useState('BTC/USDT');
  const [strategy, setStrategy] = useState('spatial');
  const [days, setDays] = useState(30);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runBacktest = useCallback(() => {
    const res = generateBacktestData(pair, days, strategy);
    setResult(res);
    setPlaybackIndex(0);
    setIsPlaying(false);
  }, [pair, days, strategy]);

  useEffect(() => {
    runBacktest();
  }, [runBacktest]);

  useEffect(() => {
    if (isPlaying && result) {
      playRef.current = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev >= result.priceData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 50 / speed);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [isPlaying, result, speed]);

  const visibleData = result ? result.priceData.slice(0, playbackIndex + 1) : [];
  const visibleEquity = result ? result.equity.slice(0, playbackIndex + 1) : [];
  const visibleTrades = result ? result.trades.filter((_, i) => {
    const tradeIdx = result.priceData.findIndex(p => p.time === result.trades[i]?.time);
    return tradeIdx <= playbackIndex;
  }) : [];

  const buyDots = visibleData.filter(d => d.buySignal);
  const sellDots = visibleData.filter(d => d.sellSignal);

  return (
    <div className="fixed inset-0 z-50 bg-background/98 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80">
        <div className="flex items-center gap-3">
          <History className="w-4 h-4 text-primary" />
          <span className="font-mono text-sm font-bold glow-text">Backtest Mode</span>
          <PairSelector value={pair} onChange={setPair} />
          <select
            value={strategy}
            onChange={e => setStrategy(e.target.value)}
            className="appearance-none bg-secondary/40 border border-border rounded px-2 py-1 text-xs font-mono text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="spatial">Spatial Arb</option>
            <option value="triangular">Triangular</option>
            <option value="flash">Flash Loan</option>
          </select>
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="appearance-none bg-secondary/40 border border-border rounded px-2 py-1 text-xs font-mono text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={7}>7 Days</option>
            <option value={14}>14 Days</option>
            <option value={30}>30 Days</option>
            <option value={60}>60 Days</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={runBacktest} className="h-7 text-xs font-mono gap-1">
            <RotateCcw className="w-3 h-3" /> Re-run
          </Button>
          <Button size="sm" variant="outline" onClick={onClose} className="h-7 text-xs font-mono">
            ✕ Exit
          </Button>
        </div>
      </div>

      {result && (
        <>
          {/* Stats bar */}
          <div className="flex items-center gap-6 px-4 py-2 border-b border-border bg-card/50 text-xs font-mono">
            <div>
              <span className="text-muted-foreground">Total P&L: </span>
              <span className={result.totalProfit >= 0 ? 'spread-positive font-semibold' : 'spread-negative font-semibold'}>
                {result.totalProfit >= 0 ? '+' : ''}${result.totalProfit.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Win Rate: </span>
              <span className={result.winRate >= 50 ? 'spread-positive' : 'spread-negative'}>{result.winRate}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Trades: </span>
              <span className="text-foreground">{result.totalTrades}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Max DD: </span>
              <span className="spread-negative">{result.maxDrawdown}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">Sharpe: </span>
              <span className={result.sharpe >= 1 ? 'spread-positive' : 'text-foreground'}>{result.sharpe}</span>
            </div>
            <div className="ml-auto text-muted-foreground">
              {playbackIndex + 1} / {result.priceData.length} candles
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border bg-card/30">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => { setPlaybackIndex(0); setIsPlaying(false); }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setPlaybackIndex(Math.min(playbackIndex + 10, result.priceData.length - 1))}
            >
              <SkipForward className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant={speed === 1 ? 'default' : 'ghost'}
              className="h-7 text-[10px] font-mono px-2"
              onClick={() => setSpeed(1)}
            >
              1x
            </Button>
            <Button
              size="sm"
              variant={speed === 3 ? 'default' : 'ghost'}
              className="h-7 text-[10px] font-mono px-2"
              onClick={() => setSpeed(3)}
            >
              3x
            </Button>
            <Button
              size="sm"
              variant={speed === 10 ? 'default' : 'ghost'}
              className="h-7 text-[10px] font-mono px-2"
              onClick={() => setSpeed(10)}
            >
              <FastForward className="w-3 h-3 mr-0.5" /> 10x
            </Button>
            <input
              type="range"
              min={0}
              max={result.priceData.length - 1}
              value={playbackIndex}
              onChange={e => { setPlaybackIndex(Number(e.target.value)); setIsPlaying(false); }}
              className="flex-1 h-1 accent-primary"
            />
          </div>

          {/* Charts */}
          <div className="flex-1 grid grid-rows-[2fr_1fr] gap-1.5 p-1.5 min-h-0">
            {/* Price chart */}
            <div className="panel glow-border flex flex-col">
              <div className="panel-header">
                <span className="panel-title">Price Action — {pair}</span>
                <span className="data-cell text-muted-foreground">{visibleTrades.length} trades executed</span>
              </div>
              <div className="flex-1 p-2 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={visibleData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(180,100%,50%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(180,100%,50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(215,15%,50%)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: 'hsl(215,15%,50%)' }} tickLine={false} axisLine={false} width={55} tickFormatter={v => `$${v.toLocaleString()}`} />
                    <Area type="monotone" dataKey="price" stroke="hsl(180,100%,50%)" strokeWidth={1.5} fill="url(#btGrad)" isAnimationActive={false} />
                    {buyDots.map((s, i) => (
                      <ReferenceDot key={`bb${i}`} x={s.time} y={s.price} r={4} fill="hsl(142,71%,45%)" stroke="none" />
                    ))}
                    {sellDots.map((s, i) => (
                      <ReferenceDot key={`bs${i}`} x={s.time} y={s.price} r={4} fill="hsl(0,72%,51%)" stroke="none" />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Equity curve */}
            <div className="panel glow-border flex flex-col">
              <div className="panel-header">
                <span className="panel-title">Equity Curve</span>
                {visibleEquity.length > 0 && (
                  <span className={`data-cell font-semibold ${(visibleEquity[visibleEquity.length - 1]?.value ?? 10000) >= 10000 ? 'spread-positive' : 'spread-negative'}`}>
                    ${visibleEquity[visibleEquity.length - 1]?.value.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="flex-1 p-2 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={visibleEquity} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142,71%,45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142,71%,45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(215,15%,50%)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: 'hsl(215,15%,50%)' }} tickLine={false} axisLine={false} width={55} tickFormatter={v => `$${v.toLocaleString()}`} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(215,25%,12%)', border: '1px solid hsl(215,20%,20%)', borderRadius: '4px', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                      labelStyle={{ color: 'hsl(180,100%,50%)' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="hsl(142,71%,45%)" strokeWidth={1.5} fill="url(#eqGrad)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
