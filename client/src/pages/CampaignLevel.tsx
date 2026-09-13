import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useQuizStore } from '../stores/useQuizStore';
import { getProgress } from './Campaign';


const LEVEL_LABEL = ['Easy', 'Medium', 'Hard'];
const LEVEL_TONE = ['#12B886', '#FFD23F', '#FF4D2E'];

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

    const tId = Number(topicId);
    const levelNum = Number(n);
    if (![1, 2, 3].includes(levelNum) || levelNum > getProgress(tId)) {
      navigate('/campaign');
      return;
    }

    api
      .post('/api/sessions', {
        studentName: player.name,
        grade: player.grade,
        mode: 'campaign',
        topicId: tId,
        level: levelNum,
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

  const levelNum = Number(n);

  if (error) {
    const code = error === 'NO_QUESTIONS' ? 'BELUM ADA SOAL' : 'TIDAK BISA DIMULAI';
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="w-full max-w-lg border-3 border-ink bg-blood p-7 text-center shadow-pop-lg">
          <p className="font-display text-2xl uppercase text-cloud">{code}</p>
          <p className="mt-2 font-semibold text-cloud">
            Level ini belum punya soal yang cocok. Coba level lain atau pilih topik berbeda.
          </p>
          <button onClick={() => navigate('/campaign')} className="btn-ink mt-5 bg-cloud">
            ← Kembali ke Campaign
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-lg">
        <div className="border-3 border-ink bg-cloud p-7 text-center shadow-pop-lg">
          <span
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center border-3 border-ink font-display text-4xl shadow-pop-sm"
            style={{ background: LEVEL_TONE[levelNum - 1] ?? '#FFD23F' }}
          >
            {levelNum}
          </span>
          <p className="font-display text-3xl uppercase">
            Level {levelNum} · {LEVEL_LABEL[levelNum - 1] ?? ''}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <span className="inline-block h-4 w-4 animate-blink bg-pulse" aria-hidden />
            <p className="font-semibold uppercase tracking-wide">Memuat level...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
