import { describe, it, expect } from 'vitest';
import { gradeQuestion } from '../src/lib/score';
import type { Question } from '../src/types';

function mkQuestion(type: any, data: any, points = 10): Question {
  return {
    id: 1,
    topicId: 1,
    type,
    prompt: 'p',
    data,
    difficulty: null,
    points,
    createdBy: null,
    createdAt: '',
  } as Question;
}

describe('gradeQuestion (binary scoring)', () => {
  it('pg correct', () => {
    const q = mkQuestion('pg', { options: ['a', 'b', 'c', 'd'], correctIndex: 2 });
    expect(gradeQuestion(q, { index: 2 })).toEqual({ isCorrect: true, pointsEarned: 10 });
  });
  it('pg wrong', () => {
    const q = mkQuestion('pg', { options: ['a', 'b', 'c', 'd'], correctIndex: 2 });
    expect(gradeQuestion(q, { index: 0 })).toEqual({ isCorrect: false, pointsEarned: 0 });
  });
  it('tf correct', () => {
    const q = mkQuestion('tf', { correctAnswer: true });
    expect(gradeQuestion(q, { value: true })).toEqual({ isCorrect: true, pointsEarned: 10 });
  });
  it('tf wrong', () => {
    const q = mkQuestion('tf', { correctAnswer: true });
    expect(gradeQuestion(q, { value: false })).toEqual({ isCorrect: false, pointsEarned: 0 });
  });
  it('matching all correct', () => {
    const q = mkQuestion('matching', {
      pairs: [
        { left: 'a', right: '1' },
        { left: 'b', right: '2' },
      ],
    });
    expect(gradeQuestion(q, { a: '1', b: '2' })).toEqual({ isCorrect: true, pointsEarned: 10 });
  });
  it('matching one wrong', () => {
    const q = mkQuestion('matching', {
      pairs: [
        { left: 'a', right: '1' },
        { left: 'b', right: '2' },
      ],
    });
    expect(gradeQuestion(q, { a: '1', b: '9' })).toEqual({ isCorrect: false, pointsEarned: 0 });
  });
  it('matching rejects extra keys even if expected pairs match', () => {
    const q = mkQuestion('matching', {
      pairs: [
        { left: 'a', right: '1' },
        { left: 'b', right: '2' },
      ],
    });
    expect(gradeQuestion(q, { a: '1', b: '2', extra: '99' })).toEqual({
      isCorrect: false,
      pointsEarned: 0,
    });
  });
  it('returns false and 0 points if studentAnswer is not an object or null', () => {
    const q = mkQuestion('pg', { options: ['a', 'b'], correctIndex: 0 });
    expect(gradeQuestion(q, null as any)).toEqual({ isCorrect: false, pointsEarned: 0 });
    expect(gradeQuestion(q, undefined as any)).toEqual({ isCorrect: false, pointsEarned: 0 });
    expect(gradeQuestion(q, 'string' as any)).toEqual({ isCorrect: false, pointsEarned: 0 });
  });
  it('ordering correct', () => {
    const q = mkQuestion('ordering', { correctOrder: ['a', 'b', 'c'] });
    expect(gradeQuestion(q, { order: ['a', 'b', 'c'] })).toEqual({
      isCorrect: true,
      pointsEarned: 10,
    });
  });
  it('ordering wrong', () => {
    const q = mkQuestion('ordering', { correctOrder: ['a', 'b', 'c'] });
    expect(gradeQuestion(q, { order: ['c', 'b', 'a'] })).toEqual({
      isCorrect: false,
      pointsEarned: 0,
    });
  });
  it('ordering wrong length', () => {
    const q = mkQuestion('ordering', { correctOrder: ['a', 'b', 'c'] });
    expect(gradeQuestion(q, { order: ['a', 'b'] })).toEqual({ isCorrect: false, pointsEarned: 0 });
    expect(gradeQuestion(q, { order: ['a', 'b', 'c', 'd'] })).toEqual({
      isCorrect: false,
      pointsEarned: 0,
    });
  });
  it('unknown type returns 0 points', () => {
    const q = mkQuestion('unsupported', {});
    expect(gradeQuestion(q, {})).toEqual({ isCorrect: false, pointsEarned: 0 });
  });
  it('custom points', () => {
    const q = mkQuestion('pg', { options: ['a', 'b'], correctIndex: 0 }, 25);
    expect(gradeQuestion(q, { index: 0 })).toEqual({ isCorrect: true, pointsEarned: 25 });
  });
});
