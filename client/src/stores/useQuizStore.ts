import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClientQuestion } from '../types';

interface QuizState {
  questions: ClientQuestion[];
  currentIndex: number;
  answers: Record<number, Record<string, unknown>>;
  startedAt: number | null;
  mode: 'topic' | 'challenge' | 'campaign' | null;
  setQuestions: (q: ClientQuestion[], mode: 'topic' | 'challenge' | 'campaign') => void;
  setAnswer: (questionId: number, answer: Record<string, unknown>) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      questions: [],
      currentIndex: 0,
      answers: {},
      startedAt: null,
      mode: null,
      setQuestions: (q, mode) => set({ questions: q, currentIndex: 0, answers: {}, startedAt: Date.now(), mode }),
      setAnswer: (questionId, answer) => set((s) => ({ answers: { ...s.answers, [questionId]: answer } })),
      next: () =>
        set((s) => ({
          currentIndex: s.questions.length > 0 ? Math.min(s.currentIndex + 1, s.questions.length - 1) : 0,
        })),
      prev: () => set((s) => ({ currentIndex: Math.max(s.currentIndex - 1, 0) })),
      reset: () => set({ questions: [], currentIndex: 0, answers: {}, startedAt: null, mode: null }),
    }),
    { name: 'quiz-storage' },
  ),
);
