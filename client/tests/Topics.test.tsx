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
      </MemoryRouter>
    );

    expect(mockedNavigate).toHaveBeenCalledWith('/');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('fetches topics with player grade and renders cards and greeting', async () => {
    usePlayerStore.setState({ name: 'Budi Santoso', grade: 7, sessionId: null });

    render(
      <MemoryRouter>
        <Topics />
      </MemoryRouter>
    );

    expect(mockedNavigate).not.toHaveBeenCalled();
    expect(api.get).toHaveBeenCalledWith('/api/topics', { params: { grade: 7 } });

    expect(await screen.findByText('Halo, Budi Santoso! Pilih topik:')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Algoritma Pemrograman' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Jaringan Komputer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sistem Operasi' })).toBeInTheDocument();
    expect(screen.getAllByText('Kelas 7')).toHaveLength(3);
  });

  it('starts quiz on topic card click, updates sessionId in store, and navigates to quiz page', async () => {
    usePlayerStore.setState({ name: 'Dewi', grade: 8, sessionId: null });
    vi.mocked(api.get).mockResolvedValue({
      data: [{ id: 4, name: 'Basis Data', grade: 8, description: 'SQL dasar' }],
    });

    render(
      <MemoryRouter>
        <Topics />
      </MemoryRouter>
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

  it('navigates to /challenge when Mode Tantangan button is clicked', async () => {
    usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });

    render(
      <MemoryRouter>
        <Topics />
      </MemoryRouter>
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
      </MemoryRouter>
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
      </MemoryRouter>
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
      </MemoryRouter>
    );

    expect(await screen.findByText('Halo, Siti! Pilih topik:')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kecerdasan Buatan' })).toBeInTheDocument();
  });
});
