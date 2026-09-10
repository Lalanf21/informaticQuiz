// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Challenge from '../src/pages/Challenge';
import QuizPlay from '../src/pages/QuizPlay';
import App from '../src/App';
import { usePlayerStore } from '../src/stores/usePlayerStore';
import { useQuizStore } from '../src/stores/useQuizStore';
import { api } from '../src/api/client';
import type { ClientQuestion } from '../src/types';

const mockedNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

vi.mock('../src/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockQuestions: ClientQuestion[] = [
  {
    id: 201,
    type: 'pg',
    prompt: 'Apa fungsi utama RAM?',
    payload: { options: ['Menyimpan data sementara', 'Menyimpan data permanen', 'Memproses grafis', 'Menghubungkan internet'] },
    points: 10,
  },
  {
    id: 202,
    type: 'tf',
    prompt: 'SSD lebih cepat daripada HDD.',
    payload: {},
    points: 10,
  },
];

describe('Challenge mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePlayerStore.setState({ name: '', grade: null, sessionId: null });
    useQuizStore.getState().reset();
    vi.mocked(api.post).mockResolvedValue({ data: { sessionId: 'chal-session-456' } });
    vi.mocked(api.get).mockResolvedValue({ data: mockQuestions });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Challenge page', () => {
    it('redirects to "/" when player has no name', () => {
      render(
        <MemoryRouter>
          <Challenge />
        </MemoryRouter>
      );

      expect(mockedNavigate).toHaveBeenCalledWith('/');
      expect(screen.queryByText('Mode Tantangan')).not.toBeInTheDocument();
    });

    it('renders heading, question count dropdown, start button, and back link', () => {
      usePlayerStore.setState({ name: 'Andi', grade: 7, sessionId: null });

      render(
        <MemoryRouter>
          <Challenge />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: 'Mode Tantangan' })).toBeInTheDocument();
      expect(screen.getByLabelText('Jumlah soal:')).toBeInTheDocument();

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('10');
      expect(screen.getByRole('option', { name: '5 soal' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '10 soal' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '15 soal' })).toBeInTheDocument();

      expect(screen.getByRole('button', { name: 'Mulai Tantangan' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Kembali ke Pilih Topik' })).toHaveAttribute('href', '/topics');
    });

    it('allows student to change question count', () => {
      usePlayerStore.setState({ name: 'Andi', grade: 7, sessionId: null });

      render(
        <MemoryRouter>
          <Challenge />
        </MemoryRouter>
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: '5' } });
      expect(select.value).toBe('5');

      fireEvent.change(select, { target: { value: '15' } });
      expect(select.value).toBe('15');
    });

    it('creates challenge session with default count (10) and navigates to quiz', async () => {
      usePlayerStore.setState({ name: 'Andi', grade: 8, sessionId: null });

      render(
        <MemoryRouter>
          <Challenge />
        </MemoryRouter>
      );

      const startBtn = screen.getByRole('button', { name: 'Mulai Tantangan' });
      fireEvent.click(startBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/sessions', {
          studentName: 'Andi',
          grade: 8,
          mode: 'challenge',
          count: 10,
        });
      });

      expect(usePlayerStore.getState().sessionId).toBe('chal-session-456');
      expect(useQuizStore.getState().mode).toBe('challenge');
      expect(mockedNavigate).toHaveBeenCalledWith('/quiz/chal-session-456', {
        state: { mode: 'challenge' },
      });
    });

    it('creates challenge session with selected count (5) and navigates', async () => {
      usePlayerStore.setState({ name: 'Citra', grade: 9, sessionId: null });

      render(
        <MemoryRouter>
          <Challenge />
        </MemoryRouter>
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '5' } });

      const startBtn = screen.getByRole('button', { name: 'Mulai Tantangan' });
      fireEvent.click(startBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/sessions', {
          studentName: 'Citra',
          grade: 9,
          mode: 'challenge',
          count: 5,
        });
      });

      expect(mockedNavigate).toHaveBeenCalledWith('/quiz/chal-session-456', {
        state: { mode: 'challenge' },
      });
    });

    it('disables button and displays loading text while session creation is pending', async () => {
      usePlayerStore.setState({ name: 'Andi', grade: 7, sessionId: null });
      let resolvePost: any;
      vi.mocked(api.post).mockReturnValue(new Promise((res) => { resolvePost = res; }));

      render(
        <MemoryRouter>
          <Challenge />
        </MemoryRouter>
      );

      const startBtn = screen.getByRole('button', { name: 'Mulai Tantangan' });
      fireEvent.click(startBtn);

      expect(startBtn).toBeDisabled();
      expect(startBtn).toHaveTextContent('Memuat...');

      // Multiple clicks should not make additional requests
      fireEvent.click(startBtn);
      expect(api.post).toHaveBeenCalledTimes(1);

      resolvePost({ data: { sessionId: 'chal-session-789' } });

      await waitFor(() => {
        expect(mockedNavigate).toHaveBeenCalledWith('/quiz/chal-session-789', {
          state: { mode: 'challenge' },
        });
      });
    });

    it('displays error banner and re-enables button if session creation fails', async () => {
      usePlayerStore.setState({ name: 'Andi', grade: 7, sessionId: null });
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'));

      render(
        <MemoryRouter>
          <Challenge />
        </MemoryRouter>
      );

      const startBtn = screen.getByRole('button', { name: 'Mulai Tantangan' });
      fireEvent.click(startBtn);

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Gagal memulai tantangan. Silakan coba lagi.'
      );
      expect(startBtn).not.toBeDisabled();
      expect(startBtn).toHaveTextContent('Mulai Tantangan');
      expect(mockedNavigate).not.toHaveBeenCalled();
    });

    it('is rendered when navigating to "/challenge" via App router', () => {
      usePlayerStore.setState({ name: 'Andi', grade: 7, sessionId: null });

      render(
        <MemoryRouter initialEntries={['/challenge']}>
          <App />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: 'Mode Tantangan' })).toBeInTheDocument();
    });
  });

  describe('QuizPlay in Challenge mode', () => {
    it('displays Timer in challenge mode with calculated seconds', async () => {
      usePlayerStore.setState({ name: 'Andi', grade: 7, sessionId: 'chal-session-456' });
      useQuizStore.setState({ mode: 'challenge' });

      render(
        <MemoryRouter initialEntries={['/quiz/chal-session-456']}>
          <Routes>
            <Route path="/quiz/:sessionId" element={<QuizPlay />} />
          </Routes>
        </MemoryRouter>
      );

      // 2 questions * 60 = 120s -> 2:00
      expect(await screen.findByRole('timer')).toBeInTheDocument();
      expect(screen.getByRole('timer')).toHaveTextContent('2:00');
    });

    it('does not display Timer in topic mode', async () => {
      usePlayerStore.setState({ name: 'Andi', grade: 7, sessionId: 'topic-session-123' });
      useQuizStore.setState({ mode: 'topic' });

      render(
        <MemoryRouter initialEntries={['/quiz/topic-session-123']}>
          <Routes>
            <Route path="/quiz/:sessionId" element={<QuizPlay />} />
          </Routes>
        </MemoryRouter>
      );

      expect(await screen.findByText('Apa fungsi utama RAM?')).toBeInTheDocument();
      expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    });

    it('caps challenge timer at 600 seconds (10 minutes) for large question counts', async () => {
      const fifteenQuestions: ClientQuestion[] = Array.from({ length: 15 }, (_, i) => ({
        id: 300 + i,
        type: 'tf',
        prompt: `Soal ${i + 1}`,
        payload: {},
        points: 10,
      }));
      vi.mocked(api.get).mockResolvedValueOnce({ data: fifteenQuestions });

      usePlayerStore.setState({ name: 'Andi', grade: 7, sessionId: 'chal-session-456' });
      useQuizStore.setState({ mode: 'challenge' });

      render(
        <MemoryRouter initialEntries={['/quiz/chal-session-456']}>
          <Routes>
            <Route path="/quiz/:sessionId" element={<QuizPlay />} />
          </Routes>
        </MemoryRouter>
      );

      // 15 questions * 60 = 900s, capped at 600s = 10:00
      expect(await screen.findByRole('timer')).toBeInTheDocument();
      expect(screen.getByRole('timer')).toHaveTextContent('10:00');
    });

    it('auto-submits answers when timer expires in challenge mode', async () => {
      vi.useFakeTimers();

      usePlayerStore.setState({ name: 'Andi', grade: 7, sessionId: 'chal-session-456' });
      useQuizStore.setState({ mode: 'challenge' });

      render(
        <MemoryRouter initialEntries={['/quiz/chal-session-456']}>
          <Routes>
            <Route path="/quiz/:sessionId" element={<QuizPlay />} />
          </Routes>
        </MemoryRouter>
      );

      // Wait for questions to load
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByRole('timer')).toBeInTheDocument();
      expect(screen.getByRole('timer')).toHaveTextContent('2:00');

      // Answer question 1
      fireEvent.click(screen.getByRole('button', { name: 'Menyimpan data sementara' }));

      // Fast-forward 120 seconds to trigger timer expiration
      await act(async () => {
        vi.advanceTimersByTime(120000);
      });

      expect(api.post).toHaveBeenCalledWith('/api/sessions/chal-session-456/submit', {
        answers: [
          { questionId: 201, answer: { index: 0 } },
          { questionId: 202, answer: {} },
        ],
      });

      expect(useQuizStore.getState().questions).toEqual([]);
      expect(mockedNavigate).toHaveBeenCalledWith('/result/chal-session-456');

      vi.useRealTimers();
    });
  });
});
