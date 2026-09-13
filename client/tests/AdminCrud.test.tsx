// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminTopics from '../src/pages/AdminTopics';
import AdminQuestions from '../src/pages/AdminQuestions';
import App from '../src/App';
import { api } from '../src/api/client';
import { useAdminStore } from '../src/stores/useAdminStore';

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
    delete: vi.fn(),
  },
}));

describe('Admin CRUD Pages', () => {
  const mockTopics = [
    { id: 1, name: 'Algoritma Pemrograman', grade: 7, description: 'Logika dasar' },
    { id: 2, name: 'Jaringan Komputer', grade: 8, description: 'LAN dan WAN' },
  ];

  const mockQuestions = [
    {
      id: 10,
      topic_id: 1,
      type: 'pg',
      prompt: 'Apa itu pseudocode?',
      data: { options: ['Kode semu', 'Bahasa mesin'], correctIndex: 0 },
      difficulty: 'easy',
      points: 10,
    },
    {
      id: 11,
      topic_id: 2,
      type: 'tf',
      prompt: 'IP address berupa angka.',
      data: { correctAnswer: true },
      difficulty: 'medium',
      points: 15,
    },
  ];

  beforeEach(() => {
    mockedNavigate.mockReset();
    vi.clearAllMocks();
    useAdminStore.getState().logout();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('AdminTopics', () => {
    it('redirects to /admin/login when token is missing', () => {
      render(
        <MemoryRouter>
          <AdminTopics />
        </MemoryRouter>,
      );

      expect(mockedNavigate).toHaveBeenCalledWith('/admin/login');
      expect(api.get).not.toHaveBeenCalled();
    });

    it('loads and displays topics with authorization header', async () => {
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockTopics });

      render(
        <MemoryRouter>
          <AdminTopics />
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: 'Kelola Topik' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Soal' })).toHaveAttribute(
        'href',
        '/admin/questions',
      );

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/admin/topics', {
          headers: { Authorization: 'Bearer test-token' },
        });
      });

      expect(await screen.findByText('Algoritma Pemrograman (Kelas 7)')).toBeInTheDocument();
      expect(screen.getByText('Jaringan Komputer (Kelas 8)')).toBeInTheDocument();
    });

    it('adds a new topic and reloads topic list', async () => {
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockTopics })
        .mockResolvedValueOnce({
          data: [...mockTopics, { id: 3, name: 'Sistem Operasi', grade: 9, description: null }],
        });
      vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 3 } });

      render(
        <MemoryRouter>
          <AdminTopics />
        </MemoryRouter>,
      );

      await screen.findByText('Algoritma Pemrograman (Kelas 7)');

      const nameInput = screen.getByPlaceholderText('Nama topik');
      fireEvent.change(nameInput, { target: { value: 'Sistem Operasi' } });
      const gradeSelect = screen.getByRole('combobox');
      fireEvent.change(gradeSelect, { target: { value: '9' } });

      fireEvent.click(screen.getByRole('button', { name: 'Tambah' }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/admin/topics',
          { name: 'Sistem Operasi', grade: 9 },
          { headers: { Authorization: 'Bearer test-token' } },
        );
      });

      expect(nameInput).toHaveValue('');
      expect(await screen.findByText('Sistem Operasi (Kelas 9)')).toBeInTheDocument();
    });

    it('deletes a topic when confirmed and reloads topic list', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockTopics })
        .mockResolvedValueOnce({ data: [mockTopics[1]] });
      vi.mocked(api.delete).mockResolvedValueOnce({ data: { ok: true } });

      render(
        <MemoryRouter>
          <AdminTopics />
        </MemoryRouter>,
      );

      await screen.findByText('Algoritma Pemrograman (Kelas 7)');

      const deleteButtons = screen.getAllByRole('button', { name: 'Hapus' });
      fireEvent.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith('Yakin ingin menghapus?');

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith('/api/admin/topics/1', {
          headers: { Authorization: 'Bearer test-token' },
        });
      });

      await waitFor(() => {
        expect(screen.queryByText('Algoritma Pemrograman (Kelas 7)')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Jaringan Komputer (Kelas 8)')).toBeInTheDocument();
    });

    it('cancels topic deletion when user rejects confirmation', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockTopics });

      render(
        <MemoryRouter>
          <AdminTopics />
        </MemoryRouter>,
      );

      await screen.findByText('Algoritma Pemrograman (Kelas 7)');

      const deleteButtons = screen.getAllByRole('button', { name: 'Hapus' });
      fireEvent.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith('Yakin ingin menghapus?');
      expect(api.delete).not.toHaveBeenCalled();
    });
  });

  describe('AdminQuestions', () => {
    it('redirects to /admin/login when token is missing', () => {
      render(
        <MemoryRouter>
          <AdminQuestions />
        </MemoryRouter>,
      );

      expect(mockedNavigate).toHaveBeenCalledWith('/admin/login');
      expect(api.get).not.toHaveBeenCalled();
    });

    it('loads and displays questions, topics, and form inputs', async () => {
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockQuestions })
        .mockResolvedValueOnce({ data: mockTopics });

      render(
        <MemoryRouter>
          <AdminQuestions />
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: 'Kelola Soal' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Topik' })).toHaveAttribute(
        'href',
        '/admin/topics',
      );

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/admin/questions', {
          headers: { Authorization: 'Bearer test-token' },
        });
        expect(api.get).toHaveBeenCalledWith('/api/admin/topics', {
          headers: { Authorization: 'Bearer test-token' },
        });
      });

      expect(await screen.findByText('Apa itu pseudocode?')).toBeInTheDocument();
      expect(screen.getByText('IP address berupa angka.')).toBeInTheDocument();
    });

    it('shows notice and disables submit button when topics list is empty', async () => {
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get).mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] });

      render(
        <MemoryRouter>
          <AdminQuestions />
        </MemoryRouter>,
      );

      expect(await screen.findByText('Silakan buat topik terlebih dahulu')).toBeInTheDocument();
      const submitButton = screen.getByRole('button', { name: 'Simpan' });
      expect(submitButton).toBeDisabled();
    });

    it('provides default sample JSON template when changing question type', async () => {
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockQuestions })
        .mockResolvedValueOnce({ data: mockTopics });

      render(
        <MemoryRouter>
          <AdminQuestions />
        </MemoryRouter>,
      );

      await screen.findByText('Apa itu pseudocode?');

      const typeSelect = screen.getByLabelText('Tipe Soal');
      const dataTextarea = screen.getByPlaceholderText(/JSON data/);

      // Default type is 'pg'
      expect(dataTextarea).toHaveValue('{"options":["A","B","C","D"],"correctIndex":0}');

      // Change to tf
      fireEvent.change(typeSelect, { target: { value: 'tf' } });
      expect(dataTextarea).toHaveValue('{"correctAnswer":true}');

      // Change to matching
      fireEvent.change(typeSelect, { target: { value: 'matching' } });
      expect(dataTextarea).toHaveValue(
        '{"pairs":[{"left":"Istilah 1","right":"Definisi 1"},{"left":"Istilah 2","right":"Definisi 2"}]}',
      );

      // Change to ordering
      fireEvent.change(typeSelect, { target: { value: 'ordering' } });
      expect(dataTextarea).toHaveValue('{"correctOrder":["Langkah 1","Langkah 2","Langkah 3"]}');
    });

    it('submits a new question with parsed JSON and reloads question list', async () => {
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockQuestions })
        .mockResolvedValueOnce({ data: mockTopics });

      render(
        <MemoryRouter>
          <AdminQuestions />
        </MemoryRouter>,
      );

      await screen.findByText('Apa itu pseudocode?');

      fireEvent.change(screen.getByLabelText('Pilih Topik'), { target: { value: '2' } });
      fireEvent.change(screen.getByLabelText('Tipe Soal'), { target: { value: 'tf' } });
      fireEvent.change(screen.getByPlaceholderText('Prompt soal'), {
        target: { value: 'Kabel UTP pakai konektor RJ45?' },
      });
      fireEvent.change(screen.getByPlaceholderText(/JSON data/), {
        target: { value: '{"correctAnswer": true}' },
      });
      fireEvent.change(screen.getByLabelText('Tingkat Kesulitan'), { target: { value: 'medium' } });
      fireEvent.change(screen.getByLabelText('Poin'), { target: { value: '20' } });

      vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 12 } });
      vi.mocked(api.get)
        .mockResolvedValueOnce({
          data: [
            ...mockQuestions,
            {
              id: 12,
              topic_id: 2,
              type: 'tf',
              prompt: 'Kabel UTP pakai konektor RJ45?',
              data: { correctAnswer: true },
              difficulty: 'medium',
              points: 20,
            },
          ],
        })
        .mockResolvedValueOnce({ data: mockTopics });

      fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/admin/questions',
          {
            topicId: 2,
            type: 'tf',
            prompt: 'Kabel UTP pakai konektor RJ45?',
            data: { correctAnswer: true },
            difficulty: 'medium',
            points: 20,
          },
          { headers: { Authorization: 'Bearer test-token' } },
        );
      });

      expect(await screen.findByText('Kabel UTP pakai konektor RJ45?')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Prompt soal')).toHaveValue('');
    });

    it('shows error when JSON data is invalid and does not call api.post', async () => {
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockQuestions })
        .mockResolvedValueOnce({ data: mockTopics });

      render(
        <MemoryRouter>
          <AdminQuestions />
        </MemoryRouter>,
      );

      await screen.findByText('Apa itu pseudocode?');

      fireEvent.change(screen.getByPlaceholderText('Prompt soal'), {
        target: { value: 'Tes invalid' },
      });
      fireEvent.change(screen.getByPlaceholderText(/JSON data/), {
        target: { value: '{ invalid-json }' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

      expect(await screen.findByText('Data JSON invalid')).toBeInTheDocument();
      expect(api.post).not.toHaveBeenCalled();
    });

    it('shows backend error message when api.post fails', async () => {
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockQuestions })
        .mockResolvedValueOnce({ data: mockTopics });
      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          data: {
            details: [{ message: 'correctIndex must be within options range' }],
          },
        },
      });

      render(
        <MemoryRouter>
          <AdminQuestions />
        </MemoryRouter>,
      );

      await screen.findByText('Apa itu pseudocode?');

      fireEvent.change(screen.getByPlaceholderText(/JSON data/), {
        target: { value: '{"options":["a","b"],"correctIndex":5}' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));

      expect(
        await screen.findByText('correctIndex must be within options range'),
      ).toBeInTheDocument();
    });

    it('deletes a question when confirmed and reloads question list', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockQuestions })
        .mockResolvedValueOnce({ data: mockTopics });
      vi.mocked(api.delete).mockResolvedValueOnce({ data: { ok: true } });

      render(
        <MemoryRouter>
          <AdminQuestions />
        </MemoryRouter>,
      );

      await screen.findByText('Apa itu pseudocode?');

      const deleteButtons = screen.getAllByRole('button', { name: 'Hapus' });
      fireEvent.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith('Yakin ingin menghapus?');

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith('/api/admin/questions/10', {
          headers: { Authorization: 'Bearer test-token' },
        });
      });
    });

    it('cancels question deletion when user rejects confirmation', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockQuestions })
        .mockResolvedValueOnce({ data: mockTopics });

      render(
        <MemoryRouter>
          <AdminQuestions />
        </MemoryRouter>,
      );

      await screen.findByText('Apa itu pseudocode?');

      const deleteButtons = screen.getAllByRole('button', { name: 'Hapus' });
      fireEvent.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith('Yakin ingin menghapus?');
      expect(api.delete).not.toHaveBeenCalled();
    });
  });

  describe('AdminHeader logout', () => {
    it('shows teacher name, nav tabs, and logout button on both admin pages', async () => {
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get).mockResolvedValue({ data: [] });

      render(
        <MemoryRouter initialEntries={['/admin/topics']}>
          <App />
        </MemoryRouter>,
      );

      expect(await screen.findByText('Pak Guru')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Soal' })).toHaveAttribute('href', '/admin/questions');
      expect(screen.getByRole('button', { name: 'Keluar' })).toBeInTheDocument();
    });

    it('clears auth and navigates to /admin/login when logout is confirmed', async () => {
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get).mockResolvedValue({ data: [] });
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <MemoryRouter initialEntries={['/admin/topics']}>
          <App />
        </MemoryRouter>,
      );

      fireEvent.click(await screen.findByRole('button', { name: 'Keluar' }));

      expect(confirmSpy).toHaveBeenCalledWith('Keluar dari panel guru, Pak Guru?');
      expect(useAdminStore.getState().token).toBeNull();
      expect(useAdminStore.getState().teacher).toBeNull();
      expect(mockedNavigate).toHaveBeenCalledWith('/admin/login');
      confirmSpy.mockRestore();
    });

    it('keeps the session when logout is cancelled', async () => {
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get).mockResolvedValue({ data: [] });
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <MemoryRouter initialEntries={['/admin/topics']}>
          <App />
        </MemoryRouter>,
      );

      fireEvent.click(await screen.findByRole('button', { name: 'Keluar' }));

      expect(useAdminStore.getState().token).toBe('test-token');
      expect(mockedNavigate).not.toHaveBeenCalledWith('/admin/login');
      confirmSpy.mockRestore();
    });
  });

  describe('App routes integration', () => {
    it('renders AdminTopics at /admin/topics route when authenticated', async () => {
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockTopics });

      render(
        <MemoryRouter initialEntries={['/admin/topics']}>
          <App />
        </MemoryRouter>,
      );

      expect(await screen.findByRole('heading', { name: 'Kelola Topik' })).toBeInTheDocument();
    });

    it('renders AdminQuestions at /admin/questions route when authenticated', async () => {
      useAdminStore.getState().setAuth('test-token', { id: 1, username: 'guru', name: 'Pak Guru' });
      vi.mocked(api.get)
        .mockResolvedValueOnce({ data: mockQuestions })
        .mockResolvedValueOnce({ data: mockTopics });

      render(
        <MemoryRouter initialEntries={['/admin/questions']}>
          <App />
        </MemoryRouter>,
      );

      expect(await screen.findByRole('heading', { name: 'Kelola Soal' })).toBeInTheDocument();
    });
  });
});
