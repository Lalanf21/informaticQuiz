export type QuestionType = 'pg' | 'tf' | 'matching' | 'ordering';
export type Grade = 7 | 8 | 9;
export type Mode = 'topic' | 'challenge' | 'campaign';

export interface ClientQuestion {
  id: number;
  type: QuestionType;
  prompt: string;
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

export interface Topic {
  id: number;
  name: string;
  grade: Grade;
  description: string | null;
}
