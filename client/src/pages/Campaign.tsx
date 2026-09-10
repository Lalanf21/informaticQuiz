import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { usePlayerStore } from '../stores/usePlayerStore';
import type { Topic } from '../types';

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
        setError('Gagal memuat topik');
      })
      .finally(() => setLoading(false));
  }, [player.name, player.grade, navigate]);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mode Campaign</h1>
          <button
            onClick={() => navigate('/topics')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
          >
            Kembali ke Topik
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Memuat topik...</p>
        ) : topics.length === 0 ? (
          <p className="text-gray-500">Tidak ada topik tersedia.</p>
        ) : (
          topics.map((t) => {
            const unlocked = getProgress(t.id);
            return (
              <div key={t.id} className="mb-6 bg-white p-6 rounded-xl shadow">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">{t.name}</h2>
                {t.description && (
                  <p className="text-sm text-gray-500 mb-4">{t.description}</p>
                )}
                <div className="flex gap-3">
                  {[1, 2, 3].map((lvl) => {
                    const isUnlocked = lvl <= unlocked;
                    return (
                      <button
                        key={lvl}
                        disabled={!isUnlocked}
                        onClick={() => navigate(`/campaign/${t.id}/${lvl}`)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          isUnlocked
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Level {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
