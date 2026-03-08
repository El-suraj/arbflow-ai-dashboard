import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

export function useAlerts() {
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastAlertRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playAlertSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, [soundEnabled]);

  const sendDesktopNotification = useCallback((title: string, body: string) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  const triggerAlert = useCallback((pair: string, spread: number, netProfit: number) => {
    if (!alertsEnabled) return;
    const now = Date.now();
    // Throttle: max 1 alert per 5 seconds
    if (now - lastAlertRef.current < 5000) return;
    lastAlertRef.current = now;

    playAlertSound();

    toast.success(`🚨 Arb Alert: ${pair}`, {
      description: `Spread: ${spread.toFixed(3)}% | Net: +${netProfit.toFixed(3)}%`,
      duration: 4000,
    });

    sendDesktopNotification(
      `ArbFlow AI — ${pair}`,
      `Spread ${spread.toFixed(3)}% detected. Est. net profit: +${netProfit.toFixed(3)}%`
    );
  }, [alertsEnabled, playAlertSound, sendDesktopNotification]);

  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    alertsEnabled, setAlertsEnabled,
    soundEnabled, setSoundEnabled,
    triggerAlert,
    requestNotificationPermission,
  };
}
