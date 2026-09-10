import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useQuizStore } from '../stores/useQuizStore';

export default function CampaignLevel() {
  const { topicId, n } = useParams();
  const player = usePlayerStore();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!player.name) {
      navigate('/');
      return;
    }

    api
      .post('/api/sessions', {
        studentName: player.name,
        grade: player.grade,
        mode: 'campaign',
        topicId: Number(topicId),
        level: Number(n),
      })
      .then((r) => {
        const id = r.data.sessionId;
        setSessionId(id);
        player.setSessionId(id);
        useQuizStore.setState({ mode: 'campaign' });
      })
      .catch((err) => {
        console.error('Failed to start campaign level', err);
        setError(err.response?.data?.error || 'Gagal memulai level campaign.');
      });
  }, [topicId, n, player.name, player.grade, navigate]);

  useEffect(() => {
    if (sessionId) {
      navigate(`/quiz/${sessionId}`);
    }
  }, [sessionId, navigate]);

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/campaign')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Kembali ke Campaign
          </button>
        </div>
      </div>
    );
  }

  return <div className="p-8">Memuat level...</div>;
}
