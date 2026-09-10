export type QuestionType = 'pg' | 'tf' | 'matching' | 'ordering';
export type Grade = 7 | 8 | 9;
export type Mode = 'topic' | 'challenge' | 'campaign';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PgData { options: string[]; correctIndex: number; }
export interface TfData { correctAnswer: boolean; }
export interface MatchingPair { left: string; right: string; }
export interface MatchingData { pairs: MatchingPair[]; }
export interface OrderingData { correctOrder: string[]; }
export type QuestionData = PgData | TfData | MatchingData | OrderingData;

export interface Question {
  id: number;
  topicId: number;
  type: QuestionType;
  prompt: string;
  data: QuestionData;
  difficulty: Difficulty | null;
  points: number;
  createdBy: number | null;
  createdAt: string;
}

/** Question sent to client (kunci stripped). */
export interface ClientQuestion {
  id: number;
  type: QuestionType;
  prompt: string;
  /** Payload without kunci: options for pg, {} for tf, pairs for matching (shuffled), correctOrder omitted for ordering (items sent shuffled). */
  payload: Record<string, unknown>;
  points: number;
}

export interface QuizSession {
  id: string;
  studentName: string;
  grade: Grade;
  mode: Mode;
  topicId: number | null;
  level: number | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface Score {
  id: number;
  sessionId: string;
  studentName: string;
  grade: Grade;
  topicId: number | null;
  mode: Mode;
  totalPoints: number;
  maxPoints: number;
  percentage: number;
  finishedAt: string;
}

export interface SessionAnswer {
  questionId: number;
  answer: Record<string, unknown>;
  isCorrect: boolean;
  pointsEarned: number;
}
