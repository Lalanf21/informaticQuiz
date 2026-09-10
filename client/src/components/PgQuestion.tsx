import { useState, useEffect, useMemo } from 'react';

interface Props {
  options: string[];
  initialAnswer?: number;
  onAnswer: (originalIndex: number) => void;
}

export default function PgQuestion({ options, initialAnswer, onAnswer }: Props) {
  const shuffled = useMemo(() => shuffleStable(options.map((opt, i) => ({ opt, i }))), [options]);
  const [selectedShuffleIdx, setSelectedShuffleIdx] = useState<number | null>(() => {
    if (initialAnswer === undefined || initialAnswer === null) return null;
    const idx = shuffled.findIndex((item) => item.i === initialAnswer);
    return idx >= 0 ? idx : null;
  });

  useEffect(() => {
    if (initialAnswer === undefined || initialAnswer === null) {
      setSelectedShuffleIdx(null);
    } else {
      const idx = shuffled.findIndex((item) => item.i === initialAnswer);
      setSelectedShuffleIdx(idx >= 0 ? idx : null);
    }
  }, [options, initialAnswer, shuffled]);

  return (
    <div className="space-y-2">
      {shuffled.map((item, shuffleIdx) => (
        <button
          key={shuffleIdx}
          type="button"
          onClick={() => {
            setSelectedShuffleIdx(shuffleIdx);
            onAnswer(item.i);
          }}
          className={`w-full p-3 border rounded-lg text-left ${
            selectedShuffleIdx === shuffleIdx ? 'bg-blue-100 border-blue-500' : 'bg-white'
          }`}
        >
          {item.opt}
        </button>
      ))}
    </div>
  );
}

function shuffleStable<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
