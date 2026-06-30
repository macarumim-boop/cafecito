import { supabase } from './supabase';

export type QuestionType =
  | 'short'
  | 'text'
  | 'single'
  | 'multiple'
  | 'rating'
  | 'opinion'
  | 'likert';

export interface Condition {
  questionId: string;
  operator: 'equals' | 'not_equals';
  value: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  required: boolean;
  /** Si está definido, la pregunta solo se muestra cuando la condición se cumple. */
  visibleIf?: Condition;
}

export type SurveyStatus = 'draft' | 'published';

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  status: SurveyStatus;
  createdAt: Date;
  updatedAt: Date;
  shareLink: string;
}

export interface Response {
  id: string;
  surveyId: string;
  answers: Record<string, string | number | string[]>;
  submittedAt: Date;
}

export const LIKERT_DEFAULT = [
  'Muy en desacuerdo',
  'En desacuerdo',
  'Neutral',
  'De acuerdo',
  'Muy de acuerdo',
];

// --- Mapeo entre filas de la base (snake_case) y el modelo de la app ---

function rowToSurvey(r: any): Survey {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? '',
    questions: (r.questions as Question[]) ?? [],
    status: (r.status as SurveyStatus) ?? 'published',
    shareLink: r.share_link,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at ?? r.created_at),
  };
}

function rowToResponse(r: any): Response {
  return {
    id: r.id,
    surveyId: r.survey_id,
    answers: r.answers ?? {},
    submittedAt: new Date(r.submitted_at),
  };
}

// --- Encuestas ---

export async function getSurveys(): Promise<Survey[]> {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToSurvey);
}

interface SurveyInput {
  id?: string;
  title: string;
  description: string;
  questions: Question[];
  status: SurveyStatus;
}

/** Crea o actualiza una encuesta. Devuelve la encuesta resultante. */
export async function upsertSurvey(input: SurveyInput): Promise<Survey> {
  if (input.id) {
    const { data, error } = await supabase
      .from('surveys')
      .update({
        title: input.title,
        description: input.description,
        questions: input.questions,
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single();
    if (error) throw error;
    return rowToSurvey(data);
  }

  const shareLink = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .substring(2, 11)}`;
  const { data, error } = await supabase
    .from('surveys')
    .insert({
      title: input.title,
      description: input.description,
      questions: input.questions,
      status: input.status,
      share_link: shareLink,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToSurvey(data);
}

export async function getSurveyByShareLink(
  shareLink: string
): Promise<Survey | null> {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('share_link', shareLink)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSurvey(data) : null;
}

export async function getSurveyById(id: string): Promise<Survey | null> {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSurvey(data) : null;
}

export async function deleteSurvey(id: string): Promise<void> {
  const { error } = await supabase.from('surveys').delete().eq('id', id);
  if (error) throw error;
}

// --- Respuestas ---

export async function saveResponse(
  response: Omit<Response, 'id' | 'submittedAt'>
): Promise<Response> {
  const { data, error } = await supabase
    .from('responses')
    .insert({
      survey_id: response.surveyId,
      answers: response.answers,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToResponse(data);
}

export async function getResponsesBySurvey(
  surveyId: string
): Promise<Response[]> {
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('survey_id', surveyId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToResponse);
}

// --- Lógica condicional (puras, sin red) ---

/** Evalúa si una pregunta debe mostrarse dadas las respuestas actuales. */
export function isQuestionVisible(
  question: Question,
  answers: Record<string, any>
): boolean {
  if (!question.visibleIf) return true;
  const { questionId, operator, value } = question.visibleIf;
  const answer = answers[questionId];
  const values = Array.isArray(answer)
    ? answer.map(String)
    : answer === undefined || answer === ''
      ? []
      : [String(answer)];
  const matches = values.includes(value);
  return operator === 'equals' ? matches : !matches;
}

/** Devuelve las opciones de valor posibles para usar en una condición. null = texto libre. */
export function getConditionValues(question: Question): string[] | null {
  switch (question.type) {
    case 'single':
    case 'multiple':
    case 'likert':
      return question.options || [];
    case 'opinion':
      return ['0', '1', '2', '3', '4', '5'];
    case 'rating':
      return ['1', '2', '3', '4', '5'];
    default:
      return null;
  }
}
