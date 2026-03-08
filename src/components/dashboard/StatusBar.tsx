import { useEffect, useState } from 'react';
import { Cpu, Wifi, Clock } from 'lucide-react';

export function StatusBar() {
  const [time, setTime] = useState(new Date());
  const [latency] = useState(() => Math.floor(Math.random() * 15) + 8);

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-card/80">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-bold glow-text tracking-tight">ArbFlow AI</span>
        <span className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">v2.4.1</span>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> Engine: Active</span>
        <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-green-signal" /> {latency}ms</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {time.toLocaleTimeString()}</span>
        <span className="status-live">CONNECTED</span>
      </div>
    </div>
  );
}
