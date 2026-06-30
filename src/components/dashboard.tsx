'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSurveys, deleteSurvey, getResponsesBySurvey, Survey } from '@/lib/surveys-storage';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  Eye,
  Link2,
  BarChart3,
  MoreHorizontal,
  Check,
  FileText,
  Pencil,
} from 'lucide-react';

export function Dashboard() {
  const { logout, username } = useAuth();
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  useEffect(() => {
    const list = getSurveys();
    setSurveys(list);
    const c: Record<string, number> = {};
    list.forEach((s) => {
      c[s.id] = getResponsesBySurvey(s.id).length;
    });
    setCounts(c);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta encuesta y todas sus respuestas?')) {
      deleteSurvey(id);
      setSurveys(getSurveys());
      setMenuId(null);
    }
  };

  const handleCopyLink = (survey: Survey) => {
    const url = `${window.location.origin}/survey/${survey.shareLink}`;
    navigator.clipboard.writeText(url);
    setCopiedId(survey.id);
    setMenuId(null);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalResponses = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">☕</span>
            <span className="text-lg font-semibold text-gray-900">Cafecito</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">{username}</span>
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-medium flex items-center justify-center">
              {username?.[0]?.toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900 transition ml-1"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Page heading */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tus encuestas</h1>
            <p className="text-sm text-gray-500 mt-1">
              {surveys.length} encuesta{surveys.length !== 1 ? 's' : ''} · {totalResponses} respuesta{totalResponses !== 1 ? 's' : ''} en total
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
          >
            <Plus size={16} />
            Nueva encuesta
          </Link>
        </div>

        {/* Empty state */}
        {surveys.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl py-20 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FileText size={22} className="text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">
              Aún no tienes encuestas
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Crea tu primera encuesta y compártela para empezar a recibir respuestas.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
            >
              <Plus size={16} />
              Crear encuesta
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* New survey tile */}
            <Link
              href="/create"
              className="group border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center py-10 hover:border-gray-400 hover:bg-white transition min-h-[200px]"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center mb-3 transition">
                <Plus size={20} className="text-gray-500 group-hover:text-white transition" />
              </div>
              <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition">
                Nueva encuesta
              </span>
            </Link>

            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition flex flex-col min-h-[200px]"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3
                    onClick={() =>
                      router.push(
                        survey.status === 'draft'
                          ? `/create?id=${survey.id}`
                          : `/results/${survey.id}`
                      )
                    }
                    className="text-base font-semibold text-gray-900 leading-snug line-clamp-2 cursor-pointer hover:text-gray-700"
                  >
                    {survey.title}
                  </h3>
                  <CardMenu
                    open={menuId === survey.id}
                    onToggle={() => setMenuId(menuId === survey.id ? null : survey.id)}
                    survey={survey}
                    onCopy={() => handleCopyLink(survey)}
                    onDelete={() => handleDelete(survey.id)}
                  />
                </div>

                {survey.status === 'draft' && (
                  <span className="inline-flex items-center gap-1 self-start text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mb-2">
                    Borrador
                  </span>
                )}

                {survey.description ? (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {survey.description}
                  </p>
                ) : (
                  <p className="text-sm text-gray-300 italic mb-4">Sin descripción</p>
                )}

                {/* Stats */}
                <div className="mt-auto flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-100">
                  <span>{survey.questions.length} preguntas</span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {counts[survey.id] ?? 0} respuestas
                  </span>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2 mt-4">
                  {survey.status === 'draft' ? (
                    <Link
                      href={`/create?id=${survey.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gray-900 text-white text-sm font-medium py-2 rounded-lg hover:bg-gray-800 transition"
                    >
                      <Pencil size={15} />
                      Seguir editando
                    </Link>
                  ) : (
                    <Link
                      href={`/results/${survey.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gray-900 text-white text-sm font-medium py-2 rounded-lg hover:bg-gray-800 transition"
                    >
                      <BarChart3 size={15} />
                      Resultados
                    </Link>
                  )}
                  <Link
                    href={`/survey/${survey.shareLink}${survey.status === 'draft' ? '?preview=1' : ''}`}
                    target="_blank"
                    className="inline-flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                    title={survey.status === 'draft' ? 'Vista previa' : 'Ver encuesta'}
                  >
                    <Eye size={15} />
                  </Link>
                  <button
                    onClick={() => handleCopyLink(survey)}
                    className="inline-flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                    title="Copiar enlace"
                  >
                    {copiedId === survey.id ? (
                      <Check size={15} className="text-green-600" />
                    ) : (
                      <Link2 size={15} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CardMenu({
  open,
  onToggle,
  survey,
  onCopy,
  onDelete,
}: {
  open: boolean;
  onToggle: () => void;
  survey: Survey;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (open) onToggle();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onToggle]);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={onToggle}
        className="w-8 h-8 -mr-1 -mt-1 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
          <Link
            href={`/create?id=${survey.id}`}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <Pencil size={15} />
            Editar
          </Link>
          <Link
            href={`/survey/${survey.shareLink}${survey.status === 'draft' ? '?preview=1' : ''}`}
            target="_blank"
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <Eye size={15} />
            {survey.status === 'draft' ? 'Vista previa' : 'Ver encuesta'}
          </Link>
          <button
            onClick={onCopy}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <Link2 size={15} />
            Copiar enlace
          </button>
          <Link
            href={`/results/${survey.id}`}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <BarChart3 size={15} />
            Ver resultados
          </Link>
          <div className="h-px bg-gray-100 my-1" />
          <button
            onClick={onDelete}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 size={15} />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
