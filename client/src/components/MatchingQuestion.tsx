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
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        {pairs.map((l) => (
          <div key={l} className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => handleLeftClick(l)}
              className={`flex-1 p-3 border rounded-lg text-left ${
                selectedLeft === l
                  ? 'bg-yellow-200 border-yellow-500'
                  : mapping[l]
                  ? 'bg-green-50'
                  : 'bg-white'
              }`}
            >
              {l} {mapping[l] && <span className="text-xs text-gray-500">→ {mapping[l]}</span>}
            </button>
            {mapping[l] && (
              <button
                type="button"
                title="Hapus pasangan"
                aria-label={`Hapus pasangan ${l}`}
                onClick={() => unpair(l)}
                className="px-2 py-1 text-xs text-red-600 hover:text-red-800 border border-red-200 rounded"
              >
                Hapus
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {rights.map((r) => {
          const isUsed = Object.values(mapping).includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => handleRightClick(r)}
              disabled={isUsed}
              className={`w-full p-3 border rounded-lg text-left ${
                isUsed ? 'bg-gray-200 line-through text-gray-400' : 'bg-white'
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
