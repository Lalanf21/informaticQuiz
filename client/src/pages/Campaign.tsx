import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { usePlayerStore } from '../stores/usePlayerStore';
import type { Topic } from '../types';
import { HazardBand, LoadingPanel, Notice, PageTitle } from '../components/ui';

const STORAGE_KEY = 'campaign-progress';

export function getProgress(topicId: number): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return Number(data[topicId]) || 1;
  } catch {
    return 1;
  }
}

export function setProgress(topicId: number, level: number) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const current = Number(data[topicId]) || 1;
    if (level >= current) {
      data[topicId] = level + 1;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore json parse/localStorage error
  }
}

const LEVEL_LABEL = ['Easy', 'Medium', 'Hard'];
const LEVEL_TONE = ['#12B886', '#FFD23F', '#FF4D2E'];

export default function Campaign() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const player = usePlayerStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!player.name) {
      navigate('/');
      return;
    }
    setLoading(true);
    api
      .get('/api/topics', { params: { grade: player.grade } })
      .then((r) => setTopics(r.data))
      .catch((err) => {
        console.error('Failed to load campaign topics', err);
        setError('Gagal memuat topik.');
      })
      .finally(() => setLoading(false));
  }, [player.name, player.grade, navigate]);

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        <PageTitle
          kicker={`Peta Level · Kelas ${player.grade ?? '-'}`}
          title="Mode Campaign"
          right={
            <button onClick={() => navigate('/topics')} className="btn-ink bg-cloud">
              Kembali ke Topik
            </button>
          }
        />

        {error && (
          <Notice tone="error" className="mb-4">
            {error}
          </Notice>
        )}

        {loading ? (
          <LoadingPanel label="Memuat topik" />
        ) : topics.length === 0 ? (
          <div className="border-3 border-dashed border-ink bg-paper-2 p-8 text-center shadow-pop">
            <p className="font-display text-2xl">Tidak ada topik tersedia.</p>
            <p className="mt-2 font-semibold text-ash">
              Belum ada topik untuk kelas {player.grade}. Coba mode lain dulu.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {topics.map((t) => {
              const unlocked = getProgress(t.id);
              return (
                <section key={t.id} className="border-3 border-ink bg-cloud shadow-pop">
                  <header className="flex flex-wrap items-center justify-between gap-2 border-b-3 border-ink bg-volt px-4 py-3">
                    <h2 className="text-lg text-cloud">{t.name}</h2>
                    <span className="border-2 border-ink bg-cloud px-2 py-0.5 text-xs font-bold uppercase">
                      Level {Math.min(unlocked, 3)}/3 terbuka
                    </span>
                  </header>
                  <div className="grid grid-cols-3 divide-x-3 divide-ink">
                    {[1, 2, 3].map((lvl) => {
                      const isUnlocked = lvl <= unlocked;
                      const tone = LEVEL_TONE[lvl - 1];
                      return (
                        <button
                          key={lvl}
                          disabled={!isUnlocked}
                          onClick={() => navigate(`/campaign/${t.id}/${lvl}`)}
                          aria-label={`Level ${lvl}`}
                          className={`relative flex flex-col items-center gap-1 py-6 transition-transform duration-75 ${
                            isUnlocked
                              ? 'hover:-translate-y-0.5 hover:shadow-[inset_0_-4px_0_0_#111]'
                              : 'cursor-not-allowed'
                          }`}
                          style={isUnlocked ? { background: tone } : undefined}
                        >
                          <span
                            className={`flex h-12 w-12 items-center justify-center border-3 border-ink font-display text-3xl sm:text-4xl ${
                              isUnlocked ? '' : 'bg-paper-2 text-ash'
                            }`}
                          >
                            {isUnlocked ? lvl : '✕'}
                          </span>
                          <span
                            className={`text-xs font-bold uppercase tracking-widest ${
                              isUnlocked ? '' : 'text-ash'
                            }`}
                          >
                            Level {lvl} · {LEVEL_LABEL[lvl - 1]}
                          </span>
                          {!isUnlocked && (
                            <span
                              aria-hidden
                              className="absolute inset-0 opacity-15"
                              style={{
                                background:
                                  'repeating-linear-gradient(45deg, #111 0 8px, transparent 8px 16px)',
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <footer className="border-t-3 border-ink bg-paper-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ash">
                    Lulus ≥70% untuk membuka level berikutnya
                  </footer>
                </section>
              );
            })}
          </div>
        )}

        <HazardBand className="my-8" />
      </div>
    </div>
  );
}
