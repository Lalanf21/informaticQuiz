import type { ClientQuestion } from '../types';
import PgQuestion from './PgQuestion';
import TfQuestion from './TfQuestion';
import MatchingQuestion from './MatchingQuestion';
import OrderingQuestion from './OrderingQuestion';

interface Props {
  question: ClientQuestion;
  initialAnswer?: Record<string, unknown>;
  onAnswer: (answer: Record<string, unknown>) => void;
}

export default function QuestionRenderer({ question, initialAnswer, onAnswer }: Props) {
  const p = question.payload as Record<string, any>;

  switch (question.type) {
    case 'pg':
      return (
        <PgQuestion
          key={question.id}
          options={p?.options || []}
          initialAnswer={initialAnswer?.index as number | undefined}
          onAnswer={(i) => onAnswer({ index: i })}
        />
      );
    case 'tf':
      return (
        <TfQuestion
          key={question.id}
          initialAnswer={initialAnswer?.value as boolean | undefined}
          onAnswer={(v) => onAnswer({ value: v })}
        />
      );
    case 'matching':
      return (
        <MatchingQuestion
          key={question.id}
          pairs={p?.pairs || []}
          rights={p?.rights || []}
          initialAnswer={initialAnswer as Record<string, string> | undefined}
          onAnswer={(m) => onAnswer(m)}
        />
      );
    case 'ordering':
      return (
        <OrderingQuestion
          key={question.id}
          items={p?.items || []}
          initialOrder={initialAnswer?.order as string[] | undefined}
          onAnswer={(o) => onAnswer({ order: o })}
        />
      );
    default:
      return null;
  }
}
