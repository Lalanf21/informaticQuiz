import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function Home() {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<7 | 8 | 9 | ''>('');
  const setPlayer = usePlayerStore((s) => s.setPlayer);
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || grade === '') return;
    setPlayer(name.trim(), grade as 7 | 8 | 9);
    navigate('/topics');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <form onSubmit={submit} className="bg-white p-8 rounded-2xl shadow-xl w-96">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">InformaticQuiz</h1>
        <label htmlFor="name-input" className="block mb-2 text-sm font-medium text-gray-700">
          Nama
        </label>
        <input
          id="name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 mb-4 border rounded-lg"
          placeholder="Nama lengkap"
        />
        <label htmlFor="grade-select" className="block mb-2 text-sm font-medium text-gray-700">
          Kelas
        </label>
        <select
          id="grade-select"
          value={grade}
          onChange={(e) => {
            const val = e.target.value;
            setGrade(val === '' ? '' : (Number(val) as 7 | 8 | 9));
          }}
          className="w-full p-3 mb-6 border rounded-lg"
        >
          <option value="">Pilih kelas</option>
          <option value={7}>Kelas 7</option>
          <option value={8}>Kelas 8</option>
          <option value={9}>Kelas 9</option>
        </select>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Mulai
        </button>
        <Link
          to="/leaderboard"
          className="block text-center mt-4 text-sm text-blue-600 hover:underline"
        >
          Lihat Leaderboard
        </Link>
      </form>
    </div>
  );
}
