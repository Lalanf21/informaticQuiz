import { useState, useEffect, useRef } from 'react';

interface Props {
  seconds: number;
  onExpire: () => void;
}

export default function Timer({ seconds, onExpire }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    setRemaining(seconds);
    hasExpiredRef.current = false;
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpireRef.current();
      }
      return;
    }
    const t = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, [remaining]);

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
