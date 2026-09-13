interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0;
  const cells = Array.from({ length: total }, (_, i) => i);
  return (
    <div className="mb-4">
      <div
        role="progressbar"
        aria-valuenow={total > 0 ? current + 1 : 0}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Soal ${current + 1} dari ${total}`}
        className="h-3 w-full border-3 border-ink bg-cloud"
      >
        <div className="h-full bg-pulse transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="font-display text-2xl leading-none tabular-nums sm:text-3xl">
          {String(current + 1).padStart(2, '0')}
          <span className="text-ash">/{String(total).padStart(2, '0')}</span>
        </span>
        {/* Cell strip — gameboy block-inversion donation, one cell per question. */}
        <div className="flex flex-wrap justify-end gap-1">
          {cells.map((i) => (
            <span
              key={i}
              aria-hidden
              className={`h-4 w-3 border-2 border-ink ${
                i < current ? 'bg-ink' : i === current ? 'bg-pulse' : 'bg-cloud'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
