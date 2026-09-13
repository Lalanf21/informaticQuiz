import { useState, useEffect } from 'react';

interface Props {
  pairs: string[];
  rights: string[];
  initialAnswer?: Record<string, string>;
  onAnswer: (mapping: Record<string, string>) => void;
}

export default function MatchingQuestion({ pairs, rights, initialAnswer, onAnswer }: Props) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>(initialAnswer || {});

  useEffect(() => {
    setMapping(initialAnswer || {});
    setSelectedLeft(null);
  }, [pairs, rights, initialAnswer]);

  const unpair = (left: string) => {
    if (!mapping[left]) return;
    const next = { ...mapping };
    delete next[left];
    setMapping(next);
    if (selectedLeft === left) {
      setSelectedLeft(null);
    }
    onAnswer(next);
  };

  const handleLeftClick = (l: string) => {
    if (selectedLeft === l) {
      if (mapping[l]) {
        unpair(l);
        return;
      }
      setSelectedLeft(null);
      return;
    }
    setSelectedLeft(l);
  };

  const handleRightClick = (right: string) => {
    if (!selectedLeft) return;
    const next = { ...mapping, [selectedLeft]: right };
    setMapping(next);
    setSelectedLeft(null);
    onAnswer(next);
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5">
      <div className="space-y-3">
        {pairs.map((l) => {
          const isSelected = selectedLeft === l;
          const isMatched = Boolean(mapping[l]);
          return (
            <div key={l} className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => handleLeftClick(l)}
                aria-pressed={isSelected}
                className={`flex-1 border-3 border-ink p-3 text-left transition-all duration-75 ${
                  isSelected
                    ? 'translate-x-1 translate-y-1 bg-sun shadow-pop-none'
                    : isMatched
                      ? 'bg-mint shadow-pop-sm'
                      : 'bg-cloud shadow-pop hover:bg-paper-2'
                }`}
              >
                <span className="block font-bold">{l}</span>
                {mapping[l] && (
                  <span className="mt-1 inline-block border-2 border-ink bg-cloud px-1.5 py-0.5 text-xs font-bold">
                    → {mapping[l]}
                  </span>
                )}
              </button>
              {mapping[l] && (
                <button
                  type="button"
                  title="Hapus pasangan"
                  aria-label={`Hapus pasangan ${l}`}
                  onClick={() => unpair(l)}
                  className="border-3 border-ink bg-blood px-2 font-display text-cloud shadow-pop-sm hover:bg-ink"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="space-y-3">
        {rights.map((r) => {
          const isUsed = Object.values(mapping).includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => handleRightClick(r)}
              disabled={isUsed}
              className={`w-full border-3 border-ink p-3 text-left font-semibold transition-all duration-75 ${
                isUsed
                  ? 'cursor-not-allowed border-ash bg-paper-2 text-ash line-through shadow-none'
                  : 'bg-paper shadow-pop hover:bg-sun'
              }`}
            >
              {r}
            </button>
          );
        })}
      </div>
    </div>
  );
}
