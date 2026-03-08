import { PAIRS } from '@/hooks/useMarketData';
import { ChevronDown } from 'lucide-react';

interface PairSelectorProps {
  value: string;
  onChange: (pair: string) => void;
}

export function PairSelector({ value, onChange }: PairSelectorProps) {
  return (
    <div className="relative inline-flex">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-secondary/40 border border-border rounded px-2 pr-6 py-1 text-xs font-mono font-semibold glow-text cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {PAIRS.map(p => (
          <option key={p} value={p} className="bg-card text-foreground">{p}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-primary pointer-events-none" />
    </div>
  );
}
