import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAdminStore } from '../stores/useAdminStore';
import type { Topic } from '../types';

export default function AdminTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<7 | 8 | 9>(7);
  const [error, setError] = useState('');
  const token = useAdminStore((s) => s.token);
  const navigate = useNavigate();

  const load = () => {
    if (!token) return;
    return api
      .get('/api/admin/topics', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setTopics(r.data))
      .catch(() => setError('Gagal memuat topik'));
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    load();
  }, [token, navigate]);

  if (!token) return null;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(
        '/api/admin/topics',
        { name, grade },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setName('');
      load();
    } catch (err: any) {
      setError(err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Gagal tambah topik');
    }
  };

  const del = async (id: number) => {
    setError('');
    try {
      await api.delete(`/api/admin/topics/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      load();
    } catch (err: any) {
      setError('Gagal hapus topik');
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Kelola Topik</h1>
        <Link to="/admin/questions" className="bg-gray-700 text-white px-4 py-2 rounded">
          Kelola Soal
        </Link>
      </div>
      <form onSubmit={add} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama topik"
          className="flex-1 p-2 border rounded"
        />
        <select
          value={grade}
          onChange={(e) => setGrade(Number(e.target.value) as 7 | 8 | 9)}
          className="p-2 border rounded"
        >
          <option value={7}>Kelas 7</option>
          <option value={8}>Kelas 8</option>
          <option value={9}>Kelas 9</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Tambah
        </button>
      </form>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="space-y-2">
        {topics.map((t) => (
          <div key={t.id} className="flex justify-between items-center bg-white p-3 rounded shadow">
            <span>
              {t.name} (Kelas {t.grade})
            </span>
            <button onClick={() => del(t.id)} className="text-red-600 hover:text-red-800">
              Hapus
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
