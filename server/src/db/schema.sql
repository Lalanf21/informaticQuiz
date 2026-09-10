PRAGMA foreign_keys = ON;

-- 1. Guru/admin (akun untuk dashboard)
CREATE TABLE IF NOT EXISTS teachers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  username     TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name         TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Topik
CREATE TABLE IF NOT EXISTS topics (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  grade        INTEGER NOT NULL CHECK (grade IN (7,8,9)),
  description  TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Soal polymorphic
CREATE TABLE IF NOT EXISTS questions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id     INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('pg','tf','matching','ordering')),
  prompt       TEXT NOT NULL,
  data         TEXT NOT NULL,
  difficulty   TEXT CHECK (difficulty IN ('easy','medium','hard')),
  points       INTEGER NOT NULL DEFAULT 10,
  created_by   INTEGER REFERENCES teachers(id),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. Sesi kuis
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id           TEXT PRIMARY KEY,
  student_name TEXT NOT NULL,
  grade        INTEGER NOT NULL CHECK (grade IN (7,8,9)),
  mode         TEXT NOT NULL CHECK (mode IN ('topic','challenge','campaign')),
  topic_id     INTEGER REFERENCES topics(id),
  level        INTEGER,
  started_at   TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at  TEXT
);

-- 5. Jawaban siswa per soal
CREATE TABLE IF NOT EXISTS session_answers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id  INTEGER NOT NULL REFERENCES questions(id),
  answer       TEXT NOT NULL,
  is_correct   INTEGER NOT NULL CHECK (is_correct IN (0,1)),
  points_earned INTEGER NOT NULL DEFAULT 0,
  answered_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. Skor final per sesi
CREATE TABLE IF NOT EXISTS scores (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL UNIQUE REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  grade        INTEGER NOT NULL CHECK (grade IN (7,8,9)),
  topic_id     INTEGER REFERENCES topics(id),
  mode         TEXT NOT NULL CHECK (mode IN ('topic','challenge','campaign')),
  total_points INTEGER NOT NULL,
  max_points   INTEGER NOT NULL,
  percentage   REAL NOT NULL,
  finished_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. Daftar soal per sesi (determinisme & urutan acak)
CREATE TABLE IF NOT EXISTS session_questions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id  INTEGER NOT NULL REFERENCES questions(id),
  order_index  INTEGER NOT NULL,
  UNIQUE(session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_scores_points ON scores(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_scores_topic ON scores(topic_id);
CREATE INDEX IF NOT EXISTS idx_sessions_name ON quiz_sessions(student_name);
CREATE INDEX IF NOT EXISTS idx_session_questions ON session_questions(session_id);
