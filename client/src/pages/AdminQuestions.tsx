import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAdminStore } from '../stores/useAdminStore';
import type { Topic } from '../types';
import { Notice, PageTitle } from '../components/ui';

const DEFAULT_JSON_TEMPLATES: Record<'pg' | 'tf' | 'matching' | 'ordering', string> = {
  pg: '{"options":["A","B","C","D"],"correctIndex":0}',
  tf: '{"correctAnswer":true}',
  matching:
    '{"pairs":[{"left":"Istilah 1","right":"Definisi 1"},{"left":"Istilah 2","right":"Definisi 2"}]}',
  ordering: '{"correctOrder":["Langkah 1","Langkah 2","Langkah 3"]}',
};

const TYPE_TONE: Record<string, string> = {
  pg: '#2F6BFF',
  tf: '#12B886',
  matching: '#FFD23F',
  ordering: '#FF4D2E',
};
const DIFF_TONE: Record<string, string> = { easy: '#12B886', medium: '#FFD23F', hard: '#FF4D2E' };

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
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <PageTitle
          kicker="Panel Guru"
          title="Kelola Soal"
          right={
            <Link to="/admin/topics" className="btn-ink bg-volt px-3 py-2 text-sm">
              <span aria-hidden>→</span> Kelola Topik
            </Link>
          }
        />

        {topics.length === 0 && (
          <div
            role="status"
            className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 border-3 border-ink bg-volt px-3 py-2 font-semibold text-cloud shadow-pop-sm"
          >
            <span className="text-sm">
              Silakan buat topik terlebih dahulu
            </span>
            <span className="text-sm">di halaman Kelola Topik.</span>
          </div>
        )}

        {/* Add form — workbench. */}
        <form onSubmit={add} className="panel mb-6 p-5">
          <h2 className="mb-4 text-lg">Tambah Soal</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="q-topic" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
                Topik
              </label>
              <select
                id="q-topic"
                aria-label="Pilih Topik"
                value={form.topicId}
                onChange={(e) => setForm({ ...form, topicId: Number(e.target.value) })}
                className="input-ink cursor-pointer"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="q-type" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
                Tipe
              </label>
              <select
                id="q-type"
                aria-label="Tipe Soal"
                value={form.type}
                onChange={(e) => handleTypeChange(e.target.value as any)}
                className="input-ink cursor-pointer"
              >
                <option value="pg">Pilihan Ganda</option>
                <option value="tf">Benar / Salah</option>
                <option value="matching">Jodohkan</option>
                <option value="ordering">Urutkan</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="q-prompt" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
                Pertanyaan
              </label>
              <input
                id="q-prompt"
                value={form.prompt}
                onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                placeholder="Prompt soal"
                className="input-ink"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="q-data" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
                Data Soal (JSON)
              </label>
              <textarea
                id="q-data"
                value={form.dataStr}
                onChange={(e) => setForm({ ...form, dataStr: e.target.value })}
                placeholder={`JSON data, mis. ${DEFAULT_JSON_TEMPLATES[form.type]}`}
                className="input-ink h-24 font-mono text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="q-difficulty"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wide"
              >
                Kesulitan
              </label>
              <select
                id="q-difficulty"
                aria-label="Tingkat Kesulitan"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })}
                className="input-ink cursor-pointer"
              >
                <option value="easy">Mudah</option>
                <option value="medium">Sedang</option>
                <option value="hard">Sulit</option>
              </select>
            </div>
            <div>
              <label htmlFor="q-points" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">
                Poin
              </label>
              <input
                id="q-points"
                type="number"
                min={1}
                aria-label="Poin"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                className="input-ink"
              />
            </div>
          </div>
          {error && (
            <Notice tone="error" className="mt-4">
              {error}
            </Notice>
          )}
          <button type="submit" disabled={topics.length === 0} className="btn-ink mt-5 bg-mint">
            Simpan
          </button>
        </form>

        {/* Question rows. */}
        <div className="border-3 border-ink bg-cloud shadow-pop">
          <h2 className="border-b-3 border-ink bg-sun px-4 py-2 font-display text-sm uppercase tracking-[0.2em]">
            Bank Soal ({questions.length})
          </h2>
          {questions.length === 0 ? (
            <p className="px-4 py-8 text-center font-semibold text-ash">
              Belum ada soal. Tambahkan yang pertama di atas.
            </p>
          ) : (
            <ul className="divide-y-3 divide-ink">
              {questions.map((q) => (
                <li key={q.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="shrink-0 border-3 border-ink px-2 py-1 font-display text-[11px] uppercase text-cloud"
                    style={{ background: TYPE_TONE[q.type] ?? '#111111' }}
                    aria-hidden
                  >
                    {q.type}
                  </span>
                  <span className="min-w-0 flex-1 font-medium">
                    {q.prompt}
                    {q.difficulty && (
                      <span
                        className="ml-2 inline-block border-2 border-ink px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase"
                        style={{ background: DIFF_TONE[q.difficulty] ?? '#FDF6E3' }}
                      >
                        {q.difficulty}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 border-2 border-ink bg-paper-2 px-2 py-0.5 text-xs font-bold tabular-nums">
                    {q.points}p
                  </span>
                  <button
                    onClick={() => del(q.id)}
                    className="shrink-0 border-3 border-ink bg-blood px-3 py-1.5 text-xs font-bold uppercase text-cloud shadow-pop-sm hover:bg-ink"
                  >
                    Hapus
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
