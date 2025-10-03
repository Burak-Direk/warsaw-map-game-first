// components/CountdownPill.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type CountdownPillProps = {
  seconds: number;
  running: boolean;
  onExpire?: () => void;
  keySeed: string | number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const CountdownPill = ({ seconds, running, onExpire, keySeed }: CountdownPillProps) => {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, seconds) * 1000);
  const intervalRef = useRef<number | null>(null);
  const endTimestampRef = useRef<number>(Date.now() + Math.max(0, seconds) * 1000);
  const expiredRef = useRef(false);

  // Reset whenever the key seed or seconds change
  useEffect(() => {
    const now = Date.now();
    endTimestampRef.current = now + Math.max(0, seconds) * 1000;
    setRemainingMs(Math.max(0, seconds) * 1000);
    expiredRef.current = false;
  }, [seconds, keySeed]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const tick = () => {
      const now = Date.now();
      const remaining = clamp(endTimestampRef.current - now, 0, seconds * 1000);
      setRemainingMs(remaining);

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    };

    tick();
    intervalRef.current = window.setInterval(tick, 125);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, seconds, onExpire]);

  const formatted = useMemo(() => {
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, [remainingMs]);

  const progressPct = useMemo(() => {
    if (seconds <= 0) return 0;
    return clamp(remainingMs / (seconds * 1000), 0, 1);
  }, [remainingMs, seconds]);

  return (
    <div className="countdown-pill">
      <div className="countdown-pill__track">
        <span
          className="countdown-pill__progress"
          style={{ width: `${progressPct * 100}%` }}
        />
      </div>
      <span className="countdown-pill__label">{formatted}</span>
    </div>
  );
};

export default CountdownPill;

