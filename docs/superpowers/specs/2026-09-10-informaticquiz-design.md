# InformaticQuiz — Design Spec

> Web interaktif bergaya game untuk siswa SMP belajar Informatika. Siswa input nama+kelas, mengerjakan kuis dalam berbagai mode, dan nilai langsung tersimpan ke database SQLite.

- **Tanggal:** 2026-09-10
- **Path project:** `/media/lalan/Development/project/js/informaticQuiz`
- **Status:** Disetujui (brainstorming selesai 2026-09-10)

---

## 1. Tujuan & Success Criteria

**Tujuan:** Menyediakan platform kuis Informatika interaktif untuk siswa SMP (kelas 7, 8, 9) dengan beragam mode permainan, di mana skor siswa langsung tercatat ke database tanpa perlu akun siswa.

**Success criteria:**
1. Siswa dapat input nama + kelas, lalu mengerjakan kuis dalam 4 mode (topic, challenge, campaign, leaderboard).
2. Skor siswa tersimpan persisten di SQLite saat kuis selesai (server-side scoring).
3. Guru dapat login/register (dengan kode registrasi) dan CRUD soal + topik via dashboard.
4. 4 jenis soal didukung: pilihan ganda (PG), True/False, matching, ordering.
5. Leaderboard menampilkan peringkat siswa dengan filter mode/grade/topik.

---

## 2. Stack Teknologi

| Lapisan | Teknologi |
|---|---|
| Frontend | React 18 + Vite + TypeScript + react-router + Tailwind CSS + zustand + axios |
| Drag & drop (ordering) | @dnd-kit/core |
| Backend | Express.js + better-sqlite3 + zod + bcrypt + jsonwebtoken + express-rate-limit + helmet + cors |
| Database | SQLite (file: `data/informaticquiz.db`) |
| Test | Vitest + supertest (server), Vitest + React Testing Library (client), Playwright (e2e) |
| Dev tooling | tsx (server dev), concurrently (root dev), ESLint + Prettier |

---

## 3. Arsitektur Tingkat Tinggi

```
informaticQuiz/
├── client/          # React + Vite (port 5173)
│   ├── src/
│   │   ├── pages/      # Home, QuizSelect, QuizPlay, Leaderboard, AdminLogin, AdminDashboard, Result
│   │   ├── components/ # QuestionRenderer, Timer, ProgressBar, ResultScreen
│   │   ├── api/        # axios wrapper ke backend
│   │   ├── stores/     # zustand: usePlayerStore, useQuizStore, useAdminStore
│   │   ├── types/      # TS types (Question, QuizSession, Score, etc.)
│   │   └── App.tsx     # routing
│   └── vite.config.ts
├── server/          # Express REST API (port 3001)
│   ├── src/
│   │   ├── routes/     # /api/quizzes, /api/sessions, /api/scores, /api/admin/*
│   │   ├── db/         # schema.sql, seed.ts, better-sqlite3 instance
│   │   ├── middleware/ # auth (admin JWT), errorHandler, validate
│   │   ├── lib/        # zod schemas per question type, score.ts
│   │   └── index.ts
│   └── package.json
├── data/            # informaticquiz.db (gitignored)
└── package.json     # workspace root (concurrently scripts)
```

**Alur inti:**
1. Siswa buka Home → input nama + kelas → pilih mode.
2. `POST /api/sessions` (server menentukan & menyimpan daftar soal ke `session_questions`) → return `sessionId`.
3. Client fetch soal via `GET /api/sessions/:id/questions` (tanpa kunci jawaban; refresh aman).
4. Kerjakan soal di QuizPlay; jawaban disimpan lokal di `useQuizStore.answers`.
5. Saat selesai → `POST /api/sessions/:id/submit` → server nilai & simpan ke `scores` → return skor.
6. Leaderboard fetch dari `/api/scores/leaderboard`.

**Keputusan penilaian:** server-side scoring. Jawaban dikirim ke server, server menghitung skor dan menyimpan sekaligus. Mencegah manipulasi skor di client dan memenuhi syarat "nilai langsung ter-input ke database".

---

## 4. Skema Database (SQLite)

Pendekatan: single-table polymorphic (satu tabel `questions` dengan kolom `type` + JSON `data` per jenis).

```sql
-- 1. Guru/admin (akun untuk dashboard)
CREATE TABLE teachers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  username     TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,        -- bcrypt hash
  name         TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Topik (algoritma, jaringan, kewirausahaan, dll)
CREATE TABLE topics (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  grade        INTEGER NOT NULL CHECK (grade IN (7,8,9)),
  description  TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Soal polymorphic — kolom JSON data per jenis
CREATE TABLE questions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id     INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('pg','tf','matching','ordering')),
  prompt       TEXT NOT NULL,
  data         TEXT NOT NULL,          -- JSON payload per jenis (lihat §4.1)
  difficulty   TEXT CHECK (difficulty IN ('easy','medium','hard')),
  points       INTEGER NOT NULL DEFAULT 10,
  created_by   INTEGER REFERENCES teachers(id),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. Sesi kuis (identitas siswa tanpa akun)
CREATE TABLE quiz_sessions (
  id           TEXT PRIMARY KEY,       -- UUID, dipakai sebagai session token
  student_name TEXT NOT NULL,
  grade        INTEGER NOT NULL CHECK (grade IN (7,8,9)),
  mode         TEXT NOT NULL CHECK (mode IN ('topic','challenge','campaign')),
  topic_id     INTEGER REFERENCES topics(id),   -- nullable: challenge bisa acak
  level        INTEGER,                 -- untuk mode campaign
  started_at   TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at  TEXT
);

-- 5. Jawaban siswa per soal
CREATE TABLE session_answers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id  INTEGER NOT NULL REFERENCES questions(id),
  answer       TEXT NOT NULL,         -- JSON jawaban siswa (struktur per jenis)
  is_correct   INTEGER NOT NULL CHECK (is_correct IN (0,1)),
  points_earned INTEGER NOT NULL DEFAULT 0,
  answered_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. Skor final per sesi (denormalized untuk leaderboard cepat)
CREATE TABLE scores (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL UNIQUE REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  grade        INTEGER NOT NULL,
  topic_id     INTEGER REFERENCES topics(id),
  mode         TEXT NOT NULL,
  total_points INTEGER NOT NULL,
  max_points   INTEGER NOT NULL,
  percentage   REAL NOT NULL,          -- 0-100
  finished_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. Daftar soal per sesi (determinisme & urutan acak per siswa)
CREATE TABLE session_questions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id  INTEGER NOT NULL REFERENCES questions(id),
  order_index  INTEGER NOT NULL,      -- urutan soal di sesi ini (bisa di-shuffle per siswa)
  UNIQUE(session_id, question_id)
);

CREATE INDEX idx_scores_points ON scores(total_points DESC);
CREATE INDEX idx_scores_topic ON scores(topic_id);
CREATE INDEX idx_sessions_name ON quiz_sessions(student_name);
CREATE INDEX idx_session_questions ON session_questions(session_id);
```

### 4.1 Format JSON `questions.data` per jenis

```jsonc
// type: 'pg'
{ "options": ["A","B","C","D"], "correctIndex": 2 }

// type: 'tf'
{ "correctAnswer": true }   // atau false

// type: 'matching'
{ "pairs": [ {"left":"HTTP","right":"Protokol web"}, {"left":"TCP","right":"Pengiriman paket andal"} ] }

// type: 'ordering'
{ "correctOrder": ["Mulai","Proses input","Output","Selesai"] }
```

### 4.2 Catatan skema
- `quiz_sessions.id` = UUID string, juga berfungsi sebagai token sesi siswa (tidak perlu tabel auth terpisah untuk siswa).
- `scores` sengaja denormalisasi (duplikasi `student_name`/`grade`) agar query leaderboard tidak butuh JOIN ke sessions.
- `session_answers` menyimpan jawaban per soal → untuk review saat selesai + audit.
- Validasi JSON `data` & `answer` di-handle Zod di server (lihat §5.3).

### 4.3 Relasi sesi ↔ soal (determinisme & audit)
Tabel `session_questions` menyimpan daftar soal yang sudah ditentukan untuk sesi tertentu, sehingga:
- Mode `challenge` (soal acak): soal di-generate sekali saat `POST /api/sessions`, lalu di-simpan ke `session_questions`. `GET /api/quizzes/challenge` di Panggil saat sesi dibuat (bukan oleh client secara langsung). Refresh halaman tidak mengganti soal — client fetch via `GET /api/sessions/:id/questions` yang membaca `session_questions`.
- Mode `topic` & `campaign`: soal bisa di-shuffle per sesi (acak urutan) dan di-simpan ke `session_questions` agar tiap siswa dapat urutan berbeda tapi tetap konsisten saat refresh.
- Server tetap bisa melewatkan `session_questions` utk mode `topic` (ambil semua soal topik) bila tidak perlu acak urutan — bersifat opsional per mode.

---

## 5. Backend: REST API, Validasi, & Logika Penilaian

### 5.1 Endpoint publik (siswa)

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/api/topics` | List topik (filter `?grade=7`) |
| `GET` | `/api/quizzes/topic/:topicId` | Ambil soal-soal utk 1 topik (urutan di-shuffle, tanpa kunci jawaban di response) |
| `GET` | `/api/quizzes/challenge` | Ambil soal acak lintas topik (param `?count=10&grade=7`). Dipanggil sekali saat pembuatan sesi; hasil (daftar question_id) disimpan ke relasi sesi (lihat §4.3) agar refresh tidak mengganti soal. |
| `GET` | `/api/quizzes/campaign/:topicId/level/:n` | Ambil soal utk level ke-n campaign (filter `difficulty`) |
| `POST` | `/api/sessions` | Buat sesi: `{studentName, grade, mode, topicId?, level?}` → return `{sessionId}` |
| `POST` | `/api/sessions/:id/submit` | Submit jawaban akhir: `{answers:[{questionId, answer}]}` → server nilai & simpan, return `{scoreId, totalPoints, maxPoints, percentage, breakdown}` |
| `GET` | `/api/sessions/:id/questions` | Ambil soal-soal sesi (dari `session_questions`, urutan `order_index`); refresh aman — soal tidak ganti |
| `GET` | `/api/scores/leaderboard` | Top N skor: `?limit=50&mode=topic&topicId=3&grade=7` |
| `GET` | `/api/sessions/:id/result` | Review jawaban + kunci (hanya tersedia setelah submit) |

### 5.2 Endpoint admin (guru, butuh JWT)

| Method | Path | Fungsi |
|---|---|---|
| `POST` | `/api/admin/register` | Daftar guru baru (butuh `REGISTRATION_KEY` env) |
| `POST` | `/api/admin/login` | Login → return JWT |
| `GET/POST/PUT/DELETE` | `/api/admin/questions` | CRUD soal |
| `GET/POST/PUT/DELETE` | `/api/admin/topics` | CRUD topik |

### 5.3 Validasi Zod per jenis (`server/src/lib/schemas.ts`)

```ts
const PgData    = z.object({ options: z.array(z.string()).min(2), correctIndex: z.number().int() });
const TfData    = z.object({ correctAnswer: z.boolean() });
const MatchData = z.object({ pairs: z.array(z.object({ left: z.string(), right: z.string() })).min(2) });
const OrderData = z.object({ correctOrder: z.array(z.string()).min(2) });
// dispatcher: pilih schema berdasarkan type, parse data, tolak jika invalid
```

### 5.4 Logika penilaian server-side (`server/src/lib/score.ts`)

Skor biner: benar = `question.points` penuh, salah = 0. Tidak ada partial credit untuk matching/ordering (fase 2).

```ts
// Pseudocode dispatcher per jenis
function gradeQuestion(question, studentAnswer) {
  switch (question.type) {
    case 'pg':
      return studentAnswer.index === question.data.correctIndex ? question.points : 0;
    case 'tf':
      return studentAnswer.value === question.data.correctAnswer ? question.points : 0;
    case 'matching':
      const allCorrect = question.data.pairs.every(p => studentAnswer[p.left] === p.right);
      return allCorrect ? question.points : 0;
    case 'ordering':
      const same = question.data.correctOrder.every((step, i) => studentAnswer.order[i] === step);
      return same ? question.points : 0;
  }
}
```

### 5.5 Keamanan & integritas
- Kunci jawaban (`correctIndex`, `correctAnswer`, `correctOrder`, kunci pairs matching) **tidak pernah dikirim ke client** sebelum submit — dihapus di response `GET /api/quizzes/*`.
- `POST /api/sessions/:id/submit` bersifat **idempotent per session**: session yang sudah `finished_at` di-set tidak bisa submit ulang (409 Conflict).
- Admin routes dilindungi middleware `authJWT`; JWT secret dari env `JWT_SECRET`.
- Rate-limit login admin (`express-rate-limit`) untuk cegah brute-force.
- Helmet + CORS terbatas (hanya origin client Vite `http://localhost:5173` saat dev).
- Register guru butuh `REGISTRATION_KEY` dari env; jika tidak cocok → 403.

---

## 6. Frontend: Halaman, State, & Komponen Soal

### 6.1 Halaman & Routing

```
/                        Home (input nama+kelas → mulai sesi)
/topics                  Pilih topik (filter grade 7/8/9) → mode 'topic'
/challenge               Mode tantang (timer + skor) → mode 'challenge'
/campaign/:topicId       Peta level untuk topic tsb → pilih level
/campaign/:topicId/:n    Kerjakan level ke-n
/quiz/:sessionId         Play screen utama (soal-soal) — dipakai semua mode
/result/:sessionId       Layar hasil + review jawaban
/leaderboard             Ranking global & filter
/admin/login             Login guru
/admin/register          Register (butuh kode registrasi)
/admin/questions         CRUD soal
/admin/topics            CRUD topik
```

### 6.2 State (Zustand stores)

- `usePlayerStore` — `{ name, grade, sessionId }` (identitas siswa tanpa akun).
- `useQuizStore` — `{ questions, currentIndex, answers, startedAt, mode }` (jalanan kuis); jawaban disimpan di sini, tidak ada perhitungan skor di client.
- `useAdminStore` — `{ token, teacher }` (JWT admin, simpan di localStorage).

### 6.3 Alur QuizPlay

1. Home/Topic/Challenge/Campaign → `POST /api/sessions` (server generate & simpan daftar soal ke `session_questions`) → dapat `sessionId` → navigasi ke `/quiz/:sessionId`.
2. `GET /api/sessions/:id/questions` → simpan questions ke store (tanpa kunci jawaban). Refresh halaman aman — soal tidak ganti.
3. Render soal satu per satu via `<QuestionRenderer>`.
4. Tiap jawaban siswa → simpan ke `answers[]` lokal (belum submit).
5. Mode `challenge`: timer countdown; habis → auto-submit.
6. Selesai (soal terakhir / timer habis) → `POST /api/sessions/:id/submit` dengan `answers`.
7. Redirect ke `/result/:sessionId`.

### 6.4 Komponen `QuestionRenderer` (switch per jenis)

Satu komponen, render berbeda UI berdasarkan `question.type`:

| Type | UI |
|---|---|
| `pg` | Radio button 4 pilihan (opsi di-shuffle di client agar A-D tidak selalu sama urutan) |
| `tf` | 2 tombol besar: Benar / Salah |
| `matching` | 2 kolom; kolom kanan di-shuffle; siswa klik kiri lalu klik kanan utk pasang (garis penghubung visual) |
| `ordering` | List drag-and-drop (pakai `@dnd-kit/core`) untuk urutkan ulang langkah |

Shuffle aman: client hanya tahu `options`/`pairs`/`correctOrder` tanpa penanda benar — server tetap nilai berdasarkan index/mapping/posisi yang dikirim siswa.

### 6.5 Komponen pendukung
- `<Timer>` — countdown utk challenge; tampil detik; saat 0 panggil `onExpire`.
- `<ProgressBar>` — `soal ke-X dari N`.
- `<ResultScreen>` — tampil skor final, breakdown per soal, tombol "Kuis lagi" / "Lihat leaderboard".

### 6.6 Feedback
Feedback di akhir: siswa jawab semua soal → submit → baru tahu benar/salah di ResultScreen. Tidak ada feedback langsung per soal saat menjawab (lebih seperti ujian, cegah inspeksi kunci via network).

---

## 7. Mode Permainan Detail

### 7.1 Mode `topic` (latihan per topik)
- Halaman `/topics` → pilih grade → pilih topik → auto buat sesi → `/quiz/:sessionId`.
- Soal: semua soal utk topik itu (limit 10-20), urutan di-shuffle.
- Tanpa timer; siswa kerjakan santai.
- Submit → skor masuk `scores` dengan `mode='topic'`.

### 7.2 Mode `challenge` (timer + skor)
- Halaman `/challenge` → pilih jumlah soal (5/10/15) & grade → buat sesi → `/quiz/:sessionId`.
- Soal: acak lintas topik utk grade tsb, ambil `count` soal.
- Timer total: `min(60 × count, 600)` detik (60 dtk per soal, tapi maks 10 menit/600 dtk). Saat habis → auto-submit jawaban terisi.
- Submit → skor masuk `scores.mode='challenge'`; leaderboard challenge terpisah.

### 7.3 Mode `campaign` (level/progress)
- Halaman `/campaign/:topicId` → peta level (level 1..N utk topik tsb).
- Level `n` → `GET /api/quizzes/campaign/:topicId/level/:n` → soal dgn `difficulty` menaik (easy→medium→hard).
- `level` disimpan di `quiz_sessions.level` utk audit.
- Setelah lulus (≥70%): level berikutnya unlock.
- **Progress identifikasi via LocalStorage per perangkat** (bukan via server, untuk hindari risiko nama duplikat & menyederhanakan). Logika unlock ada di client; server tetap catat `level` di `quiz_sessions` untuk audit.
- Submit tiap level → skor masuk `scores.mode='campaign'` dgn info level.

### 7.4 Leaderboard
- Halaman `/leaderboard` → filter: mode (all/topic/challenge/campaign), grade, topik.
- Tampil top 50: rank, nama, grade, skor, persentase, tanggal.
- Source: `GET /api/scores/leaderboard?mode=&grade=&topicId=&limit=50`.

---

## 8. Error Handling

### 8.1 Client (axios interceptor)
- 401 admin token expired → redirect ke `/admin/login` + toast.
- 400 (validasi) → tampilkan pesan field error di form.
- 409 (submit ganda) → toast "Kuis sudah diselesaikan", redirect ke `/result/:id`.
- 5xx / network → toast "Koneksi bermasalah, coba lagi", tombol retry.
- State `loading`/`error` per request via flags manual atau TanStack Query (opsional).

### 8.2 Server (middleware error handler terpusat di `server/src/middleware/errorHandler.ts`)
- Zod parse gagal → 400 `{ error: "VALIDATION_ERROR", details: [...] }`.
- Foreign key gagal (topic_id tak ada) → 400.
- Submit ke session sudah finished → 409.
- JWT invalid/expired → 401.
- `REGISTRATION_KEY` salah → 403.
- Unknown error → 500 `{ error: "INTERNAL_ERROR" }` + log (jangan leak stack ke client).

### 8.3 Edge cases
- Siswa refresh di tengah kuis → `sessionId` masih valid di server; jawaban tersimpan lokal di `useQuizStore` (persist ke `localStorage` via zustand persist sebagai backup).
- Siswa tutup tab sebelum submit → sesi tetap `started_at`, `finished_at` NULL; tidak masuk leaderboard; deadline sesi opsional di fase 2.
- Topik tanpa soal → response 200 dgn `questions: []` + UI "topik belum punya soal".

---

## 9. Testing Strategy

| Lapisan | Tools | Cakupan |
|---|---|---|
| Server unit | Vitest + supertest | Endpoint REST (publik + admin), auth middleware, `gradeQuestion()` per jenis, Zod schemas, idempotent submit |
| Server DB | better-sqlite3 in-memory (`:memory:`) utk test | Skema migrasi, FK cascade, seed |
| Client unit | Vitest + React Testing Library | `QuestionRenderer` per jenis, store zustand |
| Client e2e | Playwright | Alur siswa penuh: Home→pilih topik→kerjakan→submit→lihat hasil; alur admin: login→CRUD soal |
| Contract | Berbagi tipe TS antara client & server | Skor & question shape konsisten lintas stack |

Target coverage awal: ≥70% server (logika penilaian & auth 100%), ≥50% client (renderer komponen prioritas). E2e happy-path wajib sebelum ship.

---

## 10. Konvensi & Tooling

### 10.1 Konvensi kode
- Struktur: dua folder terpisah (`client/` + `server/`) di root; tipe TS bersama via import path relatif dari `server/src/types`.
- Naming: `camelCase` variabel/fungsi, `PascalCase` komponen React & TS types, `snake_case` kolom DB.
- Lint/format: ESLint + Prettier di kedua folder; `npm run lint` & `npm run format`.
- Commit message: konvensional (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).

### 10.2 Env vars
- `server/.env`: `PORT` (3001), `JWT_SECRET`, `REGISTRATION_KEY`, `DATABASE_PATH` (default `../data/informaticquiz.db`).
- `client/.env`: `VITE_API_URL` (default `http://localhost:3001`).

### 10.3 Gitignore
`data/`, `node_modules/`, `dist/`, `.env`, `*.db`.

### 10.4 Scripts
- `client/package.json`: `dev`, `build`, `lint`, `test`, `test:e2e`.
- `server/package.json`: `dev` (tsx watch), `build`, `start`, `lint`, `test`, `db:seed`, `db:migrate`.
- Root `package.json`: `dev` (concurrently client+server), `install:all`.

### 10.5 Seed awal (`server/src/db/seed.ts`)
- 3 topik contoh: "Algoritma & Pemrograman" (kelas 7), "Jaringan Komputer & Internet" (kelas 8), "Kewirausahaan Digital" (kelas 9).
- ~5 soal per topik (mix 4 jenis: pg, tf, matching, ordering).
- 1 guru demo: username `guru`, password `guru123` (hash bcrypt) — utk testing admin.

---

## 11. Timeline Estimasi

Semua mode sekaligus (4 mode + admin + multi-guru + 4 jenis soal):

| Fase | Cakupan | Estimasi |
|---|---|---|
| 1 | Skema DB + server bootstrap + endpoint publik + penilaian + Zod | ~3-4 hari |
| 2 | Client: Home, QuizPlay, QuestionRenderer 4 jenis, ResultScreen | ~3-4 hari |
| 3 | Mode topic + challenge + leaderboard | ~2 hari |
| 4 | Mode campaign + localStorage progress | ~2 hari |
| 5 | Admin: login/register, CRUD soal+topik | ~2 hari |
| 6 | Testing (unit + e2e) + seed + polish UI | ~2-3 hari |
| **Total** | | **~14-17 hari kerja** |

**Risiko:** scope cukup besar. Desain modular agar tiap mode bisa dikirim bertahap bila timeline mepet. Urutan drop paling aman bila mepet: campaign → challenge → lalu admin multi-guru (admin jadi single-env).

---

## 12. Deployment (di luar scope implementasi awal)

- Server: Node process di VPS / Render / Railway; `data/` utk sqlite persisten (volume mount).
- Client: build statis ke Vercel/Netlify, `VITE_API_URL` arah ke server.
- Catatan: SQLite single-file kurang ideal utk multi-instance horizontal; cukup utk 1 sekolah. Bila skalanya besar nanti, migrasi ke Postgres.

---

## 13. Batasan & Keputusan Tercatat

1. **Siswa tanpa akun** — identitas via input nama+kelas tiap sesi; tidak ada riwayat lintas perangkat.
2. **Progress campaign via LocalStorage** — tidak ada cross-device, tapi hindari risiko nama duplikat di server.
3. **Skor biner** — tidak ada partial credit untuk matching/ordering di MVP (fase 2).
4. **Feedback di akhir** — siswa tidak tahu benar/salah per soal saat menjawab; baru setelah submit.
5. **Register guru via kode registrasi** — `REGISTRATION_KEY` env; bukan admin-seed + invite.
6. **Server-side scoring** — mencegah manipulasi skor client; memenuhi syarat "nilai langsung ter-input ke database".
7. **SQLite** — cukup utk 1 sekolah; bukan utk multi-instance horizontal.

---

## 14. Item Fase 2 (out of scope MVP)

- Partial credit untuk matching & ordering.
- Deadline sesi otomatis (sesi yang tidak diselesaikan dalam X jam di-close).
- Tracking progress campaign cross-device (butuh akun siswa atau device-id).
- Migrasi dari SQLite ke Postgres bila skala bertumbuh.
- Admin-seed + invite (register guru oleh admin eksisting).
