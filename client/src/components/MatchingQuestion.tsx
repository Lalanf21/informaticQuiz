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
          <button
            key={l}
            type="button"
            onClick={() => setSelectedLeft(l)}
            className={`w-full p-3 border rounded-lg text-left ${
              selectedLeft === l
                ? 'bg-yellow-200 border-yellow-500'
                : mapping[l]
                ? 'bg-green-50'
                : 'bg-white'
            }`}
          >
            {l} {mapping[l] && <span className="text-xs text-gray-500">→ {mapping[l]}</span>}
          </button>
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
