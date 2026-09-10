import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useQuizStore } from '../stores/useQuizStore';

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

  return (
    <div className="min-h-screen p-8 bg-purple-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Mode Tantangan</h1>
        <p className="text-sm text-gray-600 mb-4">
          Selesaikan kuis secepat mungkin sebelum waktu habis!
        </p>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <label htmlFor="question-count-select" className="block mb-2 font-medium text-gray-700">
          Jumlah soal:
        </label>
        <select
          id="question-count-select"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          disabled={loading}
          className="w-full p-3 border rounded-lg mb-6 focus:ring-2 focus:ring-purple-500"
        >
          <option value={5}>5 soal</option>
          <option value={10}>10 soal</option>
          <option value={15}>15 soal</option>
        </select>

        <button
          type="button"
          onClick={start}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
        >
          {loading ? 'Memuat...' : 'Mulai Tantangan'}
        </button>

        <div className="mt-4 text-center">
          <Link to="/topics" className="text-sm text-purple-600 hover:underline">
            Kembali ke Pilih Topik
          </Link>
        </div>
      </div>
    </div>
  );
}
