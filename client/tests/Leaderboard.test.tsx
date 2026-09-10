// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Leaderboard from '../src/pages/Leaderboard';
import App from '../src/App';
import { api } from '../src/api/client';

vi.mock('../src/api/client', () => ({
  api: {
    get: vi.fn(),
  },
}));

const mockScores = [
  {
    id: 1,
    student_name: 'Budi Santoso',
    grade: 7,
    mode: 'topic',
    total_points: 100,
    percentage: 100,
  },
  {
    id: 2,
    student_name: 'Siti Rahma',
    grade: 8,
    mode: 'challenge',
    total_points: 85,
    percentage: 85,
  },
];

afterEach(() => {
  cleanup();
});

describe('Leaderboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLeaderboard = () => {
    return render(
      <MemoryRouter initialEntries={['/leaderboard']}>
        <Routes>
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders header, navigation links, filters, and table headers', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    renderLeaderboard();

    expect(screen.getByRole('heading', { name: 'Leaderboard' })).toBeInTheDocument();
    expect(screen.getByTestId('link-home')).toHaveAttribute('href', '/');
    expect(screen.getByTestId('link-topics')).toHaveAttribute('href', '/topics');
    expect(screen.getByLabelText('Filter mode')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter kelas')).toBeInTheDocument();

    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('Nama')).toBeInTheDocument();
    expect(screen.getByText('Kelas')).toBeInTheDocument();
    expect(screen.getByText('Skor')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('fetches leaderboard on initial mount with no filter params', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockScores });
    renderLeaderboard();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/scores/leaderboard', {
        params: {},
        signal: expect.any(AbortSignal),
      });
    });
  });

  it('renders list of scores with rank, name, grade, score, and percentage', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockScores });
    renderLeaderboard();

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    });

    expect(screen.getByText('Siti Rahma')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('filters by mode when mode dropdown changes', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockScores });
    renderLeaderboard();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/scores/leaderboard', {
        params: {},
        signal: expect.any(AbortSignal),
      });
    });

    fireEvent.change(screen.getByLabelText('Filter mode'), {
      target: { value: 'challenge' },
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/scores/leaderboard', {
        params: { mode: 'challenge' },
        signal: expect.any(AbortSignal),
      });
    });
  });

  it('filters by grade when grade dropdown changes', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockScores });
    renderLeaderboard();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/scores/leaderboard', {
        params: {},
        signal: expect.any(AbortSignal),
      });
    });

    fireEvent.change(screen.getByLabelText('Filter kelas'), {
      target: { value: '8' },
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/scores/leaderboard', {
        params: { grade: '8' },
        signal: expect.any(AbortSignal),
      });
    });
  });

  it('filters by both mode and grade simultaneously', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockScores });
    renderLeaderboard();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/scores/leaderboard', {
        params: {},
        signal: expect.any(AbortSignal),
      });
    });

    fireEvent.change(screen.getByLabelText('Filter mode'), {
      target: { value: 'campaign' },
    });
    fireEvent.change(screen.getByLabelText('Filter kelas'), {
      target: { value: '9' },
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/scores/leaderboard', {
        params: { mode: 'campaign', grade: '9' },
        signal: expect.any(AbortSignal),
      });
    });
  });

  it('aborts previous request when filters change rapidly or on unmount', async () => {
    let capturedSignal: AbortSignal | undefined;
    vi.mocked(api.get).mockImplementation((_url, config: any) => {
      capturedSignal = config?.signal;
      return new Promise(() => {}); // never resolves
    });

    const { unmount } = renderLeaderboard();
    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('shows empty message when no scores found', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    renderLeaderboard();

    await waitFor(() => {
      expect(screen.getByText('Belum ada data skor')).toBeInTheDocument();
    });
  });

  it('shows error banner when fetching fails', async () => {
    vi.mocked(api.get).mockRejectedValue({
      response: { data: { error: 'Gagal memuat skor terbaru' } },
    });
    renderLeaderboard();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Gagal memuat skor terbaru');
    });
  });

  it('supports camelCase score properties', async () => {
    const camelScores = [
      {
        id: 10,
        studentName: 'Dewi Lestari',
        grade: 9,
        mode: 'topic',
        totalPoints: 95,
        percentage: 95,
      },
    ];
    vi.mocked(api.get).mockResolvedValue({ data: camelScores });
    renderLeaderboard();

    await waitFor(() => {
      expect(screen.getByText('Dewi Lestari')).toBeInTheDocument();
      expect(screen.getByText('95')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
    });
  });

  it('renders through App router at /leaderboard', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockScores });

    render(
      <MemoryRouter initialEntries={['/leaderboard']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Leaderboard' })).toBeInTheDocument();
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    });
  });
});
