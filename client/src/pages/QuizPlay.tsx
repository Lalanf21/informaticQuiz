import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { useQuizStore } from '../stores/useQuizStore';
import QuestionRenderer from '../components/QuestionRenderer';
import ProgressBar from '../components/ProgressBar';
import Timer from '../components/Timer';
import type { ClientQuestion } from '../types';

export default function QuizPlay() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { questions, currentIndex, answers, startedAt, setQuestions, setAnswer, next, prev, mode } =
    useQuizStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    api
      .get(`/api/sessions/${sessionId}/questions`)
      .then((r) => {
        const sessionMode =
          (location.state as { mode?: 'topic' | 'challenge' | 'campaign' } | null)?.mode ||
          useQuizStore.getState().mode ||
          'topic';
        setQuestions(r.data as ClientQuestion[], sessionMode);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load questions:', err);
        setError('Gagal memuat soal.');
        setLoading(false);
      });
  }, [sessionId, setQuestions, location.state]);

  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const answerArr = questions.map((qq) => ({
        questionId: qq.id,
        answer: answers[qq.id] || {},
      }));
      await api.post(`/api/sessions/${sessionId}/submit`, { answers: answerArr });
      useQuizStore.getState().reset();
      navigate(`/result/${sessionId}`);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setSubmitError('Gagal mengirim jawaban. Silakan coba lagi.');
      setSubmitting(false);
    }
  }, [submitting, questions, answers, sessionId, navigate]);

  if (loading) return <div className="p-8">Memuat...</div>;
  if (error)
    return (
      <div role="alert" className="p-8 text-red-600">
        {error}
      </div>
    );
  if (questions.length === 0) return <div className="p-8">Topik belum punya soal.</div>;

  const challengeSeconds = mode === 'challenge' ? Math.min(questions.length * 60, 600) : 0;
  const q = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {challengeSeconds > 0 && (
          <Timer seconds={challengeSeconds} onExpire={submit} startedAt={startedAt ?? undefined} />
        )}
        <ProgressBar current={currentIndex} total={questions.length} />
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">{q.prompt}</h2>
          <QuestionRenderer
            question={q}
            initialAnswer={answers[q.id]}
            onAnswer={(a) => setAnswer(q.id, a)}
          />
        </div>
        {submitError && (
          <div
            role="alert"
            className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm"
          >
            {submitError}
          </div>
        )}
        <div className="flex justify-between mt-4">
          <button
            disabled={currentIndex === 0}
            onClick={prev}
            className="px-6 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
          >
            Sebelumnya
          </button>
          {isLast ? (
            <button
              disabled={submitting}
              onClick={submit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Mengirim...' : 'Selesai & Submit'}
            </button>
          ) : (
            <button onClick={next} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
              Berikutnya
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
