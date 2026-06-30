'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import {
  getSurveyById,
  getResponsesBySurvey,
  Survey,
  Response,
  Question,
} from '@/lib/surveys-storage';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

export default function ResultsPage() {
  const params = useParams();
  const surveyId = params.surveyId as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const foundSurvey = getSurveyById(surveyId);
    setSurvey(foundSurvey);

    if (foundSurvey) {
      const foundResponses = getResponsesBySurvey(surveyId);
      setResponses(foundResponses);
    }

    setLoading(false);
  }, [surveyId]);

  const handleDownloadCSV = () => {
    if (!survey) return;

    const headers = ['Fecha', ...survey.questions.map((q) => q.question)];
    const rows = responses.map((response) => [
      new Date(response.submittedAt).toLocaleString(),
      ...survey.questions.map((q) => {
        const answer = response.answers[q.id];
        if (Array.isArray(answer)) {
          return answer.join('; ');
        }
        return answer || '';
      }),
    ]);

    let csv = headers.map((h) => `"${h}"`).join(',') + '\n';
    csv += rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `${survey.title}-resultados.csv`;
    link.click();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <p>Cargando resultados...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (!survey) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Encuesta no encontrada
            </h1>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={20} />
              Volver
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Resultados</h1>
            <p className="text-gray-600 mt-1">{survey.title}</p>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium">Respuestas</p>
              <p className="text-3xl font-bold text-gray-900">{responses.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium">Preguntas</p>
              <p className="text-3xl font-bold text-gray-900">{survey.questions.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium">Tasa de respuesta</p>
              <p className="text-3xl font-bold text-gray-900">100%</p>
            </div>
          </div>

          {/* Download Button */}
          <div className="mb-8">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download size={20} />
              Descargar CSV
            </button>
          </div>

          {/* Results by Question */}
          <div className="space-y-8">
            {survey.questions.map((question, index) => (
              <QuestionResults
                key={question.id}
                index={index}
                question={question}
                responses={responses}
              />
            ))}
          </div>

          {responses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                No hay respuestas aún. Comparte el enlace de la encuesta para recibir respuestas.
              </p>
            </div>
          )}

          {/* All Responses */}
          {responses.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Todas las Respuestas
              </h2>
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Fecha
                      </th>
                      {survey.questions.map((q) => (
                        <th
                          key={q.id}
                          className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                        >
                          {q.question}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {responses.map((response) => (
                      <tr key={response.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {new Date(response.submittedAt).toLocaleString()}
                        </td>
                        {survey.questions.map((q) => (
                          <td
                            key={q.id}
                            className="px-6 py-4 text-sm text-gray-900"
                          >
                            <Answer
                              answer={response.answers[q.id]}
                              type={q.type}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

function QuestionResults({
  index,
  question,
  responses,
}: {
  index: number;
  question: Question;
  responses: Response[];
}) {
  if (question.type === 'multiple') {
    const counts: Record<string, number> = {};
    question.options?.forEach((opt) => {
      counts[opt] = 0;
    });

    responses.forEach((r) => {
      const answers = r.answers[question.id];
      if (Array.isArray(answers)) {
        answers.forEach((ans) => {
          if (ans in counts) counts[ans]++;
        });
      }
    });

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {index + 1}. {question.question}
        </h3>
        <div className="space-y-3">
          {question.options?.map((option) => {
            const count = counts[option];
            const percentage =
              responses.length > 0
                ? Math.round((count / responses.length) * 100)
                : 0;

            return (
              <div key={option}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {option}
                  </span>
                  <span className="text-sm text-gray-600">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === 'rating') {
    const ratings = responses
      .map((r) => r.answers[question.id])
      .filter((a) => typeof a === 'number') as number[];

    const average =
      ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {index + 1}. {question.question}
        </h3>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-gray-600">Calificación promedio</p>
            <p className="text-4xl font-bold text-gray-900">{average}</p>
          </div>
          <div className="text-4xl">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < Math.round(average as any) ? 'opacity-100' : 'opacity-30'}>
                ⭐
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {index + 1}. {question.question}
      </h3>
      <p className="text-sm text-gray-600 mb-2">{responses.length} respuestas</p>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {responses.map((response, idx) => (
          <div key={idx} className="p-3 bg-gray-50 rounded text-sm text-gray-700">
            <Answer answer={response.answers[question.id]} type={question.type} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Answer({ answer, type }: { answer: any; type: string }) {
  if (!answer) return <span className="text-gray-400">Sin respuesta</span>;

  if (Array.isArray(answer)) {
    return <span>{answer.join(', ')}</span>;
  }

  if (type === 'rating') {
    return <span>{Array(answer).fill('⭐').join('')}</span>;
  }

  return <span className="line-clamp-3">{String(answer)}</span>;
}
