'use client';

import { Suspense, useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  getSurveyByShareLink,
  saveResponse,
  isQuestionVisible,
  Survey,
  Question,
} from '@/lib/surveys-storage';

function SurveyPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shareLink = params.shareLink as string;
  const isPreview = searchParams.get('preview') === '1';

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [slideOut, setSlideOut] = useState(false);

  useEffect(() => {
    const foundSurvey = getSurveyByShareLink(shareLink);
    if (!foundSurvey) {
      setError('Encuesta no encontrada');
    } else if (foundSurvey.status === 'draft' && !isPreview) {
      setError('Esta encuesta aún no está publicada');
    } else {
      setSurvey(foundSurvey);
      const initialAnswers: Record<string, any> = {};
      foundSurvey.questions.forEach((q) => {
        initialAnswers[q.id] = q.type === 'multiple' ? [] : '';
      });
      setAnswers(initialAnswers);
    }
    setLoading(false);
  }, [shareLink, isPreview]);

  const handleChange = (questionId: string, value: any, type: string) => {
    if (type === 'multiple' && Array.isArray(answers[questionId])) {
      const newAnswers = answers[questionId].includes(value)
        ? answers[questionId].filter((item: string) => item !== value)
        : [...answers[questionId], value];
      setAnswers({ ...answers, [questionId]: newAnswers });
    } else {
      setAnswers({ ...answers, [questionId]: value });
    }
  };

  const canProceed = () => {
    const question = survey?.questions[currentQuestion];
    if (!question?.required) return true;
    const answer = answers[question.id];
    if (Array.isArray(answer)) return answer.length > 0;
    return answer !== '' && answer !== undefined && answer !== null;
  };

  // Índice de la siguiente pregunta visible (saltando las ocultas por lógica)
  const nextVisibleIndex = (from: number) => {
    if (!survey) return -1;
    for (let i = from + 1; i < survey.questions.length; i++) {
      if (isQuestionVisible(survey.questions[i], answers)) return i;
    }
    return -1;
  };

  const prevVisibleIndex = (from: number) => {
    if (!survey) return -1;
    for (let i = from - 1; i >= 0; i--) {
      if (isQuestionVisible(survey.questions[i], answers)) return i;
    }
    return -1;
  };

  const isLast = survey ? nextVisibleIndex(currentQuestion) === -1 : true;

  const handleNext = () => {
    if (!canProceed()) return;
    const next = nextVisibleIndex(currentQuestion);
    if (next === -1) {
      handleSubmit();
      return;
    }
    setSlideOut(true);
    setTimeout(() => {
      setCurrentQuestion(next);
      setSlideOut(false);
    }, 300);
  };

  const handlePrevious = () => {
    const prev = prevVisibleIndex(currentQuestion);
    if (prev === -1) return;
    setSlideOut(true);
    setTimeout(() => {
      setCurrentQuestion(prev);
      setSlideOut(false);
    }, 300);
  };

  const handleSubmit = () => {
    if (!canProceed() || !survey) return;
    if (isPreview) {
      setSubmitted(true);
      return;
    }
    saveResponse({
      surveyId: survey.id,
      answers,
    });
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-gray-600">Cargando encuesta...</p>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Encuesta no encontrada'}
          </h1>
          <p className="text-gray-600">La encuesta que buscas no existe o ha sido eliminada.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
        <div className="text-center">
          <div className="text-7xl mb-6">✓</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">¡Gracias!</h1>
          <p className="text-gray-600 text-lg max-w-md">
            Tu respuesta ha sido registrada correctamente.
          </p>
        </div>
      </div>
    );
  }

  const question = survey.questions[currentQuestion];
  // progreso basado en preguntas visibles dadas las respuestas actuales
  const visibleQuestions = survey.questions.filter((q) =>
    isQuestionVisible(q, answers)
  );
  const visiblePos = visibleQuestions.findIndex((q) => q.id === question.id) + 1;
  const progress = (visiblePos / Math.max(visibleQuestions.length, 1)) * 100;
  const hasPrev = prevVisibleIndex(currentQuestion) !== -1;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Preview banner */}
      {isPreview && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm text-center py-2 font-medium">
          Vista previa · las respuestas no se guardan
        </div>
      )}

      {/* Progress Bar */}
      <div className="h-0.5 bg-gray-200 w-full">
        <div
          className="h-full bg-gray-900 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-gray-500">
            Pregunta {visiblePos} de {visibleQuestions.length}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className={`max-w-2xl w-full transition-all duration-300 ${slideOut ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
          {/* Question */}
          <h1 className="text-4xl font-semibold text-gray-900 mb-12 leading-tight">
            {question.question}
            {question.required && <span className="text-red-500">*</span>}
          </h1>

          {/* Input Area */}
          <div className="mb-12">
            <QuestionInput
              question={question}
              answer={answers[question.id]}
              onChange={(v) => handleChange(question.id, v, question.type)}
              onEnter={() => canProceed() && handleNext()}
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={!hasPrev}
              className={`px-6 py-2 font-medium transition-all ${
                !hasPrev
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ← Anterior
            </button>

            <button
              onClick={isLast ? handleSubmit : handleNext}
              disabled={!canProceed()}
              className={`px-8 py-2 rounded-lg font-medium transition-all ${
                canProceed()
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLast ? 'Enviar' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SurveyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white">
          <p className="text-gray-600">Cargando…</p>
        </div>
      }
    >
      <SurveyPageInner />
    </Suspense>
  );
}

function QuestionInput({
  question,
  answer,
  onChange,
  onEnter,
}: {
  question: Question;
  answer: any;
  onChange: (value: any) => void;
  onEnter: () => void;
}) {
  if (question.type === 'short') {
    return (
      <input
        autoFocus
        type="text"
        value={answer || ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && onEnter()}
        placeholder="Escribe tu respuesta..."
        className="w-full text-xl text-gray-900 placeholder-gray-400 border-b-2 border-gray-300 focus:border-gray-900 focus:outline-none pb-3 transition-colors bg-transparent"
      />
    );
  }

  if (question.type === 'text') {
    return (
      <textarea
        autoFocus
        value={answer || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escribe tu respuesta..."
        rows={4}
        className="w-full text-lg text-gray-900 placeholder-gray-400 border-b-2 border-gray-300 focus:border-gray-900 focus:outline-none pb-3 transition-colors bg-transparent resize-none"
      />
    );
  }

  if (question.type === 'multiple') {
    return (
      <div className="space-y-4">
        {question.options?.map((option) => {
          const checked = Array.isArray(answer) && answer.includes(option);
          return (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                checked ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    checked ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
                  }`}
                >
                  {checked && <span className="text-white text-sm">✓</span>}
                </div>
                <span className="text-lg text-gray-900 font-medium">{option}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'single') {
    return (
      <div className="space-y-4">
        {question.options?.map((option) => {
          const checked = answer === option;
          return (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                checked ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    checked ? 'border-gray-900' : 'border-gray-300'
                  }`}
                >
                  {checked && <span className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                </div>
                <span className="text-lg text-gray-900 font-medium">{option}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'rating') {
    return (
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className={`text-5xl transition-all transform hover:scale-110 ${
              answer >= star ? 'opacity-100' : 'opacity-30 hover:opacity-60'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  }

  if (question.type === 'opinion') {
    return (
      <div>
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`w-14 h-14 rounded-lg border-2 text-lg font-semibold transition-all ${
                answer === n
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2 max-w-sm">
          <span>Nada probable</span>
          <span>Muy probable</span>
        </div>
      </div>
    );
  }

  if (question.type === 'likert') {
    return (
      <div className="space-y-3">
        {question.options?.map((option) => {
          const checked = answer === option;
          return (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                checked ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    checked ? 'border-gray-900' : 'border-gray-300'
                  }`}
                >
                  {checked && <span className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                </div>
                <span className="text-lg text-gray-900 font-medium">{option}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}
