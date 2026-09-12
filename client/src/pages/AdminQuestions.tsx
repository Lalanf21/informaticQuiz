import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAdminStore } from '../stores/useAdminStore';
import type { Topic } from '../types';

const DEFAULT_JSON_TEMPLATES: Record<'pg' | 'tf' | 'matching' | 'ordering', string> = {
  pg: '{"options":["A","B","C","D"],"correctIndex":0}',
  tf: '{"correctAnswer":true}',
  matching:
    '{"pairs":[{"left":"Istilah 1","right":"Definisi 1"},{"left":"Istilah 2","right":"Definisi 2"}]}',
  ordering: '{"correctOrder":["Langkah 1","Langkah 2","Langkah 3"]}',
};

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [form, setForm] = useState({
    topicId: 0,
    type: 'pg' as 'pg' | 'tf' | 'matching' | 'ordering',
    prompt: '',
    dataStr: DEFAULT_JSON_TEMPLATES.pg,
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    points: 10,
  });
  const [error, setError] = useState('');
  const token = useAdminStore((s) => s.token);
  const navigate = useNavigate();

  const load = async () => {
    if (!token) return;
    try {
      const [q, t] = await Promise.all([
        api.get('/api/admin/questions', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/admin/topics', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setQuestions(q.data);
      setTopics(t.data);
      setForm((f) => ({ ...f, topicId: f.topicId || t.data[0]?.id || 0 }));
    } catch {
      setError('Gagal memuat data soal');
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    load();
  }, [token, navigate]);

  if (!token) return null;

  const handleTypeChange = (newType: 'pg' | 'tf' | 'matching' | 'ordering') => {
    const currentTemplates = Object.values(DEFAULT_JSON_TEMPLATES);
    const isTemplateOrEmpty = form.dataStr === '' || currentTemplates.includes(form.dataStr);
    setForm((prev) => ({
      ...prev,
      type: newType,
      dataStr: isTemplateOrEmpty ? DEFAULT_JSON_TEMPLATES[newType] : prev.dataStr,
    }));
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topics.length === 0) return;
    setError('');
    let data: any;
    try {
      data = JSON.parse(form.dataStr);
    } catch {
      setError('Data JSON invalid');
      return;
    }
    try {
      const { dataStr: _dataStr, ...payload } = form;
      await api.post(
        '/api/admin/questions',
        { ...payload, data },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setForm((f) => ({ ...f, prompt: '', dataStr: DEFAULT_JSON_TEMPLATES[f.type] }));
      load();
    } catch (err: any) {
      setError(
        err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Gagal simpan',
      );
    }
  };

  const del = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus?')) return;
    setError('');
    try {
      await api.delete(`/api/admin/questions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      load();
    } catch {
      setError('Gagal hapus soal');
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Kelola Soal</h1>
        <Link to="/admin/topics" className="bg-gray-700 text-white px-4 py-2 rounded">
          Kelola Topik
        </Link>
      </div>
      <form onSubmit={add} className="bg-white p-4 rounded shadow mb-6 space-y-2">
        <h2 className="font-semibold">Tambah Soal</h2>
        {topics.length === 0 && (
          <p className="text-amber-600 text-sm">Silakan buat topik terlebih dahulu</p>
        )}
        <select
          aria-label="Pilih Topik"
          value={form.topicId}
          onChange={(e) => setForm({ ...form, topicId: Number(e.target.value) })}
          className="w-full p-2 border rounded"
        >
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Tipe Soal"
          value={form.type}
          onChange={(e) => handleTypeChange(e.target.value as any)}
          className="w-full p-2 border rounded"
        >
          <option value="pg">Pilihan Ganda</option>
          <option value="tf">True/False</option>
          <option value="matching">Matching</option>
          <option value="ordering">Ordering</option>
        </select>
        <input
          value={form.prompt}
          onChange={(e) => setForm({ ...form, prompt: e.target.value })}
          placeholder="Prompt soal"
          className="w-full p-2 border rounded"
        />
        <textarea
          value={form.dataStr}
          onChange={(e) => setForm({ ...form, dataStr: e.target.value })}
          placeholder={`JSON data, e.g. ${DEFAULT_JSON_TEMPLATES[form.type]}`}
          className="w-full p-2 border rounded h-24"
        />
        <select
          aria-label="Tingkat Kesulitan"
          value={form.difficulty}
          onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })}
          className="w-full p-2 border rounded"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <input
          type="number"
          aria-label="Poin"
          value={form.points}
          onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
          className="w-full p-2 border rounded"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={topics.length === 0}
          className={`px-4 py-2 rounded text-white ${
            topics.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600'
          }`}
        >
          Simpan
        </button>
      </form>
      <div className="space-y-2">
        {questions.map((q) => (
          <div key={q.id} className="flex justify-between items-center bg-white p-3 rounded shadow">
            <span>
              [{q.type}] {q.prompt}
            </span>
            <button onClick={() => del(q.id)} className="text-red-600 hover:text-red-800">
              Hapus
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
