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
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="w-full max-w-lg border-3 border-ink bg-blood p-7 text-center text-cloud shadow-pop-lg">
          <p className="font-display text-2xl uppercase">Hasil Tidak Ditemukan</p>
          <p className="mt-2 font-semibold">{error}</p>
          <button onClick={() => navigate('/topics')} className="btn-ink mt-5 bg-cloud">
            Kembali ke Topik
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="panel w-full max-w-md animate-panel-in p-6 text-center">
          <span className="mx-auto mb-3 block h-5 w-5 animate-blink bg-pulse" aria-hidden />
          <p className="font-display text-2xl uppercase">Memuat hasil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-paper px-4 py-8 sm:py-12">
      <ResultScreen
        data={data}
        onPlayAgain={() => navigate('/topics')}
        onLeaderboard={() => navigate('/leaderboard')}
        onCampaign={() => navigate('/campaign')}
      />
    </div>
  );
}
