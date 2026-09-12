// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import Topics from '../src/pages/Topics';
import App from '../src/App';
import { usePlayerStore } from '../src/stores/usePlayerStore';
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
    post: vi.fn(),
  },
}));

const mockTopics = [
  { id: 1, name: 'Algoritma Pemrograman', grade: 7, description: 'Dasar logika' },
  { id: 2, name: 'Jaringan Komputer', grade: 7, description: 'Topologi & IP' },
  { id: 3, name: 'Sistem Operasi', grade: 7, description: 'OS dasar' },
];

describe('Topics page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePlayerStore.setState({ name: '', grade: null, sessionId: null });
    vi.mocked(api.get).mockResolvedValue({ data: mockTopics });
    vi.mocked(api.post).mockResolvedValue({ data: { sessionId: 'session-uuid-123' } });
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects to "/" when player has no name', () => {
    render(
      <MemoryRouter>
        <Topics />
      </MemoryRouter>,
    );

    expect(mockedNavigate).toHaveBeenCalledWith('/');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('renders loading state before topics resolve, then renders cards and greeting', async () => {
    usePlayerStore.setState({ name: 'Budi Santoso', grade: 7, sessionId: null });

    render(
      <MemoryRouter>
        <Topics />
      </MemoryRouter>,
    );

    expect(screen.getByText('Memuat topik...')).toBeInTheDocument();

    expect(await screen.findByText('Halo, Budi Santoso! Pilih topik:')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Algoritma Pemrograman' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Jaringan Komputer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sistem Operasi' })).toBeInTheDocument();
    expect(screen.getAllByText('Kelas 7')).toHaveLength(3);
  });

  it('renders empty state when no topics are returned', async () => {
    usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <Topics />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Tidak ada topik tersedia.')).toBeInTheDocument();
  });

  it('renders error message when topics fetch fails', async () => {
    usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <Topics />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Gagal memuat topik');
  });

  it('starts quiz on topic card click, updates sessionId in store, and navigates to quiz page', async () => {
    usePlayerStore.setState({ name: 'Dewi', grade: 8, sessionId: null });
    vi.mocked(api.get).mockResolvedValue({
      data: [{ id: 4, name: 'Basis Data', grade: 8, description: 'SQL dasar' }],
    });

    render(
      <MemoryRouter>
        <Topics />
      </MemoryRouter>,
    );

    const topicButton = await screen.findByRole('button', { name: /Basis Data/ });
    fireEvent.click(topicButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/sessions', {
        studentName: 'Dewi',
        grade: 8,
        mode: 'topic',
        topicId: 4,
      });
    });

    expect(usePlayerStore.getState().sessionId).toBe('session-uuid-123');
    expect(mockedNavigate).toHaveBeenCalledWith('/quiz/session-uuid-123');
  });

  it('disables buttons and prevents duplicate session creation on rapid clicks', async () => {
    usePlayerStore.setState({ name: 'Eko', grade: 7, sessionId: null });
    let resolvePost: (value: any) => void = () => {};
    const deferredPost = new Promise((resolve) => {
      resolvePost = resolve;
    });
    vi.mocked(api.post).mockReturnValue(deferredPost as any);

    render(
      <MemoryRouter>
        <Topics />
      </MemoryRouter>,
    );

    const topicButton = await screen.findByRole('button', { name: /Algoritma Pemrograman/ });
    fireEvent.click(topicButton);

    // Topic button is now disabled with loading indicator
    expect(topicButton).toBeDisabled();
    expect(screen.getByText(/Memuat\.\.\./)).toBeInTheDocument();

    // Click again while in-flight
    fireEvent.click(topicButton);

    // Second card is also disabled
    const secondButton = screen.getByRole('button', { name: /Jaringan Komputer/ });
    expect(secondButton).toBeDisabled();
    fireEvent.click(secondButton);

    expect(api.post).toHaveBeenCalledTimes(1);

    // Resolve in-flight request
    resolvePost({ data: { sessionId: 'session-eko-1' } });

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/quiz/session-eko-1');
    });
  });

  it('displays error alert and re-enables buttons if startQuiz fails', async () => {
    usePlayerStore.setState({ name: 'Fani', grade: 7, sessionId: null });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Internal server error'));

    render(
      <MemoryRouter>
        <Topics />
      </MemoryRouter>,
    );

    const topicButton = await screen.findByRole('button', { name: /Algoritma Pemrograman/ });
    fireEvent.click(topicButton);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Gagal memulai kuis. Silakan coba lagi.',
    );
    expect(topicButton).not.toBeDisabled();
    expect(mockedNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/quiz/'));
  });

  it('navigates to /challenge when Mode Tantangan button is clicked', async () => {
    usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });

    render(
      <MemoryRouter>
        <Topics />
      </MemoryRouter>,
    );

    const challengeButton = await screen.findByRole('button', { name: 'Mode Tantangan' });
    fireEvent.click(challengeButton);

    expect(mockedNavigate).toHaveBeenCalledWith('/challenge');
  });

  it('navigates to /campaign when Mode Campaign button is clicked', async () => {
    usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });

    render(
      <MemoryRouter>
        <Topics />
      </MemoryRouter>,
    );

    const campaignButton = await screen.findByRole('button', { name: 'Mode Campaign' });
    fireEvent.click(campaignButton);

    expect(mockedNavigate).toHaveBeenCalledWith('/campaign');
  });

  it('navigates to /leaderboard when Leaderboard button is clicked', async () => {
    usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });

    render(
      <MemoryRouter>
        <Topics />
      </MemoryRouter>,
    );

    const leaderboardButton = await screen.findByRole('button', { name: 'Leaderboard' });
    fireEvent.click(leaderboardButton);

    expect(mockedNavigate).toHaveBeenCalledWith('/leaderboard');
  });

  it('renders Topics page via App router at path "/topics"', async () => {
    usePlayerStore.setState({ name: 'Siti', grade: 9, sessionId: null });
    vi.mocked(api.get).mockResolvedValue({
      data: [{ id: 5, name: 'Kecerdasan Buatan', grade: 9, description: null }],
    });

    render(
      <MemoryRouter initialEntries={['/topics']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Halo, Siti! Pilih topik:')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kecerdasan Buatan' })).toBeInTheDocument();
  });
});
