// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminLogin from '../src/pages/AdminLogin';
import AdminRegister from '../src/pages/AdminRegister';
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
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('Admin Authentication', () => {
  beforeEach(() => {
    mockedNavigate.mockReset();
    vi.clearAllMocks();
    useAdminStore.getState().logout();
  });

  afterEach(() => {
    cleanup();
  });

  describe('AdminLogin', () => {
    it('renders login form elements and register link', () => {
      render(
        <MemoryRouter>
          <AdminLogin />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: 'Login Guru' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();

      const registerLink = screen.getByRole('link', { name: 'Daftar akun guru' });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/admin/register');
    });

    it('submits credentials, sets auth in store, and navigates to /admin/questions on success', async () => {
      const mockTeacher = { id: 1, username: 'guru1', name: 'Pak Guru' };
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          token: 'mock-jwt-token',
          teacher: mockTeacher,
        },
      });

      render(
        <MemoryRouter>
          <AdminLogin />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'guru1' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'rahasia123' } });
      fireEvent.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/admin/login', {
          username: 'guru1',
          password: 'rahasia123',
        });
      });

      expect(useAdminStore.getState().token).toBe('mock-jwt-token');
      expect(useAdminStore.getState().teacher).toEqual(mockTeacher);
      expect(mockedNavigate).toHaveBeenCalledWith('/admin/questions');
    });

    it('displays error message when login fails', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Unauthorized'));

      render(
        <MemoryRouter>
          <AdminLogin />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'guru1' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpass' } });
      fireEvent.click(screen.getByRole('button', { name: 'Login' }));

      await waitFor(() => {
        expect(screen.getByText('Username atau password salah')).toBeInTheDocument();
      });

      expect(useAdminStore.getState().token).toBeNull();
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  describe('AdminRegister', () => {
    it('renders register form elements and login link', () => {
      render(
        <MemoryRouter>
          <AdminRegister />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: 'Daftar Guru' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nama (opsional)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Kode registrasi')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Daftar' })).toBeInTheDocument();

      const loginLink = screen.getByRole('link', { name: 'Sudah punya akun? Login' });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/admin/login');
    });

    it('submits registration form, sets auth in store, and navigates to /admin/questions on success', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          token: 'mock-registered-token',
          teacher: {
            id: 1,
            username: 'newguru',
            name: 'Bu Sari',
          },
        },
      });

      render(
        <MemoryRouter>
          <AdminRegister />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'newguru' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret456' } });
      fireEvent.change(screen.getByPlaceholderText('Nama (opsional)'), { target: { value: 'Bu Sari' } });
      fireEvent.change(screen.getByPlaceholderText('Kode registrasi'), { target: { value: 'KEY123' } });
      fireEvent.click(screen.getByRole('button', { name: 'Daftar' }));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/admin/register', {
          username: 'newguru',
          password: 'secret456',
          name: 'Bu Sari',
          registrationKey: 'KEY123',
        });
      });

      expect(useAdminStore.getState().token).toBe('mock-registered-token');
      expect(useAdminStore.getState().teacher).toEqual({
        id: 1,
        username: 'newguru',
        name: 'Bu Sari',
      });
      expect(mockedNavigate).toHaveBeenCalledWith('/admin/questions');
    });

    it('displays "Kode registrasi salah" when registration key is invalid (403)', async () => {
      vi.mocked(api.post).mockRejectedValueOnce({
        response: { status: 403 },
      });

      render(
        <MemoryRouter>
          <AdminRegister />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'newguru' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret456' } });
      fireEvent.change(screen.getByPlaceholderText('Kode registrasi'), { target: { value: 'WRONG_KEY' } });
      fireEvent.click(screen.getByRole('button', { name: 'Daftar' }));

      await waitFor(() => {
        expect(screen.getByText('Kode registrasi salah')).toBeInTheDocument();
      });

      expect(useAdminStore.getState().token).toBeNull();
      expect(mockedNavigate).not.toHaveBeenCalled();
    });

    it('displays "Gagal daftar" when other error occurs (e.g. 409 username taken or network failure)', async () => {
      vi.mocked(api.post).mockRejectedValueOnce({
        response: { status: 409 },
      });

      render(
        <MemoryRouter>
          <AdminRegister />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'existingguru' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret456' } });
      fireEvent.change(screen.getByPlaceholderText('Kode registrasi'), { target: { value: 'KEY123' } });
      fireEvent.click(screen.getByRole('button', { name: 'Daftar' }));

      await waitFor(() => {
        expect(screen.getByText('Gagal daftar')).toBeInTheDocument();
      });

      expect(useAdminStore.getState().token).toBeNull();
      expect(mockedNavigate).not.toHaveBeenCalled();
    });
  });

  describe('App routes integration', () => {
    it('renders AdminLogin page at /admin/login route', () => {
      render(
        <MemoryRouter initialEntries={['/admin/login']}>
          <App />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: 'Login Guru' })).toBeInTheDocument();
    });

    it('renders AdminRegister page at /admin/register route', () => {
      render(
        <MemoryRouter initialEntries={['/admin/register']}>
          <App />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: 'Daftar Guru' })).toBeInTheDocument();
    });
  });
});
