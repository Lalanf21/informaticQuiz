import type { Question } from '../types';

export interface GradeResult {
  isCorrect: boolean;
  pointsEarned: number;
}

export function gradeQuestion(question: Question, studentAnswer: Record<string, unknown>): GradeResult {
  const data = question.data as any;
  let isCorrect = false;
  switch (question.type) {
    case 'pg':
      isCorrect = studentAnswer.index === data.correctIndex;
      break;
    case 'tf':
      isCorrect = studentAnswer.value === data.correctAnswer;
      break;
    case 'matching':
      isCorrect = Array.isArray(data.pairs) &&
        data.pairs.every((p: { left: string; right: string }) => studentAnswer[p.left] === p.right);
      break;
    case 'ordering': {
      const order = studentAnswer.order;
      isCorrect = Array.isArray(order) &&
        Array.isArray(data.correctOrder) &&
        order.length === data.correctOrder.length &&
        data.correctOrder.every((step: string, i: number) => order[i] === step);
      break;
    }
  }
  return { isCorrect, pointsEarned: isCorrect ? question.points : 0 };
}
