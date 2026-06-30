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

const SURVEYS_KEY = 'cafecito_surveys';
const RESPONSES_KEY = 'cafecito_responses';

export const LIKERT_DEFAULT = [
  'Muy en desacuerdo',
  'En desacuerdo',
  'Neutral',
  'De acuerdo',
  'Muy de acuerdo',
];

export function getSurveys(): Survey[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(SURVEYS_KEY);
  if (!data) return [];
  return JSON.parse(data).map((s: any) => ({
    status: s.status ?? 'published',
    updatedAt: new Date(s.updatedAt ?? s.createdAt),
    ...s,
    createdAt: new Date(s.createdAt),
  }));
}

function persist(surveys: Survey[]) {
  localStorage.setItem(SURVEYS_KEY, JSON.stringify(surveys));
}

interface SurveyInput {
  id?: string;
  title: string;
  description: string;
  questions: Question[];
  status: SurveyStatus;
}

/** Crea o actualiza una encuesta. Devuelve la encuesta resultante. */
export function upsertSurvey(input: SurveyInput): Survey {
  const surveys = getSurveys();

  if (input.id) {
    const index = surveys.findIndex((s) => s.id === input.id);
    if (index !== -1) {
      const updated: Survey = {
        ...surveys[index],
        title: input.title,
        description: input.description,
        questions: input.questions,
        status: input.status,
        updatedAt: new Date(),
      };
      surveys[index] = updated;
      persist(surveys);
      return updated;
    }
  }

  const id = Date.now().toString();
  const newSurvey: Survey = {
    id,
    title: input.title,
    description: input.description,
    questions: input.questions,
    status: input.status,
    shareLink: `${id}-${Math.random().toString(36).substring(2, 11)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  surveys.push(newSurvey);
  persist(surveys);
  return newSurvey;
}

export function getSurveyByShareLink(shareLink: string): Survey | null {
  return getSurveys().find((s) => s.shareLink === shareLink) || null;
}

export function getSurveyById(id: string): Survey | null {
  return getSurveys().find((s) => s.id === id) || null;
}

export function deleteSurvey(id: string): void {
  persist(getSurveys().filter((s) => s.id !== id));
}

export function saveResponse(response: Omit<Response, 'id' | 'submittedAt'>): Response {
  const responses = getResponses();
  const newResponse: Response = {
    ...response,
    id: Date.now().toString(),
    submittedAt: new Date(),
  };
  responses.push(newResponse);
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
  return newResponse;
}

export function getResponses(): Response[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(RESPONSES_KEY);
  if (!data) return [];
  return JSON.parse(data).map((r: any) => ({
    ...r,
    submittedAt: new Date(r.submittedAt),
  }));
}

export function getResponsesBySurvey(surveyId: string): Response[] {
  return getResponses().filter((r) => r.surveyId === surveyId);
}

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
