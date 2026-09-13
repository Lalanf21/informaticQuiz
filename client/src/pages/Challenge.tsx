import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useQuizStore } from '../stores/useQuizStore';
import { HazardBand, Notice, PageTitle } from '../components/ui';

export default function Challenge() {
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const player = usePlayerStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!player.name) {
      navigate('/');
    }
  }, [player.name, navigate]);

  if (!player.name) {
    return null;
  }

  const start = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/sessions', {
        studentName: player.name,
        grade: player.grade,
        mode: 'challenge',
        count,
      });
      player.setSessionId(res.data.sessionId);
      useQuizStore.setState({ mode: 'challenge' });
      navigate(`/quiz/${res.data.sessionId}`, { state: { mode: 'challenge' } });
    } catch (err) {
      console.error('Failed to start challenge session:', err);
      setError('Gagal memulai tantangan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  const seconds = Math.min(count * 60, 600);

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <PageTitle
          kicker="Mode"
          title="Mode Tantangan"
          right={
            <span className="border-3 border-ink bg-pulse px-3 py-1.5 font-display text-sm uppercase shadow-pop-sm">
              Timer Nyala
            </span>
          }
        />

        <div className="mb-6 border-3 border-ink bg-pulse p-5 shadow-pop-lg sm:p-7">
          <p className="max-w-lg font-semibold leading-snug">
            Soal acak dari semua topikmu. Waktu habis, jawaban otomatis terkumpul. Makin cepat, makin
            seru.
          </p>
        </div>

        {error && (
          <Notice tone="error" className="mb-5">
            {error}
          </Notice>
        )}

        <fieldset disabled={loading} className="panel p-5 sm:p-6">
          <legend className="label-plate pl-4 pr-4 text-[11px] font-bold uppercase tracking-[0.2em]">
            Jumlah Soal
          </legend>
          <div className="mt-2 flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="question-count-select" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
                Jumlah soal:
              </label>
              <select
                id="question-count-select"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="input-ink w-auto cursor-pointer font-bold uppercase"
              >
                <option value={5}>5 soal</option>
                <option value={10}>10 soal</option>
                <option value={15}>15 soal</option>
              </select>
            </div>
            <span aria-hidden className="hidden flex-1 border-t-3 border-dashed border-ink/30 sm:block" />
            <div className="flex items-center gap-3 border-3 border-ink bg-paper-2 px-4 py-3 shadow-pop-sm">
              <span aria-hidden className="font-display text-2xl text-pulse">
                ◷
              </span>
              <p className="font-bold uppercase tracking-wide">
                Timer: {Math.floor(seconds / 60)} menit {seconds % 60 ? `${seconds % 60} detik` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={start}
            disabled={loading}
            className="btn-ink mt-6 w-full bg-pulse py-4 text-xl"
          >
            {loading ? 'Memuat...' : 'Mulai Tantangan'}
          </button>
        </fieldset>

        <HazardBand className="my-8" />

        <Link
          to="/topics"
          className="font-bold uppercase tracking-wide underline decoration-3 underline-offset-4 hover:bg-sun"
        >
          Kembali ke Pilih Topik
        </Link>
      </div>
    </div>
  );
}
