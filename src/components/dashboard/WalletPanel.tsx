import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wallet, Eye, EyeOff, Shield } from 'lucide-react';

interface WalletPanelProps {
  balances?: { coin: string; free: string; locked: string }[];
}

export function WalletPanel({ balances = [] }: WalletPanelProps) {
  const [showKeys, setShowKeys] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  const hasRealBalances = balances.length > 0;

  return (
    <div className="panel glow-border flex flex-col">
      <div className="panel-header">
        <span className="panel-title flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5" />
          Wallet & APIs
        </span>
        <span className={`data-cell font-semibold text-xs ${hasRealBalances ? 'glow-text' : 'text-muted-foreground'}`}>
          {hasRealBalances ? 'LIVE' : 'NOT CONNECTED'}
        </span>
      </div>
      <div className="p-3 space-y-3 text-xs">
        <div className="space-y-1">
          {hasRealBalances ? (
            balances.map(b => (
              <div key={b.coin} className="flex justify-between items-center py-1.5 px-2 rounded bg-secondary/20">
                <span className="font-mono font-semibold text-foreground">{b.coin}</span>
                <div className="flex gap-3 data-cell text-muted-foreground">
                  <span>Free: {parseFloat(b.free).toFixed(6)}</span>
                  <span>Locked: {parseFloat(b.locked).toFixed(6)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground font-mono text-[10px]">
              No live balances — connect Bybit API keys via Cloud secrets
            </div>
          )}
        </div>
        <div className="border-t border-border pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> API Configuration
            </span>
            <button onClick={() => setShowKeys(!showKeys)} className="text-primary hover:text-primary/80 transition-colors">
              {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <Input
            type={showKeys ? 'text' : 'password'}
            placeholder="API Key (Read Only)"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="font-mono text-xs h-7 bg-secondary/30"
          />
          <Input
            type={showKeys ? 'text' : 'password'}
            placeholder="API Secret"
            value={apiSecret}
            onChange={e => setApiSecret(e.target.value)}
            className="font-mono text-xs h-7 bg-secondary/30"
          />
          <Button size="sm" className="w-full h-7 text-xs font-mono">Connect Exchange</Button>
        </div>
      </div>
    </div>
  );
}
