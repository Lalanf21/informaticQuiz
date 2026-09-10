import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useQuizStore } from '../stores/useQuizStore';
import type { Topic } from '../types';

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
        setError('Gagal memuat topik');
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
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Halo, {player.name}! Pilih topik:</h1>

      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {isLoadingTopics ? (
        <p className="text-gray-500">Memuat topik...</p>
      ) : topics.length === 0 ? (
        <p className="text-gray-500">Tidak ada topik tersedia.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topics.map((t) => {
            const isThisStarting = startingTopicId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => startQuiz(t.id)}
                disabled={startingTopicId !== null}
                className={`bg-white p-6 rounded-xl shadow transition text-left ${
                  startingTopicId !== null ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg'
                }`}
              >
                <h2 className="text-lg font-semibold">
                  {t.name}
                  {isThisStarting ? ' (Memuat...)' : ''}
                </h2>
                <p className="text-sm text-gray-500">Kelas {t.grade}</p>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-4">
        <button
          onClick={() => navigate('/challenge')}
          className="bg-purple-600 hover:bg-purple-700 transition text-white px-6 py-3 rounded-lg"
        >
          Mode Tantangan
        </button>
        <button
          onClick={() => navigate('/campaign')}
          className="bg-emerald-600 hover:bg-emerald-700 transition text-white px-6 py-3 rounded-lg"
        >
          Mode Campaign
        </button>
        <button
          onClick={() => navigate('/leaderboard')}
          className="bg-gray-700 hover:bg-gray-800 transition text-white px-6 py-3 rounded-lg"
        >
          Leaderboard
        </button>
      </div>
    </div>
  );
}
