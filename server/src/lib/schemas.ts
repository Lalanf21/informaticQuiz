import { z } from 'zod';
import type { QuestionType } from '../types';

const PgData = z.object({ options: z.array(z.string()).min(2), correctIndex: z.number().int() });
const TfData = z.object({ correctAnswer: z.boolean() });
const MatchingData = z.object({
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).min(2),
});
const OrderingData = z.object({ correctOrder: z.array(z.string()).min(2) });

const schemaByType: Record<QuestionType, z.ZodTypeAny> = {
  pg: PgData,
  tf: TfData,
  matching: MatchingData,
  ordering: OrderingData,
};

export function validateQuestionData(type: QuestionType, data: unknown): void {
  schemaByType[type].parse(data);
}

export { PgData, TfData, MatchingData, OrderingData };
