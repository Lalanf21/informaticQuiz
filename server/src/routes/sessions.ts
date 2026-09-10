import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/db';
import { gradeQuestion } from '../lib/score';
import { ApiError } from '../middleware/errorHandler';
import type { Question, SessionAnswer } from '../types';

export const sessionsRouter = Router();

interface QuizSessionRow {
  id: string;
  student_name: string;
  grade: number;
  mode: string;
  topic_id: number | null;
  level: number | null;
  started_at: string;
  finished_at: string | null;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

/** Strip kunci from a Question to produce ClientQuestion payload. */
function stripKunci(q: { type: string; data: unknown }): Record<string, unknown> {
  const d = (typeof q.data === 'string' ? JSON.parse(q.data) : q.data) as any;
  switch (q.type) {
    case 'pg':
      return { options: d.options || [] };
    case 'tf':
      return {};
    case 'matching': {
      const rights = shuffle(Array.isArray(d.pairs) ? d.pairs.map((p: any) => p.right) : []);
      const pairs = Array.isArray(d.pairs) ? d.pairs.map((p: any) => p.left) : [];
      return { pairs, rights };
    }
    case 'ordering': {
      const items = shuffle(Array.isArray(d.correctOrder) ? d.correctOrder : []);
      return { items };
    }
    default:
      return {};
  }
}

// POST /api/sessions — create session + populate session_questions
sessionsRouter.post('/', (req, res, next) => {
  try {
    const { studentName, grade, mode, topicId, level, count } = req.body;
    if (!studentName || typeof studentName !== 'string' || !studentName.trim() || ![7, 8, 9].includes(grade) || !['topic', 'challenge', 'campaign'].includes(mode)) {
      throw new ApiError(400, 'INVALID_INPUT');
    }
    const sessionId = uuid();
    let questionRows: any[];

    if (mode === 'topic') {
      questionRows = db.prepare('SELECT * FROM questions WHERE topic_id = ? ORDER BY RANDOM() LIMIT 20').all(topicId);
    } else if (mode === 'challenge') {
      const limit = Math.min(count || 10, 20);
      questionRows = db.prepare('SELECT questions.* FROM questions JOIN topics ON questions.topic_id = topics.id WHERE topics.grade = ? ORDER BY RANDOM() LIMIT ?').all(grade, limit);
    } else { // campaign
      const diff = level === 1 ? 'easy' : level === 2 ? 'medium' : 'hard';
      questionRows = db.prepare('SELECT * FROM questions WHERE topic_id = ? AND difficulty = ? ORDER BY RANDOM() LIMIT 10').all(topicId, diff);
    }

    if (questionRows.length === 0) throw new ApiError(404, 'NO_QUESTIONS');

    const insertTx = db.transaction((rows: any[]) => {
      db.prepare('INSERT INTO quiz_sessions (id, student_name, grade, mode, topic_id, level) VALUES (?,?,?,?,?,?)').run(sessionId, studentName.trim(), grade, mode, topicId || null, level || null);
      const insertSq = db.prepare('INSERT INTO session_questions (session_id, question_id, order_index) VALUES (?,?,?)');
      rows.forEach((q, i) => insertSq.run(sessionId, q.id, i));
    });
    insertTx(questionRows);

    res.status(201).json({ sessionId });
  } catch (e) { next(e); }
});

// GET /api/sessions/:id/questions
sessionsRouter.get('/:id/questions', (req, res, next) => {
  try {
    const session = db.prepare('SELECT * FROM quiz_sessions WHERE id = ?').get(req.params.id) as QuizSessionRow | undefined;
    if (!session) throw new ApiError(404, 'SESSION_NOT_FOUND');
    const rows = db.prepare('SELECT q.* FROM session_questions sq JOIN questions q ON sq.question_id = q.id WHERE sq.session_id = ? ORDER BY sq.order_index').all(req.params.id) as any[];
    const client = rows.map(q => ({ id: q.id, type: q.type, prompt: q.prompt, payload: stripKunci(q), points: q.points }));
    res.json(client);
  } catch (e) { next(e); }
});

// POST /api/sessions/:id/submit
sessionsRouter.post('/:id/submit', (req, res, next) => {
  try {
    const session = db.prepare('SELECT * FROM quiz_sessions WHERE id = ?').get(req.params.id) as QuizSessionRow | undefined;
    if (!session) throw new ApiError(404, 'SESSION_NOT_FOUND');
    if (session.finished_at) throw new ApiError(409, 'ALREADY_SUBMITTED');

    const answers = (Array.isArray(req.body?.answers) ? req.body.answers : []) as { questionId: number; answer: Record<string, unknown> }[];
    const questionMap = new Map<number, Question>();
    const rows = db.prepare('SELECT q.* FROM session_questions sq JOIN questions q ON sq.question_id = q.id WHERE sq.session_id = ?').all(req.params.id) as any[];
    rows.forEach(q => questionMap.set(q.id, { ...q, data: typeof q.data === 'string' ? JSON.parse(q.data) : q.data }));

    let total = 0;
    const max = rows.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
    const breakdown: SessionAnswer[] = [];
    const seenQuestions = new Set<number>();
    const insertAnswer = db.prepare('INSERT INTO session_answers (session_id, question_id, answer, is_correct, points_earned) VALUES (?,?,?,?,?)');
    const insertScore = db.prepare('INSERT INTO scores (session_id, student_name, grade, topic_id, mode, total_points, max_points, percentage) VALUES (?,?,?,?,?,?,?,?)');
    const finishSession = db.prepare("UPDATE quiz_sessions SET finished_at = datetime('now') WHERE id = ?");

    for (const a of answers) {
      if (!a || typeof a.questionId !== 'number' || seenQuestions.has(a.questionId)) continue;
      const q = questionMap.get(a.questionId);
      if (!q) continue;
      seenQuestions.add(a.questionId);

      const studentAnswer = a.answer || {};
      const result = gradeQuestion(q, studentAnswer);
      total += result.pointsEarned;
      breakdown.push({ questionId: a.questionId, answer: studentAnswer, isCorrect: result.isCorrect, pointsEarned: result.pointsEarned });
    }

    const percentage = max > 0 ? Math.round((total / max) * 10000) / 100 : 0;

    const submitTx = db.transaction(() => {
      for (const b of breakdown) {
        insertAnswer.run(req.params.id, b.questionId, JSON.stringify(b.answer), b.isCorrect ? 1 : 0, b.pointsEarned);
      }
      const scoreResult = insertScore.run(req.params.id, session.student_name, session.grade, session.topic_id, session.mode, total, max, percentage);
      finishSession.run(req.params.id);
      return Number(scoreResult.lastInsertRowid);
    });

    const scoreId = submitTx();

    res.status(201).json({ scoreId, totalPoints: total, maxPoints: max, percentage, breakdown });
  } catch (e) { next(e); }
});

// GET /api/sessions/:id/result
sessionsRouter.get('/:id/result', (req, res, next) => {
  try {
    const session = db.prepare('SELECT * FROM quiz_sessions WHERE id = ?').get(req.params.id) as QuizSessionRow | undefined;
    if (!session) throw new ApiError(404, 'SESSION_NOT_FOUND');
    if (!session.finished_at) throw new ApiError(409, 'NOT_SUBMITTED');
    const score = db.prepare('SELECT * FROM scores WHERE session_id = ?').get(req.params.id);
    const answers = db.prepare('SELECT sa.*, q.prompt, q.type FROM session_answers sa JOIN questions q ON sa.question_id = q.id WHERE sa.session_id = ?').all(req.params.id);
    res.json({ score, answers, level: session.level, topicId: session.topic_id });
  } catch (e) { next(e); }
});
