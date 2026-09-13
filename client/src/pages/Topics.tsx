import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useQuizStore } from '../stores/useQuizStore';
import type { Topic } from '../types';
import { HazardBand, LoadingPanel, Notice, PageTitle } from '../components/ui';

const TOPIC_TONES = ['#2F6BFF', '#FFD23F', '#12B886', '#FF4D2E', '#111111'];

export default function Topics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [startingTopicId, setStartingTopicId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const player = usePlayerStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!player.name) {
      navigate('/');
      return;
    }
    setIsLoadingTopics(true);
    api
      .get('/api/topics', { params: { grade: player.grade } })
      .then((r) => setTopics(r.data))
      .catch((err) => {
        console.error('Failed to load topics', err);
        setError('Gagal memuat topik.');
      })
      .finally(() => setIsLoadingTopics(false));
  }, [player.name, player.grade, navigate]);

  const startQuiz = async (topicId: number) => {
    if (startingTopicId !== null) return;
    setStartingTopicId(topicId);
    setError(null);

    try {
      const res = await api.post('/api/sessions', {
        studentName: player.name,
        grade: player.grade,
        mode: 'topic',
        topicId,
      });
      player.setSessionId(res.data.sessionId);
      useQuizStore.setState({ mode: 'topic' });
      navigate(`/quiz/${res.data.sessionId}`);
    } catch (err) {
      console.error('Failed to start quiz session', err);
      setError('Gagal memulai kuis. Silakan coba lagi.');
      setStartingTopicId(null);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <PageTitle
          kicker={`Halo, ${player.name || 'Siswa'} · Kelas ${player.grade ?? '-'}`}
          title="Pilih Topikmu"
          right={
            <span className="border-3 border-ink bg-mint px-3 py-1.5 font-display text-sm uppercase shadow-pop-sm">
              Mode Latihan
            </span>
          }
        />

        {error && (
          <Notice tone="error" className="mb-4">
            {error}
          </Notice>
        )}

        {isLoadingTopics ? (
          <LoadingPanel label="Memuat topik" />
        ) : topics.length === 0 ? (
          <div className="border-3 border-dashed border-ink bg-paper-2 p-8 text-center shadow-pop">
            <p className="font-display text-2xl">Belum ada topik</p>
            <p className="mt-2 font-semibold text-ash">
              Guru belum menambahkan soal untuk kelas {player.grade}. Coba mode Tantangan dulu.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t, i) => {
              const starting = startingTopicId === t.id;
              const busy = startingTopicId !== null;
              const tone = TOPIC_TONES[i % TOPIC_TONES.length];
              return (
                <button
                  key={t.id}
                  onClick={() => startQuiz(t.id)}
                  disabled={busy}
                  className={`group relative border-3 border-ink text-left shadow-pop transition-transform duration-75 ${
                    busy ? 'cursor-not-allowed opacity-60' : 'hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-pop-lg'
                  }`}
                >
                  <span
                    aria-hidden
                    className="block h-20 border-b-3 border-ink"
                    style={{ background: tone }}
                  />
                  <span className="absolute right-3 top-3 border-3 border-ink bg-cloud px-2 py-0.5 font-display text-xs uppercase">
                    Kelas {t.grade}
                  </span>
                  <span className="block bg-cloud p-4">
                    <h2 className="font-display text-lg leading-tight">
                      {starting ? 'Menyiapkan…' : t.name}
                    </h2>
                    <span className="mt-2 flex items-center gap-2 font-bold uppercase tracking-wide text-ash">
                      <span className="text-ink">Mulai</span>
                      <span aria-hidden className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <HazardBand className="my-8" />

        <div className="flex flex-wrap gap-4">
          <button onClick={() => navigate('/challenge')} className="btn-ink bg-pulse">
            Mode Tantangan
          </button>
          <button onClick={() => navigate('/campaign')} className="btn-ink bg-sun">
            Mode Campaign
          </button>
          <button onClick={() => navigate('/leaderboard')} className="btn-ink bg-cloud">
            Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
