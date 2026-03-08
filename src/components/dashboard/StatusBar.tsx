import { useEffect, useState } from 'react';
import { Cpu, Wifi, Clock, Menu } from 'lucide-react';
import { WsStatus } from '@/hooks/useMarketData';

interface StatusBarProps {
  wsStatus: WsStatus;
  latency: number;
  onToggleMobileMenu?: () => void;
  children?: React.ReactNode;
}

export function StatusBar({ wsStatus, latency, onToggleMobileMenu, children }: StatusBarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const statusLabel = wsStatus === 'connected' ? 'LIVE WS' : wsStatus === 'fallback' ? 'MOCK DATA' : wsStatus === 'connecting' ? 'CONNECTING' : 'ERROR';
  const statusClass = wsStatus === 'connected' ? 'status-live' : 'text-amber-signal text-xs font-mono flex items-center gap-1.5';

  return (
    <div className="flex items-center justify-between px-3 md:px-4 py-1.5 border-b border-border bg-card/80">
      <div className="flex items-center gap-2">
        {onToggleMobileMenu && (
          <button onClick={onToggleMobileMenu} className="lg:hidden text-muted-foreground hover:text-primary transition-colors mr-1">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <span className="font-mono text-sm font-bold glow-text tracking-tight">ArbFlow AI</span>
        <span className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5 hidden sm:inline">v2.4.1</span>
        {children}
      <div className="flex items-center gap-2 md:gap-4 text-[10px] font-mono text-muted-foreground">
        <span className="hidden md:flex items-center gap-1"><Cpu className="w-3 h-3" /> Engine: Active</span>
        <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-green-signal" /> {latency}ms</span>
        <span className="hidden sm:flex items-center gap-1"><Clock className="w-3 h-3" /> {time.toLocaleTimeString()}</span>
        <span className={statusClass}>
          {wsStatus === 'connected' && <></>}
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
