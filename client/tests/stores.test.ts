import './setup';
import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../src/stores/usePlayerStore';
import { useQuizStore } from '../src/stores/useQuizStore';
import { useAdminStore } from '../src/stores/useAdminStore';
import { api } from '../src/api/client';
import type { ClientQuestion } from '../src/types';

describe('usePlayerStore', () => {
  beforeEach(() => {
    usePlayerStore.setState({ name: '', grade: null, sessionId: null });
  });

  it('has initial default values', () => {
    const state = usePlayerStore.getState();
    expect(state.name).toBe('');
    expect(state.grade).toBeNull();
    expect(state.sessionId).toBeNull();
  });

  it('updates player name and grade via setPlayer', () => {
    usePlayerStore.getState().setPlayer('Budi', 8);
    const state = usePlayerStore.getState();
    expect(state.name).toBe('Budi');
    expect(state.grade).toBe(8);
  });

  it('updates sessionId via setSessionId', () => {
    usePlayerStore.getState().setSessionId('session-xyz');
    expect(usePlayerStore.getState().sessionId).toBe('session-xyz');

    usePlayerStore.getState().setSessionId(null);
    expect(usePlayerStore.getState().sessionId).toBeNull();
  });
});

describe('useQuizStore', () => {
  const sampleQuestions: ClientQuestion[] = [
    {
      id: 1,
      type: 'pg',
      prompt: 'Pertanyaan 1',
      payload: { options: ['A', 'B', 'C', 'D'] },
      points: 10,
    },
    {
      id: 2,
      type: 'tf',
      prompt: 'Pertanyaan 2',
      payload: {},
      points: 10,
    },
    {
      id: 3,
      type: 'matching',
      prompt: 'Pertanyaan 3',
      payload: {},
      points: 10,
    },
  ];

  beforeEach(() => {
    useQuizStore.getState().reset();
  });

  it('has initial default values', () => {
    const state = useQuizStore.getState();
    expect(state.questions).toEqual([]);
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual({});
    expect(state.startedAt).toBeNull();
    expect(state.mode).toBeNull();
  });

  it('initializes quiz via setQuestions', () => {
    const beforeTime = Date.now();
    useQuizStore.getState().setQuestions(sampleQuestions, 'topic');
    const afterTime = Date.now();

    const state = useQuizStore.getState();
    expect(state.questions).toEqual(sampleQuestions);
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual({});
    expect(state.mode).toBe('topic');
    expect(state.startedAt).toBeGreaterThanOrEqual(beforeTime);
    expect(state.startedAt).toBeLessThanOrEqual(afterTime);
  });

  it('records answers for questions via setAnswer', () => {
    useQuizStore.getState().setQuestions(sampleQuestions, 'challenge');

    useQuizStore.getState().setAnswer(1, { selected: 'B' });
    expect(useQuizStore.getState().answers[1]).toEqual({ selected: 'B' });

    useQuizStore.getState().setAnswer(2, { selected: true });
    expect(useQuizStore.getState().answers[1]).toEqual({ selected: 'B' });
    expect(useQuizStore.getState().answers[2]).toEqual({ selected: true });
  });

  it('clamps currentIndex to 0 when next() is called on empty questions array', () => {
    useQuizStore.getState().reset();
    expect(useQuizStore.getState().questions).toHaveLength(0);
    useQuizStore.getState().next();
    expect(useQuizStore.getState().currentIndex).toBe(0);
  });

  it('handles navigation next and prev with bounds clamping', () => {
    useQuizStore.getState().setQuestions(sampleQuestions, 'campaign');

    // Prev from 0 should clamp to 0
    useQuizStore.getState().prev();
    expect(useQuizStore.getState().currentIndex).toBe(0);

    // Next to index 1
    useQuizStore.getState().next();
    expect(useQuizStore.getState().currentIndex).toBe(1);

    // Next to index 2 (last question)
    useQuizStore.getState().next();
    expect(useQuizStore.getState().currentIndex).toBe(2);

    // Next beyond last should clamp to 2
    useQuizStore.getState().next();
    expect(useQuizStore.getState().currentIndex).toBe(2);

    // Prev back to 1
    useQuizStore.getState().prev();
    expect(useQuizStore.getState().currentIndex).toBe(1);
  });

  it('resets state completely via reset', () => {
    useQuizStore.getState().setQuestions(sampleQuestions, 'topic');
    useQuizStore.getState().setAnswer(1, { selected: 'A' });
    useQuizStore.getState().next();

    useQuizStore.getState().reset();
    const state = useQuizStore.getState();
    expect(state.questions).toEqual([]);
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual({});
    expect(state.startedAt).toBeNull();
    expect(state.mode).toBeNull();
  });

  it('persists state to quiz-storage in localStorage', () => {
    useQuizStore.getState().setQuestions(sampleQuestions, 'topic');
    const raw = localStorage.getItem('quiz-storage');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.mode).toBe('topic');
    expect(parsed.state.questions).toHaveLength(3);
  });
});

describe('useAdminStore', () => {
  beforeEach(() => {
    useAdminStore.getState().logout();
  });

  it('has initial default values', () => {
    const state = useAdminStore.getState();
    expect(state.token).toBeNull();
    expect(state.teacher).toBeNull();
  });

  it('sets token and teacher via setAuth', () => {
    const teacher = { id: 1, username: 'guru1', name: 'Pak Guru' };
    useAdminStore.getState().setAuth('mock-jwt-token', teacher);

    const state = useAdminStore.getState();
    expect(state.token).toBe('mock-jwt-token');
    expect(state.teacher).toEqual(teacher);

    const raw = localStorage.getItem('admin-storage');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.token).toBe('mock-jwt-token');
    expect(parsed.state.teacher).toEqual(teacher);
  });

  it('clears credentials on logout', () => {
    useAdminStore.getState().setAuth('mock-jwt-token', { id: 2, username: 'guru2', name: 'Bu Guru' });
    useAdminStore.getState().logout();

    const state = useAdminStore.getState();
    expect(state.token).toBeNull();
    expect(state.teacher).toBeNull();
  });
});

describe('api client', () => {
  beforeEach(() => {
    window.location.pathname = '/admin/questions';
    window.location.href = '';
  });

  it('has configured baseURL', () => {
    expect(api.defaults.baseURL).toBeDefined();
    expect(typeof api.defaults.baseURL).toBe('string');
  });

  it('passes successful response through interceptor', async () => {
    const fakeResponse = { data: { success: true }, status: 200 } as any;
    const responseHandler = (api.interceptors.response as any).handlers[0]?.fulfilled;
    if (responseHandler) {
      expect(responseHandler(fakeResponse)).toBe(fakeResponse);
    }
  });

  it('redirects to /admin/login and clears admin auth on 401 when in /admin path', async () => {
    useAdminStore.getState().setAuth('stale-token', { id: 1, username: 'admin', name: null });
    const errorHandler = (api.interceptors.response as any).handlers[0]?.rejected;
    expect(errorHandler).toBeDefined();

    const err = { response: { status: 401 } };
    await expect(errorHandler(err)).rejects.toEqual(err);
    expect(window.location.href).toBe('/admin/login');
    expect(useAdminStore.getState().token).toBeNull();
    expect(useAdminStore.getState().teacher).toBeNull();
  });

  it('does not redirect if already on /admin/login', async () => {
    window.location.pathname = '/admin/login';
    const errorHandler = (api.interceptors.response as any).handlers[0]?.rejected;

    const err = { response: { status: 401 } };
    await expect(errorHandler(err)).rejects.toEqual(err);
    expect(window.location.href).toBe('');
  });

  it('does not redirect on 401 when outside /admin path', async () => {
    window.location.pathname = '/quiz/play';
    const errorHandler = (api.interceptors.response as any).handlers[0]?.rejected;

    const err = { response: { status: 401 } };
    await expect(errorHandler(err)).rejects.toEqual(err);
    expect(window.location.href).toBe('');
  });

  it('does not redirect on non-401 errors', async () => {
    const errorHandler = (api.interceptors.response as any).handlers[0]?.rejected;

    const err = { response: { status: 500 } };
    await expect(errorHandler(err)).rejects.toEqual(err);
    expect(window.location.href).toBe('');
  });
});
