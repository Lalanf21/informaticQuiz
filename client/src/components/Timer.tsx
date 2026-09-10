import { useState, useEffect, useRef } from 'react';

interface Props {
  seconds: number;
  onExpire: () => void;
  startedAt?: number;
}

export default function Timer({ seconds, onExpire, startedAt }: Props) {
  const startRef = useRef<number>(startedAt ?? Date.now());
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const hasExpiredRef = useRef(false);

  const getRemaining = (start: number) => {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    return Math.max(0, seconds - elapsed);
  };

  const [remaining, setRemaining] = useState<number>(() => getRemaining(startRef.current));

  useEffect(() => {
    const newStart = startedAt ?? Date.now();
    startRef.current = newStart;
    const rem = getRemaining(newStart);
    setRemaining(rem);
    hasExpiredRef.current = false;
  }, [seconds, startedAt]);

  useEffect(() => {
    const checkExpiry = () => {
      const rem = getRemaining(startRef.current);
      setRemaining(rem);
      if (rem <= 0) {
        if (!hasExpiredRef.current) {
          hasExpiredRef.current = true;
          onExpireRef.current();
        }
      }
    };

    if (remaining <= 0) {
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpireRef.current();
      }
      return;
    }

    const t = setInterval(checkExpiry, 1000);
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        checkExpiry();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      clearInterval(t);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [remaining, seconds, startedAt]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return (
    <div
      role="timer"
      aria-label="Waktu tersisa"
      className={`text-lg font-bold ${remaining < 30 ? 'text-red-600' : 'text-gray-700'}`}
    >
      {mins}:{secs.toString().padStart(2, '0')}
    </div>
  );
}
