import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAdminStore } from '../stores/useAdminStore';
import type { Topic } from '../types';
import { Notice } from '../components/ui';
import AdminHeader from '../components/AdminHeader';

const GRADE_TONE: Record<number, string> = { 7: '#2F6BFF', 8: '#12B886', 9: '#FF4D2E' };

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
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setName('');
      load();
    } catch (err: any) {
      setError(
        err.response?.data?.details?.[0]?.message ||
          err.response?.data?.error ||
          'Gagal tambah topik',
      );
    }
  };

  const del = async (id: number) => {
    if (!window.confirm('Yakin ingin menghapus?')) return;
    setError('');
    try {
      await api.delete(`/api/admin/topics/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      load();
    } catch {
      setError('Gagal hapus topik');
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <AdminHeader title="Kelola Topik" active="topics" />

        {/* Add form — the workbench. */}
        <form onSubmit={add} className="panel mb-6 p-5">
          <h2 className="mb-4 text-lg">Tambah Topik</h2>
          <div className="flex flex-wrap gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama topik"
              aria-label="Nama topik"
              className="input-ink min-w-0 flex-1"
            />
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value) as 7 | 8 | 9)}
              aria-label="Kelas"
              className="input-ink w-auto cursor-pointer font-bold uppercase"
            >
              <option value={7}>Kelas 7</option>
              <option value={8}>Kelas 8</option>
              <option value={9}>Kelas 9</option>
            </select>
            <button type="submit" className="btn-ink bg-mint">
              Tambah
            </button>
          </div>
        </form>

        {error && (
          <Notice tone="error" className="mb-4">
            {error}
          </Notice>
        )}

        {/* Topic rows. */}
        <div className="border-3 border-ink bg-cloud shadow-pop">
          <h2 className="border-b-3 border-ink bg-sun px-4 py-2 font-display text-sm uppercase tracking-[0.2em]">
            Daftar Topik ({topics.length})
          </h2>
          {topics.length === 0 ? (
            <p className="px-4 py-8 text-center font-semibold text-ash">
              Belum ada topik. Tambahkan yang pertama di atas.
            </p>
          ) : (
            <ul className="divide-y-3 divide-ink">
              {topics.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center border-3 border-ink font-display text-sm text-cloud"
                    style={{ background: GRADE_TONE[t.grade] ?? '#111111' }}
                    aria-label={`Kelas ${t.grade}`}
                  >
                    {t.grade}
                  </span>
                  <span className="min-w-0 flex-1 font-semibold">
                    {t.name} (Kelas {t.grade})
                  </span>
                  <button
                    onClick={() => del(t.id)}
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
