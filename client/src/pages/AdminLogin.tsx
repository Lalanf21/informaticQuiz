import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAdminStore } from '../stores/useAdminStore';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const setAuth = useAdminStore((s) => s.setAuth);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/admin/login', { username, password });
      setAuth(res.data.token, res.data.teacher);
      navigate('/admin/questions');
    } catch {
      setError('Username atau password salah');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={submit} className="bg-white p-8 rounded-xl shadow w-96">
        <h1 className="text-2xl font-bold mb-4">Login Guru</h1>
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
          className="w-full p-3 mb-4 border rounded"
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg">
          Login
        </button>
        <Link to="/admin/register" className="block text-center mt-4 text-sm text-blue-600">
          Daftar akun guru
        </Link>
      </form>
    </div>
  );
}
