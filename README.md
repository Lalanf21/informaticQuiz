# InformaticQuiz

> **ID** — Web interaktif bergaya game untuk siswa SMP belajar mata pelajaran Informatika. Siswa input nama + kelas, mengerjakan kuis dalam berbagai mode, dan nilai langsung tersimpan ke database SQLite.
>
> **EN** — An interactive game-style web app for junior high school (SMP) students to learn Informatics. Students enter their name and class, take quizzes in multiple modes, and scores are saved automatically to a SQLite database.

---

## Fitur / Features

| Fitur | Feature |
|---|---|
| Input nama + kelas tanpa akun | Name + class input, no account needed |
| 4 jenis soal: PG, True/False, Matching, Ordering | 4 question types: MC, T/F, Matching, Ordering |
| Mode latihan per topik | Practice mode per topic |
| Mode tantang dengan timer + skor | Challenge mode with timer + scoring |
| Mode campaign dengan level progress | Campaign mode with level progression |
| Leaderboard dengan filter mode/kelas/topik | Leaderboard with mode/grade/topic filters |
| Skor tersimpan otomatis ke SQLite (server-side scoring) | Scores auto-saved to SQLite (server-side) |
| Dashboard guru: CRUD soal & topik (multi-guru) | Teacher dashboard: question & topic CRUD |
| Autentikasi guru dengan kode registrasi | Teacher auth with registration key |

---

## Tech Stack

| Lapisan / Layer | Teknologi / Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, react-router, Tailwind CSS, zustand, @dnd-kit |
| Backend | Express.js, better-sqlite3, zod, bcrypt, jsonwebtoken, helmet |
| Database | SQLite (single file: `data/informaticquiz.db`) |
| Testing | Vitest, supertest, React Testing Library, Playwright |
| Dev tooling | tsx, concurrently, ESLint, Prettier |

---

## Prasyarat / Prerequisites

- **Node.js** >= 18 LTS
- **npm** >= 9
- Git

---

## Instalasi & Setup / Installation & Setup

### 1. Clone

```bash
git clone git@github.com:Lalanf21/informaticQuiz.git
cd informaticQuiz
```

### 2. Install dependencies

```bash
npm install          # root (concurrently)
npm run install:all  # client + server
```

### 3. Konfigurasi environment / Environment config

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env`:

```env
PORT=3001
JWT_SECRET=ganti-dengan-secret-acak-anda
REGISTRATION_KEY=kode-registrasi-guru-anda
DATABASE_PATH=../data/informaticquiz.db
```

Edit `client/.env` (opsional jika backend di port default 3001 / optional if default backend):

```env
VITE_API_URL=http://localhost:3001
```

### 4. Migrasi & seed database / Migrate & seed database

```bash
cd server
npm run db:migrate   # buat 7 tabel
npm run db:seed      # 3 topik, 6 soal, 1 guru demo
cd ..
```

Akun guru demo / Demo teacher account:
- Username: `guru`
- Password: `guru123`
- Default Registration Key: `sekolah-bisa` (untuk register akun guru baru)

### 5. Jalankan dev server / Run dev server

```bash
npm run dev
```

> **Catatan Dynamic Port:** Perintah `npm run dev` menjalankan script runner cerdas (`scripts/dev.js`):
> 1. Otomatis cek database SQLite (`data/informaticquiz.db`), lakukan migrasi dan seed bila belum ada.
> 2. Mencari port backend yang tersedia mulai dari 3001 (otomatis increment bila port sedang dipakai).
> 3. Menunggu backend aktif dan merespons healthcheck.
> 4. Mencari port frontend yang tersedia mulai dari 5173 (otomatis increment bila port sedang dipakai).
> 5. Menjalankan frontend Vite dengan `VITE_API_URL` terhubung otomatis ke port dinamis backend.
> 6. Menampilkan URL aktif di terminal dan menghentikan kedua server secara bersih saat `Ctrl+C`.

- Client: <http://localhost:5173> (atau port hasil increment)
- Server: <http://localhost:3001> (atau port hasil increment)

---

## Penggunaan / Usage

### Sebagai Siswa / As Student

1. Buka <http://localhost:5173>
2. Masukkan nama dan pilih kelas (7, 8, atau 9)
3. Pilih mode: **Latihan Topik**, **Tantangan**, atau **Campaign**
4. Kerjakan soal hingga selesai
5. Lihat hasil + leaderboard

### Sebagai Guru / As Teacher

1. Buka <http://localhost:5173/admin/register>
2. Daftar dengan **kode registrasi** (lihat `REGISTRATION_KEY` di `server/.env`)
3. Login di <http://localhost:5173/admin/login>
4. Kelola topik di `/admin/topics`
5. Tambah/edit/hapus soal di `/admin/questions`

---

## Struktur Proyek / Project Structure

```
informaticQuiz/
├── client/          # React + Vite frontend (port 5173)
│   ├── src/
│   │   ├── pages/      # Home, Topics, Challenge, Campaign, QuizPlay, Result, Leaderboard, Admin*
│   │   ├── components/ # QuestionRenderer, Timer, ProgressBar
│   │   ├── stores/     # zustand: usePlayerStore, useQuizStore, useAdminStore
│   │   ├── api/        # axios client
│   │   └── types.ts
│   └── e2e/            # Playwright tests
├── server/          # Express REST API (port 3001)
│   ├── src/
│   │   ├── routes/     # topics, quizzes, sessions, scores, admin
│   │   ├── db/         # schema.sql, seed.ts, db.ts
│   │   ├── lib/        # schemas (zod), score, auth
│   │   ├── middleware/ # authJwt, errorHandler, validateBody
│   │   └── types.ts
│   └── tests/
├── data/            # SQLite DB file (gitignored)
├── docs/superpowers/
│   ├── specs/        # Design spec
│   └── plans/        # Implementation plan
└── package.json     # root workspace
```

---

## Skema Database / Database Schema

7 tabel SQLite (pendekatan single-table polymorphic untuk soal):

| Tabel / Table | Fungsi / Purpose |
|---|---|
| `teachers` | Akun guru (username + bcrypt hash) |
| `topics` | Topik Informatika per kelas (7/8/9) |
| `questions` | Soal polymorphic (`type` + JSON `data`) |
| `quiz_sessions` | Sesi kuis siswa (UUID, tanpa akun) |
| `session_questions` | Daftar soal per sesi (determinisme + shuffle) |
| `session_answers` | Jawaban siswa per soal + status benar/salah |
| `scores` | Skor final (denormalized untuk leaderboard) |

Detail lengkap: `docs/superpowers/specs/2026-09-10-informaticquiz-design.md`

---

## Mode Permainan / Game Modes

| Mode | Deskripsi / Description |
|---|---|
| **Latihan Topik** | Pilih topik → kerjakan 10-20 soal → lihat skor |
| **Tantangan** | Soal acak lintas topik + timer (60 dtk/soal, maks 10 menit) |
| **Campaign** | Level 1-3 per topik (easy→medium→hard), unlock level berikutnya setelah lulus (≥70%) |
| **Leaderboard** | Ranking semua siswa, filter mode/kelas/topik |

---

## Jenis Soal / Question Types

| Type | Format JSON `data` |
|---|---|
| `pg` (Pilihan Ganda) | `{ "options": ["a","b","c","d"], "correctIndex": 2 }` |
| `tf` (True/False) | `{ "correctAnswer": true }` |
| `matching` | `{ "pairs": [{ "left": "HTTP", "right": "Protokol web" }] }` |
| `ordering` | `{ "correctOrder": ["Mulai", "Proses", "Output", "Selesai"] }` |

---

## Testing

```bash
# Jalankan seluruh unit test (server + client) dari root
npm test

# Server unit tests saja
npm test --prefix server

# Client unit tests saja
npm test --prefix client

# E2E Tests (Playwright — otomatis setup database, migrasi & seed)
cd client && npm run test:e2e
```

---

## Variabel Environment / Environment Variables

### `server/.env`

| Variabel | Default | Keterangan / Description |
|---|---|---|
| `PORT` | `3001` | Port server |
| `JWT_SECRET` | — | Secret untuk JWT admin (wajib ganti di production) |
| `REGISTRATION_KEY` | — | Kode untuk mendaftar akun guru |
| `DATABASE_PATH` | `../data/informaticquiz.db` | Path file SQLite |

### `client/.env`

| Variabel | Default | Keterangan / Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001` | URL backend API |

---

## Deployment

### Server

- Deploy ke VPS / Render / Railway
- Set environment variables (`JWT_SECRET`, `REGISTRATION_KEY`, `DATABASE_PATH`)
- Mount volume untuk `data/` (persistensi SQLite)

### Client

- `npm run build` di folder `client/`
- Deploy `dist/` ke Vercel / Netlify
- Set `VITE_API_URL` ke URL server production

> **Catatan / Note:** SQLite cocok untuk 1 sekolah. Untuk skala multi-instance, pertimbangkan migrasi ke PostgreSQL.

---

## Roadmap (Fase 2)

- [ ] Partial credit untuk matching & ordering
- [ ] Deadline sesi otomatis (close sesi yang tidak diselesaikan)
- [ ] Tracking progress campaign cross-device
- [ ] Migrasi SQLite → PostgreSQL untuk skala besar
- [ ] Admin-seed + invite (guru dibuat oleh admin eksisting)

---

## Dokumentasi / Documentation

- Design spec: [`docs/superpowers/specs/2026-09-10-informaticquiz-design.md`](docs/superpowers/specs/2026-09-10-informaticquiz-design.md)
- Implementation plan: [`docs/superpowers/plans/2026-09-10-informaticquiz-plan.md`](docs/superpowers/plans/2026-09-10-informaticquiz-plan.md)

---

## Kontribusi / Contributing

Kontribusi terbuka! Silakan:

1. Fork repository ini
2. Buat branch fitur (`git checkout -b feat/nama-fitur`)
3. Commit perubahan (`git commit -m "feat: deskripsi"`)
4. Push ke branch (`git push origin feat/nama-fitur`)
5. Buat Pull Request

### Konvensi commit / Commit conventions

| Prefix | Untuk / For |
|---|---|
| `feat:` | Fitur baru / New feature |
| `fix:` | Perbaikan bug / Bug fix |
| `chore:` | Setup, config, maintenance |
| `docs:` | Dokumentasi / Documentation |
| `test:` | Penambahan/perbaikan test |

---

## Lisensi / License

[MIT](LICENSE)

---

## Status Proyek / Project Status

Proyek ini sedang dalam tahap pengembangan / This project is under active development.

Dibuat untuk membantu siswa SMP Indonesia belajar Informatika dengan cara yang menyenangkan.
Built to help Indonesian junior high students learn Informatics in a fun way.
