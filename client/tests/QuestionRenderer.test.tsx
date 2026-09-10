// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import QuestionRenderer from '../src/components/QuestionRenderer';
import type { ClientQuestion } from '../src/types';

function wrap(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('QuestionRenderer', () => {
  afterEach(() => {
    cleanup();
  });

  describe('tf (true/false) questions', () => {
    it('renders tf question and fires answer', () => {
      let answer: Record<string, unknown> | null = null;
      wrap(
        <QuestionRenderer
          question={{ id: 1, type: 'tf', prompt: 'Benar?', payload: {}, points: 10 }}
          onAnswer={(a: Record<string, unknown>) => {
            answer = a;
          }}
        />
      );
      fireEvent.click(screen.getByText('Benar'));
      expect(answer).toEqual({ value: true });
    });

    it('handles false answer and highlights selected button', () => {
      const onAnswer = vi.fn();
      const question: ClientQuestion = {
        id: 1,
        type: 'tf',
        prompt: 'RAM adalah memori non-volatile?',
        payload: {},
        points: 10,
      };

      const { rerender } = render(
        <QuestionRenderer question={question} initialAnswer={{ value: false }} onAnswer={onAnswer} />
      );

      const falseBtn = screen.getByRole('button', { name: 'Salah' });
      expect(falseBtn.className).toContain('bg-red-500');

      fireEvent.click(falseBtn);
      expect(onAnswer).toHaveBeenCalledWith({ value: false });

      rerender(
        <QuestionRenderer question={question} initialAnswer={{ value: true }} onAnswer={onAnswer} />
      );
      const trueBtn = screen.getByRole('button', { name: 'Benar' });
      expect(trueBtn.className).toContain('bg-green-500');
    });
  });

  describe('pg (multiple choice) questions', () => {
    it('renders pg question with options', () => {
      const { container } = wrap(
        <QuestionRenderer
          question={{ id: 2, type: 'pg', prompt: 'Pilih', payload: { options: ['a', 'b'] }, points: 10 }}
          onAnswer={() => {}}
        />
      );
      expect(container.textContent).toContain('a');
      expect(container.textContent).toContain('b');
    });

    it('renders all options and maps clicked shuffled option back to original index', () => {
      const onAnswer = vi.fn();
      const options = ['Pilihan Nol', 'Pilihan Satu', 'Pilihan Dua', 'Pilihan Tiga'];
      const question: ClientQuestion = {
        id: 2,
        type: 'pg',
        prompt: 'Pilih jawaban yang tepat',
        payload: { options },
        points: 10,
      };

      render(<QuestionRenderer question={question} onAnswer={onAnswer} />);

      options.forEach((opt) => {
        expect(screen.getByText(opt)).toBeInTheDocument();
      });

      // Click "Pilihan Dua" (original index 2)
      fireEvent.click(screen.getByText('Pilihan Dua'));
      expect(onAnswer).toHaveBeenCalledWith({ index: 2 });

      // Click "Pilihan Nol" (original index 0)
      fireEvent.click(screen.getByText('Pilihan Nol'));
      expect(onAnswer).toHaveBeenCalledWith({ index: 0 });
    });

    it('highlights selected option based on initialAnswer and clicks', () => {
      const onAnswer = vi.fn();
      const options = ['Alpha', 'Beta', 'Gamma'];
      const question: ClientQuestion = {
        id: 3,
        type: 'pg',
        prompt: 'Pilih huruf Yunani',
        payload: { options },
        points: 10,
      };

      render(
        <QuestionRenderer question={question} initialAnswer={{ index: 1 }} onAnswer={onAnswer} />
      );

      const betaBtn = screen.getByRole('button', { name: 'Beta' });
      expect(betaBtn.className).toContain('bg-blue-100');

      const alphaBtn = screen.getByRole('button', { name: 'Alpha' });
      fireEvent.click(alphaBtn);
      expect(alphaBtn.className).toContain('bg-blue-100');
      expect(onAnswer).toHaveBeenCalledWith({ index: 0 });
    });
  });

  describe('matching questions', () => {
    it('renders pairs and allows matching left prompt to right target', () => {
      const onAnswer = vi.fn();
      const question: ClientQuestion = {
        id: 4,
        type: 'matching',
        prompt: 'Pasangkan protokol dengan port',
        payload: {
          pairs: ['HTTP', 'HTTPS', 'SSH'],
          rights: ['443', '22', '80'],
        },
        points: 15,
      };

      render(<QuestionRenderer question={question} onAnswer={onAnswer} />);

      // Left items
      expect(screen.getByRole('button', { name: 'HTTP' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'HTTPS' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'SSH' })).toBeInTheDocument();

      // Right items
      const port80 = screen.getByRole('button', { name: '80' });
      const port443 = screen.getByRole('button', { name: '443' });
      const port22 = screen.getByRole('button', { name: '22' });

      expect(port80).toBeInTheDocument();
      expect(port443).toBeInTheDocument();
      expect(port22).toBeInTheDocument();

      // Clicking right option without selecting left option does nothing
      fireEvent.click(port80);
      expect(onAnswer).not.toHaveBeenCalled();

      // Click left 'HTTP'
      fireEvent.click(screen.getByRole('button', { name: 'HTTP' }));

      // Click right '80'
      fireEvent.click(port80);

      expect(onAnswer).toHaveBeenCalledWith({ HTTP: '80' });
      expect(screen.getByRole('button', { name: /HTTP.*→ 80/ })).toBeInTheDocument();
      expect(port80).toBeDisabled();

      // Pair next: 'HTTPS' to '443'
      fireEvent.click(screen.getByRole('button', { name: 'HTTPS' }));
      fireEvent.click(port443);

      expect(onAnswer).toHaveBeenCalledWith({ HTTP: '80', HTTPS: '443' });
      expect(port443).toBeDisabled();
    });

    it('initializes matching from initialAnswer', () => {
      const onAnswer = vi.fn();
      const question: ClientQuestion = {
        id: 5,
        type: 'matching',
        prompt: 'Pasangkan ibu kota',
        payload: {
          pairs: ['Indonesia', 'Jepang'],
          rights: ['Tokyo', 'Jakarta'],
        },
        points: 10,
      };

      render(
        <QuestionRenderer
          question={question}
          initialAnswer={{ Indonesia: 'Jakarta' }}
          onAnswer={onAnswer}
        />
      );

      expect(screen.getByRole('button', { name: /Indonesia.*→ Jakarta/ })).toBeInTheDocument();
      const jakartaBtn = screen.getByRole('button', { name: 'Jakarta' });
      expect(jakartaBtn).toBeDisabled();
    });
  });

  describe('ordering questions', () => {
    it('renders all sortable items in order', () => {
      const onAnswer = vi.fn();
      const question: ClientQuestion = {
        id: 6,
        type: 'ordering',
        prompt: 'Urutkan siklus hidup pengembangan sistem',
        payload: {
          items: ['Perencanaan', 'Analisis', 'Desain', 'Implementasi'],
        },
        points: 20,
      };

      render(<QuestionRenderer question={question} onAnswer={onAnswer} />);

      expect(screen.getByText('Perencanaan')).toBeInTheDocument();
      expect(screen.getByText('Analisis')).toBeInTheDocument();
      expect(screen.getByText('Desain')).toBeInTheDocument();
      expect(screen.getByText('Implementasi')).toBeInTheDocument();
    });

    it('renders custom order if provided in initialAnswer', () => {
      const onAnswer = vi.fn();
      const question: ClientQuestion = {
        id: 7,
        type: 'ordering',
        prompt: 'Urutkan angka',
        payload: {
          items: ['Satu', 'Dua', 'Tiga'],
        },
        points: 10,
      };

      const customOrder = ['Tiga', 'Satu', 'Dua'];
      const { container } = render(
        <QuestionRenderer
          question={question}
          initialAnswer={{ order: customOrder }}
          onAnswer={onAnswer}
        />
      );

      const items = container.querySelectorAll('.cursor-move');
      expect(items).toHaveLength(3);
      expect(items[0].textContent).toContain('Tiga');
      expect(items[1].textContent).toContain('Satu');
      expect(items[2].textContent).toContain('Dua');
    });
  });

  describe('unsupported question type', () => {
    it('returns null for unknown question type', () => {
      const { container } = render(
        <QuestionRenderer
          question={{ id: 99, type: 'unknown' as any, prompt: '?', payload: {}, points: 0 }}
          onAnswer={() => {}}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });
});
