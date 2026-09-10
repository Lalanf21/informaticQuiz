import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { usePlayerStore } from '../stores/usePlayerStore';
import type { Topic } from '../types';

export default function Topics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const player = usePlayerStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!player.name) {
      navigate('/');
      return;
    }
    api
      .get('/api/topics', { params: { grade: player.grade } })
      .then((r) => setTopics(r.data))
      .catch(() => {});
  }, [player.name, player.grade, navigate]);

  const startQuiz = async (topicId: number) => {
    const res = await api.post('/api/sessions', {
      studentName: player.name,
      grade: player.grade,
      mode: 'topic',
      topicId,
    });
    player.setSessionId(res.data.sessionId);
    navigate(`/quiz/${res.data.sessionId}`);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Halo, {player.name}! Pilih topik:</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topics.map((t) => (
          <button
            key={t.id}
            onClick={() => startQuiz(t.id)}
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition text-left"
          >
            <h2 className="text-lg font-semibold">{t.name}</h2>
            <p className="text-sm text-gray-500">Kelas {t.grade}</p>
          </button>
        ))}
      </div>
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
