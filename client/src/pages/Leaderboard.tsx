import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Score } from '../types';

export default function Leaderboard() {
  const [scores, setScores] = useState<Score[]>([]);
  const [mode, setMode] = useState('');
  const [grade, setGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (mode) params.mode = mode;
    if (grade) params.grade = grade;

    setLoading(true);
    setError(null);

    const controller = new AbortController();

    api
      .get('/api/scores/leaderboard', { params, signal: controller.signal })
      .then((r) => setScores(r.data))
      .catch((err) => {
        if (
          err?.name === 'CanceledError' ||
          err?.code === 'ERR_CANCELED' ||
          controller.signal.aborted
        ) {
          return;
        }
        setError(err?.response?.data?.error || 'Gagal memuat leaderboard');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [mode, grade]);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Leaderboard</h1>
          <div className="flex gap-2">
            <Link
              to="/"
              data-testid="link-home"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition text-sm font-medium"
            >
              Home
            </Link>
            <Link
              to="/topics"
              data-testid="link-topics"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
            >
              Topik
            </Link>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <select
            aria-label="Filter mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="p-2 border rounded bg-white"
          >
            <option value="">Semua mode</option>
            <option value="topic">Topik</option>
            <option value="challenge">Tantangan</option>
            <option value="campaign">Campaign</option>
          </select>
          <select
            aria-label="Filter kelas"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="p-2 border rounded bg-white"
          >
            <option value="">Semua kelas</option>
            <option value="7">Kelas 7</option>
            <option value="8">Kelas 8</option>
            <option value="9">Kelas 9</option>
          </select>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <table className="w-full bg-white rounded-xl shadow overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Rank</th>
              <th className="p-3 text-left">Nama</th>
              <th className="p-3 text-left">Kelas</th>
              <th className="p-3 text-left">Skor</th>
              <th className="p-3 text-left">%</th>
            </tr>
          </thead>
          <tbody>
            {loading && scores.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Memuat leaderboard...
                </td>
              </tr>
            ) : scores.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Belum ada data skor
                </td>
              </tr>
            ) : (
              scores.map((s, i) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3">{i + 1}</td>
                  <td className="p-3">{s.student_name ?? s.studentName}</td>
                  <td className="p-3">{s.grade}</td>
                  <td className="p-3">{s.total_points ?? s.totalPoints}</td>
                  <td className="p-3">{s.percentage}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
