// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import Home from '../src/pages/Home';
import App from '../src/App';
import { usePlayerStore } from '../src/stores/usePlayerStore';

const mockedNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('Home page', () => {
  beforeEach(() => {
    mockedNavigate.mockReset();
    usePlayerStore.setState({ name: '', grade: null, sessionId: null });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders title, form inputs, submit button, and leaderboard link', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'InformaticQuiz' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nama lengkap')).toBeInTheDocument();
    expect(screen.getByLabelText('Kelas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mulai' })).toBeInTheDocument();

    const leaderboardLink = screen.getByRole('link', { name: 'Lihat Leaderboard' });
    expect(leaderboardLink).toBeInTheDocument();
    expect(leaderboardLink).toHaveAttribute('href', '/leaderboard');
  });

  it('does not submit or navigate when fields are empty', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mulai' }));

    expect(usePlayerStore.getState().name).toBe('');
    expect(usePlayerStore.getState().grade).toBeNull();
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  it('does not submit when only name is provided without grade', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Nama lengkap'), {
      target: { value: 'Ahmad' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mulai' }));

    expect(usePlayerStore.getState().name).toBe('');
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  it('does not submit when only grade is selected without name', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Kelas'), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mulai' }));

    expect(usePlayerStore.getState().grade).toBeNull();
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  it('does not submit when name has only spaces', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Nama lengkap'), {
      target: { value: '   ' },
    });
    fireEvent.change(screen.getByLabelText('Kelas'), {
      target: { value: '7' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mulai' }));

    expect(usePlayerStore.getState().name).toBe('');
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  it('submits valid form, sets player in store, and navigates to /topics', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Nama lengkap'), {
      target: { value: '  Siti Nurhaliza  ' },
    });
    fireEvent.change(screen.getByLabelText('Kelas'), {
      target: { value: '9' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mulai' }));

    expect(usePlayerStore.getState().name).toBe('Siti Nurhaliza');
    expect(usePlayerStore.getState().grade).toBe(9);
    expect(mockedNavigate).toHaveBeenCalledWith('/topics');
  });

  it('resets grade selection to empty properly', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const select = screen.getByLabelText('Kelas') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '8' } });
    expect(select.value).toBe('8');

    fireEvent.change(select, { target: { value: '' } });
    expect(select.value).toBe('');

    fireEvent.change(screen.getByPlaceholderText('Nama lengkap'), {
      target: { value: 'Budi' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mulai' }));

    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  it('renders Home through App routes at path "/"', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'InformaticQuiz' })).toBeInTheDocument();
  });
});
