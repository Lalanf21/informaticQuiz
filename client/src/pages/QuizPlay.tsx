import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { useQuizStore } from '../stores/useQuizStore';
import QuestionRenderer from '../components/QuestionRenderer';
import ProgressBar from '../components/ProgressBar';
import Timer from '../components/Timer';
import { Notice } from '../components/ui';
import type { ClientQuestion } from '../types';

const TYPE_LABEL: Record<string, string> = {
  pg: 'Pilihan Ganda',
  tf: 'Benar / Salah',
  matching: 'Jodohkan',
  ordering: 'Urutkan',
};

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="panel w-full max-w-md animate-panel-in p-6 text-center">
          <span className="mx-auto mb-3 block h-5 w-5 animate-blink bg-pulse" aria-hidden />
          <p className="font-display text-2xl uppercase">Memuat...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div
        role="alert"
        className="flex min-h-screen items-center justify-center bg-paper px-4"
      >
        <div className="w-full max-w-md border-3 border-ink bg-blood p-6 text-center text-cloud shadow-pop-lg">
          <p className="font-display text-2xl uppercase">Ups, Gagal Muat</p>
          <p className="mt-2 font-semibold">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-ink mt-4 bg-cloud">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }
  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="w-full max-w-md border-3 border-dashed border-ink bg-paper-2 p-6 text-center shadow-pop">
          <p className="font-display text-2xl">Topik belum punya soal.</p>
          <p className="mt-2 font-semibold text-ash">Coba topik lain atau mode Tantangan.</p>
        </div>
      </div>
    );
  }

  const challengeSeconds = mode === 'challenge' ? Math.min(questions.length * 60, 600) : 0;
  const q = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const answeredCount = questions.filter((qq) => {
    const a = answers[qq.id];
    return a !== undefined && Object.keys(a).length > 0;
  }).length;

  return (
    <div className="min-h-screen bg-paper">
      {/* Header strip: progress + timer + mode tag */}
      <div className="border-b-3 border-ink bg-paper-2">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="tag-ink bg-volt text-cloud">{mode ?? 'topic'}</span>
            {challengeSeconds > 0 && (
              <Timer
                seconds={challengeSeconds}
                onExpire={submit}
                startedAt={startedAt ?? undefined}
              />
            )}
          </div>
          <ProgressBar current={currentIndex} total={questions.length} />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        {/* Question card — one panel, one moment. */}
        <div key={q.id} data-testid="question-card" className="animate-panel-in border-3 border-ink bg-cloud shadow-pop-lg">
          <div className="flex items-center justify-between gap-2 border-b-3 border-ink bg-sun px-4 py-2">
            <span className="font-display text-xs uppercase tracking-[0.2em] sm:text-sm">
              {TYPE_LABEL[q.type] ?? q.type}
            </span>
            <span className="border-2 border-ink bg-cloud px-2 py-0.5 text-xs font-bold tabular-nums">
              {q.points} poin
            </span>
          </div>
          <div className="p-5 sm:p-7">
            <h2 className="mb-5 whitespace-pre-line text-xl normal-case leading-snug sm:text-2xl">
              {q.prompt}
            </h2>
            <QuestionRenderer
              question={q}
              initialAnswer={answers[q.id]}
              onAnswer={(a) => setAnswer(q.id, a)}
            />
          </div>
        </div>

        {submitError && (
          <Notice tone="error" className="mt-4">
            {submitError}
          </Notice>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button disabled={currentIndex === 0} onClick={prev} className="btn-ink bg-cloud">
            <span aria-hidden>←</span> Sebelumnya
          </button>
          <span className="order-last hidden text-xs font-bold uppercase tracking-widest text-ash sm:order-none sm:block">
            {answeredCount}/{questions.length} terjawab
          </span>
          {isLast ? (
            <button
              disabled={submitting}
              onClick={submit}
              className="btn-ink bg-mint py-3 text-base sm:text-lg"
            >
              {submitting ? 'Mengirim...' : 'Selesai & Submit'}
            </button>
          ) : (
            <button onClick={next} className="btn-ink bg-pulse py-3 text-base sm:text-lg">
              Berikutnya <span aria-hidden>→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
