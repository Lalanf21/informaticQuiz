import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePlayerStore } from '../stores/usePlayerStore';
import { HazardBand, Notice } from '../components/ui';

const MODES = [
  {
    to: '/topics',
    label: 'LATIHAN',
    desc: 'Pilih topik, kerjakan santai tanpa timer.',
    bg: '#2F6BFF',
    ink: '#FFFFFF',
  },
  {
    to: '/challenge',
    label: 'TANTANGAN',
    desc: 'Soal acak, timer jalan, kejar skor.',
    bg: '#FF4D2E',
    ink: '#111111',
  },
  {
    to: '/campaign',
    label: 'CAMPAIGN',
    desc: 'Naik level easy → hard, kunci progresmu.',
    bg: '#FFD23F',
    ink: '#111111',
  },
];

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
    <div className="min-h-screen bg-paper">
      <div className="halftone min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
          {/* Panel judul — the thesis. */}
          <div className="relative mb-8 animate-panel-in border-3 border-ink bg-pulse px-5 py-8 shadow-pop-lg sm:px-10 sm:py-12">
            <span className="absolute -right-2 -top-3 rotate-3 border-3 border-ink bg-sun px-3 py-1 font-display text-xs uppercase tracking-widest shadow-pop-sm">
              Kuis Informatika SMP
            </span>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.3em] sm:text-sm">
              Kelas 7 · 8 · 9
            </p>
            <h1 className="font-display text-[clamp(2.25rem,10.5vw,4.5rem)] leading-[0.82] tracking-tight">
              Informatic
              <wbr />
              Quiz
            </h1>
            <p className="mt-4 max-w-md font-semibold leading-snug sm:text-lg">
              <span aria-hidden className="mr-2 inline-block h-4 w-4 border-2 border-ink bg-ink align-[-2px]" />
              Masukkan namamu, pilih mode, dan skormu langsung tercatat. Tanpa akun, tanpa ribet.
            </p>
          </div>

          <HazardBand className="mb-8" />

          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
            {/* Form mulia */}
            <form
              onSubmit={submit}
              className="border-3 border-ink bg-cloud p-5 shadow-pop-lg sm:p-7"
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center border-3 border-ink bg-ink font-display text-cloud">
                  1
                </span>
                <h2 className="text-2xl">Isi Identitas</h2>
              </div>

              <label htmlFor="name-input" className="mb-1.5 block font-bold uppercase tracking-wide">
                Nama
              </label>
              <input
                id="name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-ink mb-5"
                placeholder="Nama lengkap"
                autoComplete="name"
              />

              <label htmlFor="grade-select" className="mb-1.5 block font-bold uppercase tracking-wide">
                Kelas
              </label>
              <select
                id="grade-select"
                value={grade}
                onChange={(e) => {
                  const val = e.target.value;
                  setGrade(val === '' ? '' : (Number(val) as 7 | 8 | 9));
                }}
                className="input-ink mb-6 cursor-pointer font-bold uppercase"
              >
                <option value="">Pilih kelas</option>
                <option value={7}>Kelas 7</option>
                <option value={8}>Kelas 8</option>
                <option value={9}>Kelas 9</option>
              </select>

              {grade === '' && (
                <Notice tone="info" className="mb-4">
                  Pilih kelas dulu supaya soalmu sesuai.
                </Notice>
              )}

              <button
                type="submit"
                disabled={!name.trim() || grade === ''}
                className="btn-ink w-full bg-pulse py-4 text-xl disabled:opacity-100 disabled:bg-paper-2 disabled:text-ash"
              >
                Mulai
              </button>

              <Link
                to="/leaderboard"
                className="mt-4 block text-center font-bold uppercase tracking-wide underline decoration-3 underline-offset-4 hover:bg-sun"
              >
                Lihat Leaderboard
              </Link>
            </form>

            {/* Strip mode */}
            <div className="space-y-4">
              <span className="label-plate pl-4 pr-4 text-[11px] font-bold uppercase tracking-[0.2em]">
                Pilih Cara Bermain
              </span>
              {MODES.map((m, i) => (
                <Link
                  key={m.to}
                  to={m.to}
                  className="block border-3 border-ink p-4 shadow-pop transition-transform duration-75 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-pop-lg"
                  style={{ background: m.bg, color: m.ink, animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-xl">{m.label}</span>
                    <span aria-hidden className="font-display text-xl">
                      →
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold leading-snug">{m.desc}</p>
                </Link>
              ))}
              <Link
                to="/admin/login"
                className="block border-3 border-dashed border-ink bg-paper-2 p-3 text-center text-xs font-bold uppercase tracking-[0.2em] hover:bg-sun"
              >
                Panel Guru
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
