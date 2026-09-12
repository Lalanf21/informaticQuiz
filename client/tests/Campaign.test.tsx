// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Campaign, { setProgress, getProgress } from '../src/pages/Campaign';
import CampaignLevel from '../src/pages/CampaignLevel';
import Result from '../src/pages/Result';
import App from '../src/App';
import { usePlayerStore } from '../src/stores/usePlayerStore';
import { useQuizStore } from '../src/stores/useQuizStore';
import { api } from '../src/api/client';
import type { Topic } from '../src/types';

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

const mockTopics: Topic[] = [
  { id: 1, name: 'Sistem Komputer', grade: 7, description: 'Pengenalan perangkat keras' },
  { id: 2, name: 'Jaringan Komputer', grade: 7, description: 'Dasar jaringan' },
];

describe('Campaign mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    usePlayerStore.setState({ name: '', grade: null, sessionId: null });
    useQuizStore.getState().reset();
    vi.mocked(api.get).mockResolvedValue({ data: mockTopics });
    vi.mocked(api.post).mockResolvedValue({ data: { sessionId: 'camp-session-123' } });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Campaign helper functions', () => {
    it('getProgress returns 1 by default when localStorage is empty', () => {
      expect(getProgress(1)).toBe(1);
    });

    it('setProgress saves level + 1 to localStorage', () => {
      setProgress(1, 1);
      expect(getProgress(1)).toBe(2);

      const raw = localStorage.getItem('campaign-progress');
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw!)).toEqual({ '1': 2 });
    });

    it('setProgress unlocks level 3 when completing level 2', () => {
      localStorage.setItem('campaign-progress', JSON.stringify({ 1: 2 }));
      setProgress(1, 2);
      expect(getProgress(1)).toBe(3);
    });

    it('setProgress does not downgrade progress when completing lower level', () => {
      localStorage.setItem('campaign-progress', JSON.stringify({ 1: 3 }));
      setProgress(1, 1);
      expect(getProgress(1)).toBe(3);
    });
  });

  describe('Campaign page', () => {
    it('redirects to "/" when player has no name', () => {
      render(
        <MemoryRouter>
          <Campaign />
        </MemoryRouter>,
      );

      expect(mockedNavigate).toHaveBeenCalledWith('/');
    });

    it('fetches topics for current student grade and displays them', async () => {
      usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });

      render(
        <MemoryRouter>
          <Campaign />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/topics', { params: { grade: 7 } });
        expect(screen.getByText('Mode Campaign')).toBeInTheDocument();
        expect(screen.getByText('Sistem Komputer')).toBeInTheDocument();
        expect(screen.getByText('Jaringan Komputer')).toBeInTheDocument();
      });
    });

    it('locks Level 2 and Level 3 by default, Level 1 is enabled', async () => {
      usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });

      render(
        <MemoryRouter>
          <Campaign />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Sistem Komputer')).toBeInTheDocument();
      });

      const level1Buttons = screen.getAllByRole('button', { name: 'Level 1' });
      const level2Buttons = screen.getAllByRole('button', { name: 'Level 2' });
      const level3Buttons = screen.getAllByRole('button', { name: 'Level 3' });

      expect(level1Buttons[0]).not.toBeDisabled();
      expect(level2Buttons[0]).toBeDisabled();
      expect(level3Buttons[0]).toBeDisabled();
    });

    it('unlocks Level 2 when localStorage has progress 2 for topic', async () => {
      usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });
      localStorage.setItem('campaign-progress', JSON.stringify({ 1: 2 }));

      render(
        <MemoryRouter>
          <Campaign />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Sistem Komputer')).toBeInTheDocument();
      });

      const level1Buttons = screen.getAllByRole('button', { name: 'Level 1' });
      const level2Buttons = screen.getAllByRole('button', { name: 'Level 2' });
      const level3Buttons = screen.getAllByRole('button', { name: 'Level 3' });

      // Topic 1: Level 1 & 2 unlocked, Level 3 locked
      expect(level1Buttons[0]).not.toBeDisabled();
      expect(level2Buttons[0]).not.toBeDisabled();
      expect(level3Buttons[0]).toBeDisabled();

      // Topic 2: Level 1 unlocked, Level 2 & 3 locked
      expect(level1Buttons[1]).not.toBeDisabled();
      expect(level2Buttons[1]).toBeDisabled();
      expect(level3Buttons[1]).toBeDisabled();
    });

    it('navigates to /campaign/:topicId/:n when clicking unlocked level button', async () => {
      usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });
      localStorage.setItem('campaign-progress', JSON.stringify({ 1: 2 }));

      render(
        <MemoryRouter>
          <Campaign />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Sistem Komputer')).toBeInTheDocument();
      });

      const level2Buttons = screen.getAllByRole('button', { name: 'Level 2' });
      fireEvent.click(level2Buttons[0]);

      expect(mockedNavigate).toHaveBeenCalledWith('/campaign/1/2');
    });

    it('renders back to topics button and navigates to /topics', async () => {
      usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });

      render(
        <MemoryRouter>
          <Campaign />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Mode Campaign')).toBeInTheDocument();
      });

      const backBtn = screen.getByRole('button', { name: /Kembali ke Topik/i });
      fireEvent.click(backBtn);
      expect(mockedNavigate).toHaveBeenCalledWith('/topics');
    });
  });

  describe('CampaignLevel page', () => {
    it('redirects to "/" when player has no name', () => {
      render(
        <MemoryRouter initialEntries={['/campaign/1/1']}>
          <Routes>
            <Route path="/campaign/:topicId/:n" element={<CampaignLevel />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(mockedNavigate).toHaveBeenCalledWith('/');
    });

    it('redirects to "/campaign" when accessing a locked level directly via URL', () => {
      usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });
      // default progress is 1, so level 2 is locked
      render(
        <MemoryRouter initialEntries={['/campaign/1/2']}>
          <Routes>
            <Route path="/campaign/:topicId/:n" element={<CampaignLevel />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(mockedNavigate).toHaveBeenCalledWith('/campaign');
      expect(api.post).not.toHaveBeenCalled();
    });

    it('redirects to "/campaign" when level number is invalid (not 1, 2, or 3)', () => {
      usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });
      render(
        <MemoryRouter initialEntries={['/campaign/1/4']}>
          <Routes>
            <Route path="/campaign/:topicId/:n" element={<CampaignLevel />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(mockedNavigate).toHaveBeenCalledWith('/campaign');
      expect(api.post).not.toHaveBeenCalled();
    });

    it('initiates campaign session via POST /api/sessions and navigates to /quiz/:sessionId', async () => {
      usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });
      localStorage.setItem('campaign-progress', JSON.stringify({ 1: 2 }));
      vi.mocked(api.post).mockResolvedValue({ data: { sessionId: 'sess-camp-999' } });

      render(
        <MemoryRouter initialEntries={['/campaign/1/2']}>
          <Routes>
            <Route path="/campaign/:topicId/:n" element={<CampaignLevel />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText('Memuat level...')).toBeInTheDocument();

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/sessions', {
          studentName: 'Budi',
          grade: 7,
          mode: 'campaign',
          topicId: 1,
          level: 2,
        });
      });

      await waitFor(() => {
        expect(usePlayerStore.getState().sessionId).toBe('sess-camp-999');
        expect(useQuizStore.getState().mode).toBe('campaign');
        expect(mockedNavigate).toHaveBeenCalledWith('/quiz/sess-camp-999');
      });
    });
  });

  describe('App routing for Campaign', () => {
    it('routes /campaign to Campaign page', async () => {
      usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });

      render(
        <MemoryRouter initialEntries={['/campaign']}>
          <App />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Mode Campaign')).toBeInTheDocument();
      });
    });

    it('routes /campaign/:topicId/:n to CampaignLevel page', async () => {
      usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });
      vi.mocked(api.post).mockResolvedValue({ data: { sessionId: 'sess-camp-app' } });

      render(
        <MemoryRouter initialEntries={['/campaign/1/1']}>
          <App />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/sessions', {
          studentName: 'Budi',
          grade: 7,
          mode: 'campaign',
          topicId: 1,
          level: 1,
        });
      });
    });
  });

  describe('Campaign full progression flow', () => {
    it('flow: Level 1 locked -> finish level 1 >= 70% -> level 2 becomes unlocked', async () => {
      usePlayerStore.setState({ name: 'Budi', grade: 7, sessionId: null });

      // Step 1: Visit Campaign - level 1 is unlocked, level 2 is locked
      const { unmount } = render(
        <MemoryRouter>
          <Campaign />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Sistem Komputer')).toBeInTheDocument();
      });

      const level1Buttons = screen.getAllByRole('button', { name: 'Level 1' });
      const level2Buttons = screen.getAllByRole('button', { name: 'Level 2' });
      expect(level1Buttons[0]).not.toBeDisabled();
      expect(level2Buttons[0]).toBeDisabled();

      // Click Level 1
      fireEvent.click(level1Buttons[0]);
      expect(mockedNavigate).toHaveBeenCalledWith('/campaign/1/1');
      unmount();

      // Step 2: Complete quiz and view Result with 85% score
      vi.mocked(api.get).mockResolvedValue({
        data: {
          score: {
            mode: 'campaign',
            percentage: 85,
            total_points: 85,
            max_points: 100,
          },
          answers: [],
          level: 1,
          topicId: 1,
        },
      });

      const resultRender = render(
        <MemoryRouter initialEntries={['/result/sess-camp-flow']}>
          <Routes>
            <Route path="/result/:sessionId" element={<Result />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('85%')).toBeInTheDocument();
        expect(
          screen.getByText(/Selamat! Kamu berhasil membuka level berikutnya!/i),
        ).toBeInTheDocument();
      });

      expect(getProgress(1)).toBe(2);
      resultRender.unmount();

      // Step 3: Back to Campaign - level 2 should now be unlocked!
      vi.mocked(api.get).mockResolvedValue({ data: mockTopics });
      render(
        <MemoryRouter>
          <Campaign />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Sistem Komputer')).toBeInTheDocument();
      });

      const updatedLevel2Buttons = screen.getAllByRole('button', { name: 'Level 2' });
      expect(updatedLevel2Buttons[0]).not.toBeDisabled();

      // Click newly unlocked Level 2
      fireEvent.click(updatedLevel2Buttons[0]);
      expect(mockedNavigate).toHaveBeenCalledWith('/campaign/1/2');
    });
  });
});
