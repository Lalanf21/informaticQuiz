// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Result from '../src/pages/Result';
import App from '../src/App';
import { api } from '../src/api/client';

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
  },
}));

const mockResultData = {
  score: {
    percentage: 80,
    total_points: 80,
    max_points: 100,
  },
  answers: [
    {
      id: 1,
      prompt: 'Apa fungsi CPU?',
      is_correct: 1,
      points_earned: 10,
    },
    {
      id: 2,
      prompt: 'RAM adalah memori permanen?',
      is_correct: 0,
      points_earned: 0,
    },
  ],
};

afterEach(() => {
  cleanup();
});

describe('Result page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderResult = (sessionId = 'sess-xyz') => {
    return render(
      <MemoryRouter initialEntries={[`/result/${sessionId}`]}>
        <Routes>
          <Route path="/result/:sessionId" element={<Result />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows loading message before data is fetched', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    renderResult();

    expect(screen.getByText('Memuat hasil...')).toBeInTheDocument();
  });

  it('fetches result from API with sessionId from params', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockResultData });
    renderResult('sess-12345');

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/sessions/sess-12345/result');
    });
  });

  it('renders score percentage and total points', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockResultData });
    renderResult();

    await waitFor(() => {
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('Skor: 80 / 100')).toBeInTheDocument();
    });
    expect(screen.getByText('Hasil Kuis')).toBeInTheDocument();
  });

  it('renders answers breakdown with correct indicators and styles', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockResultData });
    renderResult();

    await waitFor(() => {
      expect(screen.getByText('Apa fungsi CPU?')).toBeInTheDocument();
    });

    expect(screen.getByText('RAM adalah memori permanen?')).toBeInTheDocument();
    expect(screen.getByText('Benar — +10 poin')).toBeInTheDocument();
    expect(screen.getByText('Salah — +0 poin')).toBeInTheDocument();

    const correctAnswerEl = screen.getByText('Apa fungsi CPU?').closest('div');
    const incorrectAnswerEl = screen.getByText('RAM adalah memori permanen?').closest('div');

    expect(correctAnswerEl).toHaveClass('bg-green-50');
    expect(incorrectAnswerEl).toHaveClass('bg-red-50');
  });

  it('navigates to /topics when "Kuis Lagi" button clicked', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockResultData });
    renderResult();

    await waitFor(() => {
      expect(screen.getByText('Kuis Lagi')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Kuis Lagi' }));
    expect(mockedNavigate).toHaveBeenCalledWith('/topics');
  });

  it('navigates to /leaderboard when "Leaderboard" button clicked', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockResultData });
    renderResult();

    await waitFor(() => {
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Leaderboard' }));
    expect(mockedNavigate).toHaveBeenCalledWith('/leaderboard');
  });

  it('renders correctly via App routing at /result/:sessionId', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockResultData });

    render(
      <MemoryRouter initialEntries={['/result/sess-routed']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/sessions/sess-routed/result');
      expect(screen.getByText('Hasil Kuis')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });
});
