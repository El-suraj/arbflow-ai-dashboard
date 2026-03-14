import { useState } from 'react';
import { Shield, AlertTriangle, TrendingDown, DollarSign } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';

interface RiskManagementProps {
  maxCapital: number;
  onMaxCapitalChange: (v: number) => void;
  totalPnl: number;
}

export function RiskManagement({ maxCapital, onMaxCapitalChange, totalPnl }: RiskManagementProps) {
  const [stopLossEnabled, setStopLossEnabled] = useState(true);
  const [stopLossPercent, setStopLossPercent] = useState(2);
  const [maxPositionSize, setMaxPositionSize] = useState(25);
  const [drawdownAlertEnabled, setDrawdownAlertEnabled] = useState(true);
  const [maxDrawdownPercent, setMaxDrawdownPercent] = useState(5);
  const [dailyLossLimit, setDailyLossLimit] = useState(500);
  const [trailingStopEnabled, setTrailingStopEnabled] = useState(false);
  const [trailingStopPercent, setTrailingStopPercent] = useState(1);

  const drawdownPct = maxCapital > 0 ? Math.abs(Math.min(0, totalPnl)) / maxCapital * 100 : 0;
  const drawdownSeverity = drawdownPct >= maxDrawdownPercent ? 'critical' : drawdownPct >= maxDrawdownPercent * 0.6 ? 'warning' : 'safe';

  return (
    <div className="panel glow-border flex flex-col">
      <div className="panel-header">
        <span className="panel-title flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" />
          Risk Management
        </span>
        <span className={`data-cell font-semibold ${
          drawdownSeverity === 'critical' ? 'spread-negative' :
          drawdownSeverity === 'warning' ? 'text-amber-signal' : 'spread-positive'
        }`}>
          {drawdownSeverity === 'safe' ? '● LOW RISK' : drawdownSeverity === 'warning' ? '● CAUTION' : '● HIGH RISK'}
        </span>
      </div>
      <div className="p-3 space-y-3 text-xs font-mono">
        {/* Capital per trade */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="w-3 h-3" /> Max Capital / Trade (USDT)
          </label>
          <Input
            type="number"
            value={maxCapital}
            onChange={e => onMaxCapitalChange(Number(e.target.value) || 0)}
            className="font-mono text-sm h-8 bg-secondary/30"
            min={0}
            step={100}
          />
          <Slider
            value={[maxCapital]}
            onValueChange={([v]) => onMaxCapitalChange(v)}
            min={100}
            max={50000}
            step={100}
            className="pt-1"
          />
        </div>

        {/* Drawdown monitor */}
        <div className="space-y-1.5 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <TrendingDown className="w-3 h-3" /> Drawdown Monitor
            </span>
            <span className={`text-[10px] font-semibold ${
              drawdownSeverity === 'critical' ? 'spread-negative' :
              drawdownSeverity === 'warning' ? 'text-amber-signal' : 'text-muted-foreground'
            }`}>
              {drawdownPct.toFixed(2)}% / {maxDrawdownPercent}%
            </span>
          </div>
          <Progress
            value={Math.min(100, (drawdownPct / maxDrawdownPercent) * 100)}
            className="h-1.5"
          />
        </div>

        {/* Stop-Loss */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Stop-Loss
            </span>
            <Switch checked={stopLossEnabled} onCheckedChange={setStopLossEnabled} />
          </div>
          {stopLossEnabled && (
            <div className="flex items-center gap-2 pl-4">
              <span className="text-muted-foreground whitespace-nowrap">Trigger at</span>
              <Input
                type="number"
                value={stopLossPercent}
                onChange={e => setStopLossPercent(Number(e.target.value) || 0)}
                className="font-mono text-xs h-6 w-16 bg-secondary/30 px-1.5"
                min={0.1}
                max={20}
                step={0.1}
              />
              <span className="text-muted-foreground">% loss</span>
            </div>
          )}
        </div>

        {/* Trailing Stop */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Trailing Stop</span>
            <Switch checked={trailingStopEnabled} onCheckedChange={setTrailingStopEnabled} />
          </div>
          {trailingStopEnabled && (
            <div className="flex items-center gap-2 pl-4">
              <span className="text-muted-foreground whitespace-nowrap">Trail by</span>
              <Input
                type="number"
                value={trailingStopPercent}
                onChange={e => setTrailingStopPercent(Number(e.target.value) || 0)}
                className="font-mono text-xs h-6 w-16 bg-secondary/30 px-1.5"
                min={0.1}
                max={10}
                step={0.1}
              />
              <span className="text-muted-foreground">%</span>
            </div>
          )}
        </div>

        {/* Position size limit */}
        <div className="space-y-1.5 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Max Position Size</span>
            <span className="text-muted-foreground">{maxPositionSize}% of capital</span>
          </div>
          <Slider
            value={[maxPositionSize]}
            onValueChange={([v]) => setMaxPositionSize(v)}
            min={5}
            max={100}
            step={5}
          />
        </div>

        {/* Daily loss limit */}
        <div className="space-y-1.5 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Daily Loss Limit</span>
            <Input
              type="number"
              value={dailyLossLimit}
              onChange={e => setDailyLossLimit(Number(e.target.value) || 0)}
              className="font-mono text-xs h-6 w-20 bg-secondary/30 px-1.5 text-right"
              min={0}
              step={50}
            />
          </div>
        </div>

        {/* Drawdown alert toggle */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Drawdown Alerts
            </span>
            <Switch checked={drawdownAlertEnabled} onCheckedChange={setDrawdownAlertEnabled} />
          </div>
          {drawdownAlertEnabled && (
            <div className="flex items-center gap-2 pl-4 mt-1.5">
              <span className="text-muted-foreground whitespace-nowrap">Alert at</span>
              <Input
                type="number"
                value={maxDrawdownPercent}
                onChange={e => setMaxDrawdownPercent(Number(e.target.value) || 0)}
                className="font-mono text-xs h-6 w-16 bg-secondary/30 px-1.5"
                min={1}
                max={50}
                step={1}
              />
              <span className="text-muted-foreground">% drawdown</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
