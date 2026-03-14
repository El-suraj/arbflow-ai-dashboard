import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Bot, Zap, Triangle, FlaskConical, Bell, Volume2 } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  icon: React.ReactNode;
  active: boolean;
  description: string;
}

interface BotControllerProps {
  minSpread: string;
  onMinSpreadChange: (v: string) => void;
  alertsEnabled: boolean;
  onAlertsEnabledChange: (v: boolean) => void;
  soundEnabled: boolean;
  onSoundEnabledChange: (v: boolean) => void;
}

export function BotController({
  minSpread, onMinSpreadChange,
  alertsEnabled, onAlertsEnabledChange,
  soundEnabled, onSoundEnabledChange,
}: BotControllerProps) {
  const [strategies, setStrategies] = useState<Strategy[]>([
    { id: 'spatial', name: 'Spatial Arb', icon: <Zap className="w-4 h-4" />, active: true, description: 'Cross-exchange price differential' },
    { id: 'triangular', name: 'Triangular', icon: <Triangle className="w-4 h-4" />, active: false, description: 'Multi-pair cycle arbitrage' },
    { id: 'flash', name: 'Flash Loan', icon: <FlaskConical className="w-4 h-4" />, active: false, description: 'DeFi flash loan execution' },
  ]);
  

  const toggleStrategy = (id: string) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const activeCount = strategies.filter(s => s.active).length;

  return (
    <div className="panel glow-border flex flex-col">
      <div className="panel-header">
        <span className="panel-title flex items-center gap-2">
          <Bot className="w-3.5 h-3.5" />
          Bot Controller
        </span>
        <span className="data-cell text-primary">{activeCount}/{strategies.length} Active</span>
      </div>
      <div className="p-3 space-y-3">
        {strategies.map(s => (
          <div key={s.id} className={`flex items-center justify-between p-2.5 rounded border transition-all ${s.active ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/20'}`}>
            <div className="flex items-center gap-2.5">
              <span className={s.active ? 'text-primary' : 'text-muted-foreground'}>{s.icon}</span>
              <div>
                <div className={`text-xs font-semibold font-mono ${s.active ? 'glow-text' : 'text-foreground'}`}>{s.name}</div>
                <div className="text-[10px] text-muted-foreground">{s.description}</div>
              </div>
            </div>
            <Switch checked={s.active} onCheckedChange={() => toggleStrategy(s.id)} />
          </div>
        ))}

        <div className="space-y-2 pt-2 border-t border-border">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Min Spread Trigger (%)</label>
          <Input value={minSpread} onChange={e => onMinSpreadChange(e.target.value)} className="font-mono text-sm h-8 bg-secondary/30" />
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-1.5">
              <Bell className="w-3 h-3" /> Spread Alerts
            </span>
            <Switch checked={alertsEnabled} onCheckedChange={onAlertsEnabledChange} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-1.5">
              <Volume2 className="w-3 h-3" /> Sound Alerts
            </span>
            <Switch checked={soundEnabled} onCheckedChange={onSoundEnabledChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
