import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAdminStore } from '../stores/useAdminStore';
import { Notice } from '../components/ui';

export default function AdminRegister() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [regKey, setRegKey] = useState('');
  const [error, setError] = useState('');
  const setAuth = useAdminStore((s) => s.setAuth);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/admin/register', {
        username,
        password,
        name,
        registrationKey: regKey,
      });
      setAuth(res.data.token, res.data.teacher);
      navigate('/admin/questions');
    } catch (err: any) {
      setError(err.response?.status === 403 ? 'Kode registrasi salah' : 'Gagal daftar');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md">
        <div className="animate-panel-in border-3 border-ink bg-cloud shadow-pop-lg">
          <div className="border-b-3 border-ink bg-ink px-5 py-3">
            <span className="label-plate text-[11px] font-bold uppercase tracking-[0.2em]">
              Panel Guru
            </span>
            <h1 className="mt-2 font-display text-3xl text-cloud">Daftar Guru</h1>
          </div>
          <form onSubmit={submit} className="p-5 sm:p-6">
            {error && (
              <Notice tone="error" className="mb-4">
                {error}
              </Notice>
            )}
            <label htmlFor="reg-username" className="mb-1.5 block font-bold uppercase tracking-wide">
              Username
            </label>
            <input
              id="reg-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="input-ink mb-4"
              autoComplete="username"
            />
            <label htmlFor="reg-password" className="mb-1.5 block font-bold uppercase tracking-wide">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input-ink mb-4"
              autoComplete="new-password"
            />
            <label htmlFor="reg-name" className="mb-1.5 block font-bold uppercase tracking-wide">
              Nama <span className="font-medium normal-case text-ash">(opsional)</span>
            </label>
            <input
              id="reg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama (opsional)"
              className="input-ink mb-4"
            />
            <label htmlFor="reg-key" className="mb-1.5 block font-bold uppercase tracking-wide">
              Kode Registrasi
            </label>
            <input
              id="reg-key"
              value={regKey}
              onChange={(e) => setRegKey(e.target.value)}
              placeholder="Kode registrasi"
              className="input-ink mb-5"
            />
            <button type="submit" className="btn-ink w-full bg-mint py-3 text-lg">
              Daftar
            </button>
          </form>
          <div className="border-t-3 border-ink bg-paper-2 px-5 py-3 text-center">
            <Link
              to="/admin/login"
              className="font-bold uppercase tracking-wide underline decoration-3 underline-offset-4 hover:bg-sun"
            >
              Sudah punya akun? Login
            </Link>
          </div>
        </div>
        <Link
          to="/"
          className="mt-5 block text-center font-bold uppercase tracking-wide text-ash hover:text-ink"
        >
          ← Kembali ke halaman siswa
        </Link>
      </div>
    </div>
  );
}
