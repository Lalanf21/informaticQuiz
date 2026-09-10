import { describe, it, expect } from 'vitest';
import { validateQuestionData } from '../src/lib/schemas';

describe('validateQuestionData', () => {
  it('accepts valid pg data', () => {
    expect(() => validateQuestionData('pg', { options: ['a', 'b'], correctIndex: 0 })).not.toThrow();
  });
  it('rejects pg with single option', () => {
    expect(() => validateQuestionData('pg', { options: ['a'], correctIndex: 0 })).toThrow();
  });
  it('rejects pg with negative correctIndex', () => {
    expect(() => validateQuestionData('pg', { options: ['a', 'b'], correctIndex: -1 })).toThrow();
  });
  it('rejects pg with out-of-bounds correctIndex', () => {
    expect(() => validateQuestionData('pg', { options: ['a', 'b'], correctIndex: 2 })).toThrow(
      'correctIndex must be within options range',
    );
  });
  it('accepts valid tf data', () => {
    expect(() => validateQuestionData('tf', { correctAnswer: true })).not.toThrow();
  });
  it('rejects non-boolean tf data', () => {
    expect(() => validateQuestionData('tf', { correctAnswer: 'true' })).toThrow();
  });
  it('accepts valid matching data', () => {
    expect(() => validateQuestionData('matching', { pairs: [{ left: 'a', right: 'b' }, { left: 'c', right: 'd' }] })).not.toThrow();
  });
  it('rejects matching with one pair', () => {
    expect(() => validateQuestionData('matching', { pairs: [{ left: 'a', right: 'b' }] })).toThrow();
  });
  it('accepts valid ordering data', () => {
    expect(() => validateQuestionData('ordering', { correctOrder: ['a', 'b', 'c'] })).not.toThrow();
  });
  it('rejects ordering with single item', () => {
    expect(() => validateQuestionData('ordering', { correctOrder: ['a'] })).toThrow();
  });
  it('rejects unsupported question type', () => {
    expect(() => validateQuestionData('unknown' as any, {})).toThrow('Invalid question type: unknown');
  });
});
