import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { setProgress } from './Campaign';
import ResultScreen, {
  SessionResultAnswer,
  SessionResultScore,
  SessionResultData,
} from '../components/ResultScreen';

export type { SessionResultAnswer, SessionResultScore, SessionResultData };

export default function Result() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<SessionResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/api/sessions/${sessionId}/result`)
      .then((r) => {
        const resData: SessionResultData = r.data;
        setData(resData);

        if (
          resData?.score?.mode === 'campaign' &&
          resData.score.percentage >= 70 &&
          resData.level
        ) {
          const topicId = resData.topicId ?? resData.score.topic_id;
          if (topicId) {
            setProgress(topicId, resData.level);
          }
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Gagal memuat hasil kuis.');
      });
  }, [sessionId]);

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/topics')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Kembali ke Topik
          </button>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-8">Memuat hasil...</div>;

  return (
    <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
      <ResultScreen
        data={data}
        onPlayAgain={() => navigate('/topics')}
        onLeaderboard={() => navigate('/leaderboard')}
        onCampaign={() => navigate('/campaign')}
      />
    </div>
  );
}
