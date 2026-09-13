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
    <div className="space-y-3">
      {shuffled.map((item, shuffleIdx) => {
        const selected = selectedShuffleIdx === shuffleIdx;
        return (
          <button
            key={shuffleIdx}
            type="button"
            aria-pressed={selected}
            aria-label={item.opt}
            onClick={() => {
              setSelectedShuffleIdx(shuffleIdx);
              onAnswer(item.i);
            }}
            className={`flex w-full items-center gap-3 border-3 border-ink p-3 text-left transition-all duration-75 ${
              selected
                ? 'translate-x-1 translate-y-1 bg-sun shadow-pop-none'
                : 'bg-cloud shadow-pop hover:bg-paper-2'
            }`}
          >
            <span
              aria-hidden
              className={`flex h-8 w-8 shrink-0 items-center justify-center border-3 border-ink font-display text-sm ${
                selected ? 'bg-ink text-cloud' : 'bg-paper'
              }`}
            >
              {String.fromCharCode(65 + shuffleIdx)}
            </span>
            <span className="font-medium">{item.opt}</span>
          </button>
        );
      })}
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
