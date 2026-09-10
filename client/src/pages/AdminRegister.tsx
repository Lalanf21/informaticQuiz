import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAdminStore } from '../stores/useAdminStore';

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
      const res = await api.post('/api/admin/register', { username, password, name, registrationKey: regKey });
      setAuth(res.data.token, { id: 0, username, name });
      navigate('/admin/questions');
    } catch (err: any) {
      setError(err.response?.status === 403 ? 'Kode registrasi salah' : 'Gagal daftar');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={submit} className="bg-white p-8 rounded-xl shadow w-96">
        <h1 className="text-2xl font-bold mb-4">Daftar Guru</h1>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full p-3 mb-3 border rounded"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-3 mb-3 border rounded"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama (opsional)"
          className="w-full p-3 mb-3 border rounded"
        />
        <input
          value={regKey}
          onChange={(e) => setRegKey(e.target.value)}
          placeholder="Kode registrasi"
          className="w-full p-3 mb-4 border rounded"
        />
        <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg">
          Daftar
        </button>
        <Link to="/admin/login" className="block text-center mt-4 text-sm text-blue-600">
          Sudah punya akun? Login
        </Link>
      </form>
    </div>
  );
}
