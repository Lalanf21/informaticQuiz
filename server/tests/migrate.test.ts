import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import type { Database as DBType } from 'better-sqlite3';
import { migrate } from '../src/db/migrate';

let db: DBType;

beforeEach(() => {
  db = new Database(':memory:');
  migrate(db);
});

afterEach(() => db.close());

describe('schema migration', () => {
  it('creates all 7 tables', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const names = tables.map((t) => t.name);
    expect(names).toContain('teachers');
    expect(names).toContain('topics');
    expect(names).toContain('questions');
    expect(names).toContain('quiz_sessions');
    expect(names).toContain('session_answers');
    expect(names).toContain('scores');
    expect(names).toContain('session_questions');
  });

  it('is idempotent when run multiple times', () => {
    expect(() => migrate(db)).not.toThrow();
  });

  it('enforces grade CHECK constraint', () => {
    expect(() =>
      db.prepare('INSERT INTO topics (name, grade) VALUES (?, ?)').run('x', 6),
    ).toThrow();
  });

  it('enforces grade CHECK constraint on scores', () => {
    db.prepare('INSERT INTO quiz_sessions (id, student_name, grade, mode) VALUES (?, ?, ?, ?)').run(
      'sess1',
      'Siswa',
      7,
      'topic',
    );
    expect(() =>
      db
        .prepare(
          'INSERT INTO scores (session_id, student_name, grade, mode, total_points, max_points, percentage) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .run('sess1', 'Siswa', 6, 'topic', 10, 10, 100),
    ).toThrow();
  });

  it('enforces mode CHECK constraint on scores', () => {
    db.prepare('INSERT INTO quiz_sessions (id, student_name, grade, mode) VALUES (?, ?, ?, ?)').run(
      'sess1',
      'Siswa',
      7,
      'topic',
    );
    expect(() =>
      db
        .prepare(
          'INSERT INTO scores (session_id, student_name, grade, mode, total_points, max_points, percentage) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .run('sess1', 'Siswa', 7, 'invalid_mode', 10, 10, 100),
    ).toThrow();
  });

  it('enforces question type CHECK constraint', () => {
    db.prepare('INSERT INTO topics (name, grade) VALUES (?, ?)').run('t', 7);
    expect(() =>
      db
        .prepare('INSERT INTO questions (topic_id, type, prompt, data) VALUES (?, ?, ?, ?)')
        .run(1, 'invalid', 'p', '{}'),
    ).toThrow();
  });

  it('cascades delete from sessions to session_answers', () => {
    db.prepare('INSERT INTO topics (name, grade) VALUES (?, ?)').run('t', 7);
    db.prepare('INSERT INTO questions (topic_id, type, prompt, data) VALUES (?, ?, ?, ?)').run(
      1,
      'pg',
      'p',
      '{"options":["a"],"correctIndex":0}',
    );
    db.prepare('INSERT INTO quiz_sessions (id, student_name, grade, mode) VALUES (?, ?, ?, ?)').run(
      'sess1',
      'Siswa',
      7,
      'topic',
    );
    db.prepare(
      'INSERT INTO session_answers (session_id, question_id, answer, is_correct) VALUES (?, ?, ?, ?)',
    ).run('sess1', 1, '{}', 0);
    db.prepare('DELETE FROM quiz_sessions WHERE id = ?').run('sess1');
    const count = db.prepare('SELECT COUNT(*) as c FROM session_answers').get() as { c: number };
    expect(count.c).toBe(0);
  });
});
