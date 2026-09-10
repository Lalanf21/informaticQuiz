// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import QuizPlay from '../src/pages/QuizPlay';
import ProgressBar from '../src/components/ProgressBar';
import App from '../src/App';
import { useQuizStore } from '../src/stores/useQuizStore';
import { usePlayerStore } from '../src/stores/usePlayerStore';
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
    id: 101,
    type: 'pg',
    prompt: 'Apa kepanjangan dari CPU?',
    payload: { options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Port Unit', 'Control Program Unit'] },
    points: 10,
  },
  {
    id: 102,
    type: 'tf',
    prompt: 'RAM adalah memori non-volatile.',
    payload: {},
    points: 10,
  },
  {
    id: 103,
    type: 'ordering',
    prompt: 'Urutkan dari yang terkecil:',
    payload: { items: ['Byte', 'Kilobyte', 'Megabyte', 'Gigabyte'] },
    points: 15,
  },
];

afterEach(() => {
  cleanup();
});

describe('ProgressBar', () => {
  it('renders progress bar with 0% width when total is 0', () => {
    render(<ProgressBar current={0} total={0} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    const bar = progressbar.firstElementChild as HTMLElement;
    expect(bar.style.width).toBe('0%');
  });

  it('renders progress bar with correct percentage based on current and total', () => {
    const { rerender } = render(<ProgressBar current={0} total={4} />);
    const progressbar = screen.getByRole('progressbar');
    const bar = progressbar.firstElementChild as HTMLElement;
    // (0 + 1) / 4 * 100 = 25%
    expect(bar.style.width).toBe('25%');

    rerender(<ProgressBar current={3} total={4} />);
    // (3 + 1) / 4 * 100 = 100%
    expect(bar.style.width).toBe('100%');
  });
});

describe('QuizPlay page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQuizStore.getState().reset();
    usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: 'session-123' });
    vi.mocked(api.get).mockResolvedValue({ data: mockQuestions });
    vi.mocked(api.post).mockResolvedValue({ data: { score: 100 } });
  });

  const renderQuizPlay = (sessionId = 'session-123') => {
    return render(
      <MemoryRouter initialEntries={[`/quiz/${sessionId}`]}>
        <Routes>
          <Route path="/quiz/:sessionId" element={<QuizPlay />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows loading state initially while fetching questions', () => {
    let resolveGet: any;
    vi.mocked(api.get).mockReturnValue(new Promise((res) => { resolveGet = res; }));

    renderQuizPlay();
    expect(screen.getByText('Memuat...')).toBeInTheDocument();

    resolveGet({ data: mockQuestions });
  });

  it('shows empty message when questions array is empty', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    renderQuizPlay();

    expect(await screen.findByText('Topik belum punya soal.')).toBeInTheDocument();
  });

  it('shows error message when questions fetch fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    renderQuizPlay();

    expect(await screen.findByRole('alert')).toHaveTextContent('Gagal memuat soal.');
  });

  it('renders question prompt, QuestionRenderer, and progress bar', async () => {
    renderQuizPlay();

    expect(await screen.findByText('Apa kepanjangan dari CPU?')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Central Processing Unit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sebelumnya' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Berikutnya' })).toBeInTheDocument();
  });

  it('allows navigating forward and backward between questions', async () => {
    renderQuizPlay();

    expect(await screen.findByText('Apa kepanjangan dari CPU?')).toBeInTheDocument();
    const nextBtn = screen.getByRole('button', { name: 'Berikutnya' });
    fireEvent.click(nextBtn);

    // Should now be on question 2
    expect(await screen.findByText('RAM adalah memori non-volatile.')).toBeInTheDocument();
    const prevBtn = screen.getByRole('button', { name: 'Sebelumnya' });
    expect(prevBtn).not.toBeDisabled();

    // Click Sebelumnya
    fireEvent.click(prevBtn);
    expect(await screen.findByText('Apa kepanjangan dari CPU?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sebelumnya' })).toBeDisabled();
  });

  it('records answers in useQuizStore when an option is selected', async () => {
    renderQuizPlay();

    expect(await screen.findByText('Apa kepanjangan dari CPU?')).toBeInTheDocument();
    const option = screen.getByRole('button', { name: 'Central Processing Unit' });
    fireEvent.click(option);

    expect(useQuizStore.getState().answers[101]).toEqual({ index: 0 });
  });

  it('shows "Selesai & Submit" button on the last question and submits quiz', async () => {
    renderQuizPlay();

    expect(await screen.findByText('Apa kepanjangan dari CPU?')).toBeInTheDocument();

    // Answer question 1
    fireEvent.click(screen.getByRole('button', { name: 'Central Processing Unit' }));

    // Go to question 2
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    expect(await screen.findByText('RAM adalah memori non-volatile.')).toBeInTheDocument();

    // Go to question 3 (last question)
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    expect(await screen.findByText('Urutkan dari yang terkecil:')).toBeInTheDocument();

    // Last question shows Selesai & Submit
    expect(screen.queryByRole('button', { name: 'Berikutnya' })).not.toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: 'Selesai & Submit' });
    expect(submitBtn).toBeInTheDocument();

    // Click submit
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/sessions/session-123/submit', {
        answers: [
          { questionId: 101, answer: { index: 0 } },
          { questionId: 102, answer: {} },
          { questionId: 103, answer: { order: ['Byte', 'Kilobyte', 'Megabyte', 'Gigabyte'] } },
        ],
      });
    });

    expect(useQuizStore.getState().questions).toEqual([]);
    expect(mockedNavigate).toHaveBeenCalledWith('/result/session-123');
  });

  it('prevents double-submitting while submit request is in flight', async () => {
    let resolvePost: any;
    const postPromise = new Promise((res) => { resolvePost = res; });
    vi.mocked(api.post).mockReturnValue(postPromise as any);

    renderQuizPlay();

    expect(await screen.findByText('Apa kepanjangan dari CPU?')).toBeInTheDocument();
    // Navigate to last question
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    await screen.findByText('RAM adalah memori non-volatile.');
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    await screen.findByText('Urutkan dari yang terkecil:');

    const submitBtn = screen.getByRole('button', { name: 'Selesai & Submit' });
    fireEvent.click(submitBtn);

    // Button should be disabled / submitting
    expect(submitBtn).toBeDisabled();

    // Try clicking again
    fireEvent.click(submitBtn);

    expect(api.post).toHaveBeenCalledTimes(1);

    resolvePost({ data: { score: 100 } });

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/result/session-123');
    });
  });

  it('displays error banner and re-enables submit button if submission fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Network failure'));

    renderQuizPlay();

    expect(await screen.findByText('Apa kepanjangan dari CPU?')).toBeInTheDocument();
    // Navigate to last question
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    await screen.findByText('RAM adalah memori non-volatile.');
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }));
    await screen.findByText('Urutkan dari yang terkecil:');

    const submitBtn = screen.getByRole('button', { name: 'Selesai & Submit' });
    fireEvent.click(submitBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent('Gagal mengirim jawaban. Silakan coba lagi.');
    expect(submitBtn).not.toBeDisabled();
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  it('renders QuizPlay through App router at path "/quiz/:sessionId"', async () => {
    render(
      <MemoryRouter initialEntries={['/quiz/session-999']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Apa kepanjangan dari CPU?')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/api/sessions/session-999/questions');
  });
});
