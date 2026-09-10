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

  it('renders error state when fetching result fails', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));
    renderResult();

    await waitFor(() => {
      expect(screen.getByText('Gagal memuat hasil kuis.')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Kembali ke Topik' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke Topik' }));
    expect(mockedNavigate).toHaveBeenCalledWith('/topics');
  });

  it('unlocks next level in localStorage when campaign mode score is >= 70%', async () => {
    localStorage.clear();
    const campaignResultData = {
      score: {
        mode: 'campaign',
        percentage: 75,
        total_points: 75,
        max_points: 100,
      },
      answers: [],
      level: 1,
      topicId: 2,
    };
    vi.mocked(api.get).mockResolvedValue({ data: campaignResultData });
    renderResult('sess-camp-pass');

    await waitFor(() => {
      const raw = localStorage.getItem('campaign-progress');
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw!)).toEqual({ '2': 2 });
      expect(screen.getByText(/Selamat! Kamu berhasil membuka level berikutnya!/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Mode Campaign' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mode Campaign' }));
    expect(mockedNavigate).toHaveBeenCalledWith('/campaign');
  });

  it('does not unlock next level when campaign mode score is < 70%', async () => {
    localStorage.clear();
    const campaignFailedData = {
      score: {
        mode: 'campaign',
        percentage: 60,
        total_points: 60,
        max_points: 100,
      },
      answers: [],
      level: 1,
      topicId: 2,
    };
    vi.mocked(api.get).mockResolvedValue({ data: campaignFailedData });
    renderResult('sess-camp-fail');

    await waitFor(() => {
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    expect(localStorage.getItem('campaign-progress')).toBeNull();
  });

  it('does not touch campaign progress when mode is not campaign', async () => {
    localStorage.clear();
    const topicResultData = {
      score: {
        mode: 'topic',
        percentage: 90,
        total_points: 90,
        max_points: 100,
      },
      answers: [],
      level: 1,
      topicId: 2,
    };
    vi.mocked(api.get).mockResolvedValue({ data: topicResultData });
    renderResult('sess-topic-pass');

    await waitFor(() => {
      expect(screen.getByText('90%')).toBeInTheDocument();
    });

    expect(localStorage.getItem('campaign-progress')).toBeNull();
  });
});
