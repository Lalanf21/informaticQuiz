import { useState, useEffect } from 'react';

interface Props {
  initialAnswer?: boolean;
  onAnswer: (value: boolean) => void;
}

export default function TfQuestion({ initialAnswer, onAnswer }: Props) {
  const [selected, setSelected] = useState<boolean | null>(initialAnswer ?? null);

  useEffect(() => {
    setSelected(initialAnswer ?? null);
  }, [initialAnswer]);

  const btn = (value: boolean, label: string, tone: string, mark: string) => {
    const active = selected === value;
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => {
          setSelected(value);
          onAnswer(value);
        }}
        className={`flex flex-1 flex-col items-center gap-2 border-3 border-ink py-8 transition-all duration-75 ${
          active
            ? `translate-x-1 translate-y-1 shadow-pop-none ${tone}`
            : `bg-cloud shadow-pop hover:bg-paper-2`
        }`}
      >
        <span
          aria-hidden
          className={`flex h-12 w-12 items-center justify-center border-3 border-ink font-display text-2xl ${
            active ? 'bg-ink text-cloud' : tone
          }`}
        >
          {mark}
        </span>
        <span className="font-display text-2xl uppercase">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex gap-4">
      {btn(true, 'Benar', 'bg-mint', '✓')}
      {btn(false, 'Salah', 'bg-blood text-cloud', '✕')}
    </div>
  );
}
