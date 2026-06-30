'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import {
  upsertSurvey,
  getSurveyById,
  getConditionValues,
  LIKERT_DEFAULT,
  Question,
  QuestionType,
  Condition,
} from '@/lib/surveys-storage';
import {
  Plus,
  Trash2,
  Type,
  AlignLeft,
  CircleDot,
  ListChecks,
  Star,
  Gauge,
  SlidersHorizontal,
  GripVertical,
  Eye,
  GitBranch,
  X,
} from 'lucide-react';

const QUESTION_TYPES: {
  value: QuestionType;
  label: string;
  icon: typeof Type;
}[] = [
  { value: 'short', label: 'Respuesta corta', icon: Type },
  { value: 'text', label: 'Respuesta larga', icon: AlignLeft },
  { value: 'single', label: 'Única respuesta', icon: CircleDot },
  { value: 'multiple', label: 'Opción múltiple', icon: ListChecks },
  { value: 'rating', label: 'Calificación', icon: Star },
  { value: 'opinion', label: 'Escala de opinión (0–5)', icon: Gauge },
  { value: 'likert', label: 'Escala de Likert', icon: SlidersHorizontal },
];

const usesOptions = (t: QuestionType) =>
  t === 'single' || t === 'multiple' || t === 'likert';

function newQuestion(): Question {
  return { id: Date.now().toString(), type: 'short', question: '', required: false };
}

function CreatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [surveyId, setSurveyId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('Encuesta sin título');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([newQuestion()]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [saving, setSaving] = useState<string | null>(null);

  // Cargar borrador existente
  useEffect(() => {
    let active = true;
    (async () => {
      if (editId) {
        const existing = await getSurveyById(editId);
        if (existing && active) {
          setSurveyId(existing.id);
          setTitle(existing.title);
          setDescription(existing.description);
          setQuestions(existing.questions.length ? existing.questions : [newQuestion()]);
          setSelectedId(existing.questions[0]?.id || '');
          return;
        }
      }
      if (active) setSelectedId((prev) => prev || questions[0]?.id || '');
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const selected = questions.find((q) => q.id === selectedId) || null;
  const selectedIndex = questions.findIndex((q) => q.id === selectedId);

  const addQuestion = () => {
    const q = newQuestion();
    setQuestions([...questions, q]);
    setSelectedId(q.id);
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== id) return q;
        const updated: Question = { ...q, [field]: value };
        if (field === 'type') {
          const t = value as QuestionType;
          if (t === 'likert') {
            updated.options = q.options?.length ? q.options : [...LIKERT_DEFAULT];
          } else if (usesOptions(t)) {
            updated.options = q.options?.length ? q.options : ['Opción 1', 'Opción 2'];
          } else {
            delete updated.options;
          }
        }
        return updated;
      })
    );
  };

  const updateOptions = (id: string, options: string[]) =>
    setQuestions(questions.map((q) => (q.id === id ? { ...q, options } : q)));

  const setCondition = (id: string, cond: Condition | undefined) =>
    setQuestions(questions.map((q) => (q.id === id ? { ...q, visibleIf: cond } : q)));

  const deleteQuestion = (id: string) => {
    const remaining = questions.filter((q) => q.id !== id);
    // limpiar condiciones que apuntaban a la pregunta borrada
    const cleaned = remaining.map((q) =>
      q.visibleIf?.questionId === id ? { ...q, visibleIf: undefined } : q
    );
    setQuestions(cleaned.length ? cleaned : [newQuestion()]);
    if (selectedId === id) setSelectedId(cleaned[0]?.id || '');
  };

  const validate = () => {
    if (!title.trim()) {
      alert('El título de la encuesta es requerido');
      return false;
    }
    if (questions.length === 0) {
      alert('Debes agregar al menos una pregunta');
      return false;
    }
    if (!questions.every((q) => q.question.trim())) {
      alert('Todas las preguntas deben tener texto');
      return false;
    }
    return true;
  };

  const persist = async (status: 'draft' | 'published') => {
    const saved = await upsertSurvey({
      id: surveyId,
      title,
      description,
      questions,
      status,
    });
    setSurveyId(saved.id);
    return saved;
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      alert('Ponle un título para guardar el borrador');
      return;
    }
    setSaving('draft');
    try {
      await persist('draft');
      router.push('/');
    } catch (e) {
      console.error(e);
      alert('No se pudo guardar. Revisa la conexión con Supabase.');
      setSaving(null);
    }
  };

  const handlePublish = async () => {
    if (!validate()) return;
    setSaving('publish');
    try {
      await persist('published');
      router.push('/');
    } catch (e) {
      console.error(e);
      alert('No se pudo publicar. Revisa la conexión con Supabase.');
      setSaving(null);
    }
  };

  const handlePreview = async () => {
    if (!validate()) return;
    // Abrimos la pestaña antes del await para evitar el bloqueo de pop-ups
    const win = window.open('about:blank', '_blank');
    try {
      const saved = await persist('draft');
      if (win) win.location.href = `/survey/${saved.shareLink}?preview=1`;
    } catch (e) {
      console.error(e);
      if (win) win.close();
      alert('No se pudo generar la vista previa.');
    }
  };

  // Preguntas anteriores que pueden usarse como condición
  const priorQuestions = questions.slice(0, Math.max(selectedIndex, 0));

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <header className="flex-shrink-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-gray-900 text-sm font-medium"
          >
            ← Cafecito
          </button>
          <span className="text-gray-300">/</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm font-medium text-gray-900 bg-transparent focus:outline-none focus:bg-gray-50 rounded px-2 py-1 min-w-0 max-w-xs"
          />
          {surveyId && (
            <span className="text-xs text-gray-400 hidden sm:inline">Borrador guardado</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 px-3.5 py-1.5 rounded-lg hover:bg-gray-50 transition"
          >
            <Eye size={15} />
            Vista previa
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={saving !== null}
            className="text-sm font-medium text-gray-700 border border-gray-200 px-3.5 py-1.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            {saving === 'draft' ? 'Guardando…' : 'Guardar borrador'}
          </button>
          <button
            onClick={handlePublish}
            disabled={saving !== null}
            className="bg-gray-900 text-white text-sm font-medium px-5 py-1.5 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
          >
            {saving === 'publish' ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </header>

      {/* Three-panel editor */}
      <div className="flex-1 flex min-h-0">
        {/* Left: question list */}
        <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-3">
            <button
              onClick={addQuestion}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white text-sm font-medium py-2 rounded-lg hover:bg-gray-800 transition"
            >
              <Plus size={16} />
              Añadir contenido
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
            {questions.map((q, idx) => {
              const TypeIcon =
                QUESTION_TYPES.find((t) => t.value === q.type)?.icon || Type;
              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedId(q.id)}
                  className={`w-full group flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition ${
                    selectedId === q.id
                      ? 'bg-blue-50 ring-1 ring-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded bg-gray-900 text-white text-xs font-semibold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <TypeIcon size={14} className="flex-shrink-0 text-gray-400" />
                  <span className="flex-1 truncate text-sm text-gray-700">
                    {q.question || 'Pregunta sin título'}
                  </span>
                  {q.visibleIf && (
                    <GitBranch size={12} className="flex-shrink-0 text-blue-400" />
                  )}
                  {questions.length > 1 && (
                    <Trash2
                      size={14}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuestion(q.id);
                      }}
                      className="flex-shrink-0 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center: live preview */}
        <main className="flex-1 min-w-0 bg-gray-50 flex items-center justify-center p-8 overflow-y-auto">
          {selected ? (
            <div className="w-full max-w-xl">
              <div className="flex items-start gap-3 mb-6">
                <span className="flex-shrink-0 mt-2 w-6 h-6 rounded bg-gray-900 text-white text-xs font-semibold flex items-center justify-center">
                  {selectedIndex + 1}
                </span>
                <input
                  value={selected.question}
                  onChange={(e) =>
                    updateQuestion(selected.id, 'question', e.target.value)
                  }
                  placeholder="Escribe tu pregunta aquí…"
                  className="flex-1 text-2xl font-semibold text-gray-900 placeholder-gray-300 bg-transparent focus:outline-none"
                />
              </div>
              <div className="pl-9">
                <PreviewInput question={selected} />
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Añade una pregunta para comenzar</p>
          )}
        </main>

        {/* Right: settings */}
        <aside className="w-72 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
          {selected && (
            <div className="p-5 space-y-6">
              {/* Tipo */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Tipo de pregunta
                </h3>
                <div className="space-y-1.5">
                  {QUESTION_TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        onClick={() => updateQuestion(selected.id, 'type', t.value)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                          selected.type === t.value
                            ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={16} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Obligatoria */}
              <div className="border-t border-gray-100 pt-5">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-gray-700">Obligatoria</span>
                  <button
                    onClick={() =>
                      updateQuestion(selected.id, 'required', !selected.required)
                    }
                    className={`relative w-10 h-6 rounded-full transition ${
                      selected.required ? 'bg-gray-900' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        selected.required ? 'translate-x-4' : ''
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* Opciones */}
              {usesOptions(selected.type) && (
                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    {selected.type === 'likert' ? 'Niveles de la escala' : 'Opciones'}
                  </h3>
                  <OptionsEditor
                    options={selected.options || []}
                    onUpdate={(opts) => updateOptions(selected.id, opts)}
                  />
                </div>
              )}

              {/* Lógica condicional */}
              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <GitBranch size={13} />
                  Lógica condicional
                </h3>
                <LogicEditor
                  current={selected}
                  priorQuestions={priorQuestions}
                  onChange={(cond) => setCondition(selected.id, cond)}
                />
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function PreviewInput({ question }: { question: Question }) {
  if (question.type === 'short') {
    return (
      <div className="border-b-2 border-gray-200 pb-2">
        <span className="text-lg text-gray-300">Escribe tu respuesta…</span>
      </div>
    );
  }
  if (question.type === 'text') {
    return (
      <div className="border-b-2 border-gray-200 pb-12">
        <span className="text-lg text-gray-300">Escribe tu respuesta…</span>
      </div>
    );
  }
  if (question.type === 'rating') {
    return (
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className="text-4xl text-gray-200">★</span>
        ))}
      </div>
    );
  }
  if (question.type === 'opinion') {
    return (
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className="w-11 h-11 rounded-lg border-2 border-gray-200 text-gray-400 flex items-center justify-center font-medium"
          >
            {n}
          </span>
        ))}
      </div>
    );
  }
  if (question.type === 'likert') {
    const options = question.options || [];
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => (
          <span
            key={i}
            className="px-3 py-2 rounded-lg border-2 border-gray-200 text-sm text-gray-500"
          >
            {opt || `Nivel ${i + 1}`}
          </span>
        ))}
      </div>
    );
  }
  // single / multiple
  const options = question.options || [];
  return (
    <div className="space-y-2">
      {options.map((opt, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-700"
        >
          <span
            className={`w-5 h-5 border-2 border-gray-300 ${
              question.type === 'single' ? 'rounded-full' : 'rounded'
            }`}
          />
          <span>{opt || `Opción ${idx + 1}`}</span>
        </div>
      ))}
      <p className="text-xs text-gray-400 pt-1">
        {question.type === 'single'
          ? 'El usuario elige una sola opción'
          : 'El usuario puede elegir varias'}
        {' · '}edita las opciones a la derecha →
      </p>
    </div>
  );
}

function OptionsEditor({
  options,
  onUpdate,
}: {
  options: string[];
  onUpdate: (options: string[]) => void;
}) {
  const addOption = () => onUpdate([...options, `Opción ${options.length + 1}`]);
  const updateOption = (i: number, v: string) => {
    const next = [...options];
    next[i] = v;
    onUpdate(next);
  };
  const deleteOption = (i: number) => onUpdate(options.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
            <input
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Opción ${index + 1}`}
              className="flex-1 min-w-0 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            {options.length > 1 && (
              <button
                onClick={() => deleteOption(index)}
                className="flex-shrink-0 p-1 text-gray-300 hover:text-red-500 transition"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={addOption}
        className="mt-2.5 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 font-medium"
      >
        <Plus size={14} />
        Añadir opción
      </button>
    </div>
  );
}

function LogicEditor({
  current,
  priorQuestions,
  onChange,
}: {
  current: Question;
  priorQuestions: Question[];
  onChange: (cond: Condition | undefined) => void;
}) {
  const cond = current.visibleIf;

  if (priorQuestions.length === 0) {
    return (
      <p className="text-xs text-gray-400 leading-relaxed">
        Añade preguntas antes de esta para poder mostrarla solo cuando se cumpla una
        condición.
      </p>
    );
  }

  if (!cond) {
    return (
      <button
        onClick={() =>
          onChange({
            questionId: priorQuestions[0].id,
            operator: 'equals',
            value: '',
          })
        }
        className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-gray-600 border border-dashed border-gray-300 rounded-lg py-2 hover:border-gray-400 hover:text-gray-900 transition"
      >
        <Plus size={14} />
        Añadir condición
      </button>
    );
  }

  const refQuestion =
    priorQuestions.find((q) => q.id === cond.questionId) || priorQuestions[0];
  const valueChoices = getConditionValues(refQuestion);

  return (
    <div className="space-y-2.5 bg-blue-50/50 border border-blue-100 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">Mostrar solo si…</span>
        <button
          onClick={() => onChange(undefined)}
          className="text-gray-400 hover:text-red-500 transition"
        >
          <X size={14} />
        </button>
      </div>

      {/* Pregunta de referencia */}
      <select
        value={cond.questionId}
        onChange={(e) =>
          onChange({ ...cond, questionId: e.target.value, value: '' })
        }
        className="w-full text-sm bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
      >
        {priorQuestions.map((q, i) => (
          <option key={q.id} value={q.id}>
            {i + 1}. {q.question || 'Pregunta sin título'}
          </option>
        ))}
      </select>

      {/* Operador */}
      <select
        value={cond.operator}
        onChange={(e) =>
          onChange({ ...cond, operator: e.target.value as Condition['operator'] })
        }
        className="w-full text-sm bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
      >
        <option value="equals">la respuesta es</option>
        <option value="not_equals">la respuesta no es</option>
      </select>

      {/* Valor */}
      {valueChoices ? (
        <select
          value={cond.value}
          onChange={(e) => onChange({ ...cond, value: e.target.value })}
          className="w-full text-sm bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
        >
          <option value="">Elige un valor…</option>
          {valueChoices.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      ) : (
        <input
          value={cond.value}
          onChange={(e) => onChange({ ...cond, value: e.target.value })}
          placeholder="Valor exacto…"
          className="w-full text-sm bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
      )}
    </div>
  );
}

export default function CreatePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-8 text-gray-500">Cargando editor…</div>}>
        <CreatePageInner />
      </Suspense>
    </ProtectedRoute>
  );
}
