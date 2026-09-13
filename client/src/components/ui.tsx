import type { ReactNode } from 'react';

/** Kicker + monumental title, announced like a comic chapter heading. */
export function PageTitle({
  kicker,
  title,
  right,
}: {
  kicker?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && (
          <span className="label-plate mb-2 inline-block pl-4 pr-4 text-[11px] font-bold uppercase tracking-[0.2em]">
            {kicker}
          </span>
        )}
        <h1 className="text-4xl leading-[0.9] sm:text-5xl">{title}</h1>
      </div>
      {right}
    </header>
  );
}

/** Ink panel container. */
export function Panel({
  children,
  className = '',
  solid,
}: {
  children: ReactNode;
  className?: string;
  solid?: string;
}) {
  return (
    <div className={`panel ${className}`} style={solid ? { background: solid } : undefined}>
      {children}
    </div>
  );
}

/** Hazard stripe band — structural divider / warning. */
export function HazardBand({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`h-3 w-full bg-hazard border-y-3 border-ink ${className}`} />;
}

/** Status / state toast, ink framed. */
export function Notice({
  tone = 'error',
  children,
  className = '',
}: {
  tone?: 'error' | 'info' | 'success';
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    error: 'bg-blood text-cloud',
    info: 'bg-volt text-cloud',
    success: 'bg-mint text-ink',
  } as const;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 border-3 border-ink px-3 py-2 font-semibold shadow-pop-sm ${tones[tone]} ${className}`}
    >
      <span aria-hidden className="font-display">
        {tone === 'error' ? '!' : tone === 'success' ? '✓' : 'i'}
      </span>
      <span className="text-sm leading-snug">{children}</span>
    </div>
  );
}

/** Loading state in the world's voice. */
export function LoadingPanel({ label = 'Memuat' }: { label?: string }) {
  return (
    <div className="panel flex items-center gap-3 p-5">
      <span className="inline-block h-4 w-4 animate-blink bg-pulse" aria-hidden />
      <span className="font-display uppercase tracking-wide">{label}…</span>
    </div>
  );
}
