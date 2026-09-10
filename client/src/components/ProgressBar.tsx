interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={total > 0 ? current + 1 : 0}
      aria-valuemin={0}
      aria-valuemax={total}
      className="w-full bg-gray-200 rounded-full h-3 mb-4"
    >
      <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
