import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export interface SessionResultAnswer {
  id: number;
  prompt: string;
  is_correct: boolean | number;
  points_earned: number;
}

export interface SessionResultScore {
  percentage: number;
  total_points: number;
  max_points: number;
}

export interface SessionResultData {
  score: SessionResultScore;
  answers: SessionResultAnswer[];
}

export default function Result() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<SessionResultData | null>(null);

  useEffect(() => {
    api.get(`/api/sessions/${sessionId}/result`).then((r) => setData(r.data));
  }, [sessionId]);

  if (!data) return <div className="p-8">Memuat hasil...</div>;
  const s = data.score;
  return (
    <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full">
        <h1 className="text-3xl font-bold text-center mb-4">Hasil Kuis</h1>
        <div className="text-center mb-6">
          <p className="text-5xl font-bold text-blue-600">{s.percentage}%</p>
          <p className="text-gray-600 mt-2">Skor: {s.total_points} / {s.max_points}</p>
        </div>
        <div className="space-y-2 mb-6">
          {data.answers.map((a) => (
            <div key={a.id} className={`p-3 rounded-lg ${a.is_correct ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm font-medium">{a.prompt}</p>
              <p className="text-xs">{a.is_correct ? 'Benar' : 'Salah'} — +{a.points_earned} poin</p>
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/topics')} className="flex-1 py-3 bg-blue-600 text-white rounded-lg">Kuis Lagi</button>
          <button onClick={() => navigate('/leaderboard')} className="flex-1 py-3 bg-gray-700 text-white rounded-lg">Leaderboard</button>
        </div>
      </div>
    </div>
  );
}
