import React from 'react';

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
  mode?: string;
  topic_id?: number | null;
}

export interface SessionResultData {
  score: SessionResultScore;
  answers: SessionResultAnswer[];
  level?: number | null;
  topicId?: number | null;
}

export interface ResultScreenProps {
  data: SessionResultData;
  onPlayAgain: () => void;
  onLeaderboard: () => void;
  onCampaign?: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  data,
  onPlayAgain,
  onLeaderboard,
  onCampaign,
}) => {
  const s = data.score;
  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full">
      <h1 className="text-3xl font-bold text-center mb-4">Hasil Kuis</h1>
      <div className="text-center mb-6">
        <p className="text-5xl font-bold text-blue-600">{s.percentage}%</p>
        <p className="text-gray-600 mt-2">
          Skor: {s.total_points} / {s.max_points}
        </p>
      </div>
      {s.mode === 'campaign' && s.percentage >= 70 && (
        <div className="mb-6 p-3 bg-green-100 text-green-800 rounded-lg text-center font-medium">
          {data.level === 3
            ? 'Selamat! Kamu telah menuntaskan semua level di topik ini!'
            : 'Selamat! Kamu berhasil membuka level berikutnya!'}
        </div>
      )}
      <div className="space-y-2 mb-6">
        {data.answers.map((a) => (
          <div
            key={a.id}
            className={`p-3 rounded-lg ${a.is_correct ? 'bg-green-50' : 'bg-red-50'}`}
          >
            <p className="text-sm font-medium">{a.prompt}</p>
            <p className="text-xs">
              {a.is_correct ? 'Benar' : 'Salah'} — +{a.points_earned} poin
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {s.mode === 'campaign' && onCampaign && (
          <button
            onClick={onCampaign}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
          >
            Mode Campaign
          </button>
        )}
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg"
        >
          Kuis Lagi
        </button>
        <button
          onClick={onLeaderboard}
          className="flex-1 py-3 bg-gray-700 text-white rounded-lg"
        >
          Leaderboard
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;
