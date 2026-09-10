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

  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => {
          setSelected(true);
          onAnswer(true);
        }}
        className={`flex-1 p-6 rounded-xl font-bold text-xl ${
          selected === true ? 'bg-green-500 text-white' : 'bg-gray-100'
        }`}
      >
        Benar
      </button>
      <button
        type="button"
        onClick={() => {
          setSelected(false);
          onAnswer(false);
        }}
        className={`flex-1 p-6 rounded-xl font-bold text-xl ${
          selected === false ? 'bg-red-500 text-white' : 'bg-gray-100'
        }`}
      >
        Salah
      </button>
    </div>
  );
}
