import { Link, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../stores/useAdminStore';
import { PageTitle } from './ui';

/**
 * Header panel guru: judul halaman + nama guru yang sedang login,
 * tombol navigasi antar-halaman, dan tombol keluar (logout).
 */
export default function AdminHeader({
  title,
  active,
}: {
  title: string;
  active: 'questions' | 'topics';
}) {
  const navigate = useNavigate();
  const teacher = useAdminStore((s) => s.teacher);
  const logout = useAdminStore((s) => s.logout);

  const handleLogout = () => {
    const name = teacher?.name || teacher?.username || 'guru';
    if (!window.confirm(`Keluar dari panel guru, ${name}?`)) return;
    logout();
    navigate('/admin/login');
  };

  const tabClass = (isActive: boolean) =>
    `btn-ink px-3 py-2 text-sm ${isActive ? 'bg-sun' : 'bg-cloud'}`;

  return (
    <PageTitle
      kicker="Panel Guru"
      title={title}
      right={
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-plate pl-4 pr-4 text-[11px] font-bold uppercase tracking-[0.2em]">
            {teacher?.name || teacher?.username || 'Guru'}
          </span>
          <Link to="/admin/questions" className={tabClass(active === 'questions')}>
            Soal
          </Link>
          <Link to="/admin/topics" className={tabClass(active === 'topics')}>
            Topik
          </Link>
          <button type="button" onClick={handleLogout} className="btn-ink bg-blood text-sm">
            Keluar
          </button>
        </div>
      }
    />
  );
}
