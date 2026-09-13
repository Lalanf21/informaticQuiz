import React from 'react';

export interface SessionResultAnswer {
  id: number;
  prompt: string;
  is_correct: boolean | number;
  points_earned: number;
}

export interface SessionResultScore {
  percentage: number;
  total_points: number;
  max_points: number;
  mode?: string;
  topic_id?: number | null;
}

export interface SessionResultData {
  score: SessionResultScore;
  answers: SessionResultAnswer[];
  level?: number | null;
  topicId?: number | null;
}

export interface ResultScreenProps {
  data: SessionResultData;
  onPlayAgain: () => void;
  onLeaderboard: () => void;
  onCampaign?: () => void;
}

/** Grade band → the verdict stamped on the sheet. */
function verdictFor(pct: number) {
  if (pct >= 90) return { label: 'LUAR BIASA', tone: '#12B886', ink: '#111111' };
  if (pct >= 70) return { label: 'LULUS', tone: '#FFD23F', ink: '#111111' };
  if (pct >= 50) return { label: 'HAMPIR', tone: '#FF4D2E', ink: '#111111' };
  return { label: 'COBA LAGI', tone: '#E03131', ink: '#FFFFFF' };
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  data,
  onPlayAgain,
  onLeaderboard,
  onCampaign,
}) => {
  const s = data.score;
  const verdict = verdictFor(s.percentage);
  const correct = data.answers.filter((a) => Boolean(a.is_correct)).length;

  return (
    <div className="w-full max-w-2xl">
      {/* Score panel — the announcement. */}
      <div className="animate-panel-in border-3 border-ink bg-cloud shadow-pop-lg">
        <div className="flex items-center justify-between gap-2 border-b-3 border-ink bg-ink px-4 py-2">
          <span className="font-display text-sm uppercase tracking-[0.2em] text-cloud">
            Hasil Kuis
          </span>
          <span className="border-2 border-cloud px-2 py-0.5 text-xs font-bold uppercase text-cloud">
            {s.mode ?? 'topic'}
          </span>
        </div>

        <div className="relative grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:p-8">
          {/* Big percentage */}
          <div className="flex flex-col items-center justify-center border-3 border-ink bg-paper-2 px-6 py-5 shadow-pop">
            <span className="font-display text-6xl leading-none tabular-nums sm:text-7xl">
              {s.percentage}%
            </span>
            <span className="mt-2 text-xs font-bold uppercase tracking-widest text-ash">
              {correct}/{data.answers.length} benar
            </span>
          </div>

          <div className="flex flex-col justify-center">
            <span
              className="mb-3 inline-block w-fit -rotate-3 border-3 border-ink px-4 py-1.5 font-display text-2xl uppercase shadow-pop-sm animate-stamp-in"
              style={{ background: verdict.tone, color: verdict.ink }}
            >
              {verdict.label}
            </span>
            <p className="font-semibold">
              Skor: {s.total_points} / {s.max_points}
            </p>
            {s.mode === 'campaign' && s.percentage >= 70 && (
              <p className="mt-3 border-3 border-ink bg-mint px-3 py-2 text-sm font-bold uppercase shadow-pop-sm">
                {data.level === 3
                  ? 'Selamat! Kamu telah menuntaskan semua level di topik ini!'
                  : 'Selamat! Kamu berhasil membuka level berikutnya!'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown — review sheet. */}
      <div className="mt-6 border-3 border-ink bg-cloud shadow-pop">
        <h2 className="border-b-3 border-ink bg-sun px-4 py-2 font-display text-sm uppercase tracking-[0.2em]">
          Ulasan Jawaban
        </h2>
        <ol className="divide-y-3 divide-ink">
          {data.answers.map((a, i) => {
            const ok = Boolean(a.is_correct);
            return (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                <div
                  data-correct={ok}
                  className={`flex min-w-0 flex-1 items-start gap-3 border-3 border-ink p-3 ${
                    ok ? 'bg-mint' : 'bg-blood text-cloud'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex h-7 w-7 shrink-0 items-center justify-center border-3 border-ink font-display text-sm ${
                      ok ? 'bg-ink text-cloud' : 'bg-cloud text-ink'
                    }`}
                  >
                    {ok ? '✓' : '✕'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold uppercase tracking-widest opacity-70">
                      Soal {i + 1}
                    </span>
                    <span className="mt-0.5 block font-medium leading-snug">{a.prompt}</span>
                    <span className="mt-1 block text-xs font-bold uppercase tracking-wide">
                      {ok ? 'Benar' : 'Salah'} — +{a.points_earned} poin
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {s.mode === 'campaign' && onCampaign && (
          <button onClick={onCampaign} className="btn-ink flex-1 bg-mint">
            Mode Campaign
          </button>
        )}
        <button onClick={onPlayAgain} className="btn-ink flex-1 bg-pulse">
          Kuis Lagi
        </button>
        <button onClick={onLeaderboard} className="btn-ink flex-1 bg-sun">
          Leaderboard
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;
