import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Score } from '../types';
import { HazardBand, Notice, PageTitle } from '../components/ui';

const PODIUM_TONE = ['#FFD23F', '#E8E4DA', '#C98A4B'];

export default function Leaderboard() {
  const [scores, setScores] = useState<Score[]>([]);
  const [mode, setMode] = useState('');
  const [grade, setGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (mode) params.mode = mode;
    if (grade) params.grade = grade;

    setLoading(true);
    setError(null);

    const controller = new AbortController();

    api
      .get('/api/scores/leaderboard', { params, signal: controller.signal })
      .then((r) => setScores(r.data))
      .catch((err) => {
        if (
          err?.name === 'CanceledError' ||
          err?.code === 'ERR_CANCELED' ||
          controller.signal.aborted
        ) {
          return;
        }
        setError(err?.response?.data?.error || 'Gagal memuat leaderboard');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [mode, grade]);

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <PageTitle
          kicker="Papan Peringkat"
          title="Leaderboard"
          right={
            <div className="flex gap-2">
              <Link to="/" data-testid="link-home" className="btn-ink bg-cloud px-3 py-2 text-sm">
                Home
              </Link>
              <Link
                to="/topics"
                data-testid="link-topics"
                className="btn-ink bg-pulse px-3 py-2 text-sm"
              >
                Topik
              </Link>
            </div>
          }
        />

        {/* Filter bar — label plates + block inversion selects. */}
        <div className="mb-6 flex flex-wrap gap-3">
          <select
            aria-label="Filter mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="input-ink w-auto cursor-pointer font-bold uppercase"
          >
            <option value="">Semua mode</option>
            <option value="topic">Topik</option>
            <option value="challenge">Tantangan</option>
            <option value="campaign">Campaign</option>
          </select>
          <select
            aria-label="Filter kelas"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="input-ink w-auto cursor-pointer font-bold uppercase"
          >
            <option value="">Semua kelas</option>
            <option value="7">Kelas 7</option>
            <option value="8">Kelas 8</option>
            <option value="9">Kelas 9</option>
          </select>
        </div>

        {error && (
          <Notice tone="error" className="mb-4">
            {error}
          </Notice>
        )}

        {/* The board — split-flap donation: rows are ranked entries, tabular figures. */}
        <div className="overflow-x-auto border-3 border-ink bg-ink shadow-pop-lg">
          <div className="flex min-w-full items-center justify-between border-b-3 border-ink bg-cloud px-4 py-2">
            <span className="font-display text-xs uppercase tracking-[0.2em] sm:text-sm">
              Top {Math.min(50, Math.max(scores.length, 1))} Skor
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
              <span
                aria-hidden
                className={`inline-block h-2.5 w-2.5 ${loading ? 'animate-blink bg-pulse' : 'bg-mint'}`}
              />
              {loading ? 'Memuat' : 'Live'}
            </span>
          </div>

          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="bg-sun">
                <th
                  scope="col"
                  className="w-12 border-b-3 border-ink px-2 py-2 font-display text-xs uppercase tracking-[0.15em] sm:w-16 sm:px-4"
                >
                  Rank
                </th>
                <th
                  scope="col"
                  className="border-b-3 border-ink px-2 py-2 font-display text-xs uppercase tracking-[0.15em] sm:px-4"
                >
                  Nama
                </th>
                <th
                  scope="col"
                  className="w-14 border-b-3 border-ink px-2 py-2 text-right font-display text-xs uppercase tracking-[0.15em] sm:w-20 sm:px-4 sm:text-left"
                >
                  Kelas
                </th>
                <th
                  scope="col"
                  className="w-14 border-b-3 border-ink px-2 py-2 font-display text-xs uppercase tracking-[0.15em] sm:w-24 sm:px-4"
                >
                  Skor
                </th>
                <th
                  scope="col"
                  className="w-12 border-b-3 border-ink px-2 py-2 font-display text-xs uppercase tracking-[0.15em] sm:w-16 sm:px-4"
                >
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && scores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6">
                    <span className="flex items-center gap-3 text-cloud">
                      <span aria-hidden className="h-4 w-4 animate-blink bg-pulse" />
                      <span className="font-display uppercase tracking-wide">Mengambil data…</span>
                    </span>
                  </td>
                </tr>
              ) : scores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <p className="font-display text-xl uppercase text-cloud">Belum ada data skor</p>
                    <p className="mt-1 text-sm font-semibold text-cloud/70">
                      Jadilah yang pertama masuk papan!
                    </p>
                  </td>
                </tr>
              ) : (
                scores.map((s, i) => {
                  const rank = i + 1;
                  const podium = rank <= 3;
                  const bronze = rank === 3;
                  const name = s.student_name ?? s.studentName;
                  const points = s.total_points ?? s.totalPoints;
                  return (
                    <tr
                      key={s.id}
                      className={podium ? '' : i % 2 === 1 ? 'bg-ink/60' : ''}
                      style={podium ? { background: PODIUM_TONE[i], color: '#111111' } : undefined}
                    >
                      <th
                        scope="row"
                        className={`w-12 px-2 py-2.5 font-display text-lg tabular-nums sm:w-14 sm:px-4 ${
                          podium ? '' : 'text-sun'
                        }`}
                      >
                        {rank}
                      </th>
                      <td className={`min-w-0 truncate px-2 py-2.5 sm:px-4 ${podium ? '' : 'text-cloud'}`}>
                        <span className="block truncate font-display text-xs uppercase leading-tight sm:text-base">
                          {name}
                        </span>
                      </td>
                      <td
                        className={`whitespace-nowrap px-2 py-2.5 text-right text-xs font-bold uppercase tracking-widest tabular-nums sm:px-4 sm:text-left ${
                          bronze ? '' : podium ? 'opacity-70' : 'text-cloud/60'
                        }`}
                      >
                        {s.grade}
                      </td>
                      <td
                        className={`whitespace-nowrap px-2 py-2.5 font-display text-base tabular-nums sm:px-4 sm:text-lg ${
                          podium ? '' : 'text-cloud'
                        }`}
                      >
                        {points}
                      </td>
                      <td
                        className={`whitespace-nowrap px-2 py-2.5 text-xs font-bold tabular-nums sm:px-4 sm:text-sm ${
                          bronze ? '' : podium ? 'opacity-70' : 'text-cloud/60'
                        }`}
                      >
                        {s.percentage}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <HazardBand className="my-8" />

        <Link
          to="/"
          className="font-bold uppercase tracking-wide underline decoration-3 underline-offset-4 hover:bg-sun"
        >
          ← Halaman Utama
        </Link>
      </div>
    </div>
  );
}
