// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Timer from '../src/components/Timer';

describe('Timer component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders initial formatted time in mm:ss format', () => {
    render(<Timer seconds={300} onExpire={vi.fn()} />);

    const timer = screen.getByRole('timer');
    expect(timer).toBeInTheDocument();
    expect(timer).toHaveTextContent('5:00');
  });

  it('pads single-digit seconds with leading zero', () => {
    render(<Timer seconds={65} onExpire={vi.fn()} />);

    const timer = screen.getByRole('timer');
    expect(timer).toHaveTextContent('1:05');
  });

  it('applies text-gray-700 class when remaining time is >= 30 seconds', () => {
    render(<Timer seconds={30} onExpire={vi.fn()} />);

    const timer = screen.getByRole('timer');
    expect(timer).toHaveTextContent('0:30');
    expect(timer).toHaveClass('bg-sun');
    expect(timer).not.toHaveClass('bg-blood');
  });

  it('applies text-red-600 class when remaining time is < 30 seconds', () => {
    render(<Timer seconds={29} onExpire={vi.fn()} />);

    const timer = screen.getByRole('timer');
    expect(timer).toHaveTextContent('0:29');
    expect(timer).toHaveClass('bg-blood');
    expect(timer).not.toHaveClass('bg-sun');
  });

  it('counts down every second', () => {
    render(<Timer seconds={60} onExpire={vi.fn()} />);

    const timer = screen.getByRole('timer');
    expect(timer).toHaveTextContent('1:00');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(timer).toHaveTextContent('0:59');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(timer).toHaveTextContent('0:57');
  });

  it('switches to red color when ticking down past 30 seconds', () => {
    render(<Timer seconds={31} onExpire={vi.fn()} />);

    const timer = screen.getByRole('timer');
    expect(timer).toHaveTextContent('0:31');
    expect(timer).toHaveClass('bg-sun');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(timer).toHaveTextContent('0:30');
    expect(timer).toHaveClass('bg-sun');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(timer).toHaveTextContent('0:29');
    expect(timer).toHaveClass('bg-blood');
  });

  it('calls onExpire when timer reaches 0', () => {
    const onExpire = vi.fn();
    render(<Timer seconds={2} onExpire={onExpire} />);

    expect(onExpire).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole('timer')).toHaveTextContent('0:01');
    expect(onExpire).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole('timer')).toHaveTextContent('0:00');
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onExpire multiple times after timer expires', () => {
    const onExpire = vi.fn();
    const { rerender } = render(<Timer seconds={1} onExpire={onExpire} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);

    rerender(<Timer seconds={1} onExpire={onExpire} />);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('calls onExpire on mount if initial seconds is <= 0', () => {
    const onExpire = vi.fn();
    render(<Timer seconds={0} onExpire={onExpire} />);

    expect(screen.getByRole('timer')).toHaveTextContent('0:00');
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('clears interval on unmount', () => {
    const onExpire = vi.fn();
    const { unmount } = render(<Timer seconds={10} onExpire={onExpire} />);

    unmount();

    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('calculates remaining time anchored to wall-clock startedAt prop', () => {
    const now = Date.now();
    const startedAt = now - 35000; // 35 seconds ago
    render(<Timer seconds={60} onExpire={vi.fn()} startedAt={startedAt} />);

    const timer = screen.getByRole('timer');
    expect(timer).toHaveTextContent('0:25');
  });

  it('resilient to background tab throttle when visibilitychange fires', () => {
    const onExpire = vi.fn();
    render(<Timer seconds={60} onExpire={onExpire} />);

    const timer = screen.getByRole('timer');
    expect(timer).toHaveTextContent('1:00');

    // Simulate tab being in background where setInterval was paused/delayed,
    // but wall clock advanced 40 seconds
    act(() => {
      vi.advanceTimersByTime(40000);
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(timer).toHaveTextContent('0:20');
    expect(onExpire).not.toHaveBeenCalled();

    // Advance past expiration
    act(() => {
      vi.advanceTimersByTime(25000);
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(timer).toHaveTextContent('0:00');
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
