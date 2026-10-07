import type { CVContent, CVData, CVLang } from '../types/cv';

const BASE_URL = import.meta.env.PUBLIC_API_URL;

/** Error thrown for any non-2xx response. `status` is the HTTP status code. */
export class ApiError extends Error {
  status: number;
  /** Seconds to wait before retrying, when the server says so (429). */
  retryAfter?: number;

  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export const isApiError = (error: unknown, status?: number): error is ApiError =>
  error instanceof ApiError && (status === undefined || error.status === status);

async function apiRequest<T>(
  endpoint: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail = typeof errorBody.detail === 'string' ? errorBody.detail : 'API Request Failed';
    const retryAfter = Number(response.headers.get('Retry-After')) || undefined;
    throw new ApiError(detail, response.status, retryAfter);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

export interface CVRecord {
  id: string;
  title: string;
  content: CVContent;
  language: string;
  theme: string | null;
  updated_at: string;
}

interface CVWrite {
  title: string;
  content: CVContent;
  language?: string;
  theme?: string;
}

export interface ATSResult {
  final_ats_score: number;
  overall_interview_probability: number;
  tier_classification: string;
  hard_requirements_analysis: Array<{ requirement: string; status: string; comment: string }>;
  missing_keywords: string[];
  top_improvement_actions: string[];
}

export type RewriteAction = 'enhance' | 'optimize' | 'translate';
export type PlanType = '7' | '30' | 'lifetime';

export interface Quota {
  limit: number;
  remaining: number;
  /** When the next use becomes available again; only set once a rolling allowance is used up. */
  resets_at: string | null;
}

export type Plan = 'free' | 'sprint' | 'active' | 'lifetime';

export interface UserProfile {
  id: string;
  is_pro: boolean;
  pro_expires_at: string | null;
  // The fields below are missing while an older backend is deployed
  plan?: Plan;
  /** Active Hunt and Lifetime: features with a running cost, such as the mock interview. */
  is_premium?: boolean;
  premium_until?: string | null;
  /** What a non-Pro user has left. */
  usage?: {
    free_ai: Quota;
    free_imports: Quota;
    interviews_daily?: Quota;
    interviews_monthly?: Quota;
  };
}

// ── Public links ─────────────────────────────────────────────────────────────

export interface PublicLink {
  cv_id: string;
  slug: string;
  is_active: boolean;
  /** Switched on, but offline because the plan allows fewer links. */
  paused: boolean;
  show_email: boolean;
  show_phone: boolean;
  indexable: boolean;
  views_total: number;
  /** Views since the owner last looked. */
  views_new: number;
  created_at: string;
}

export interface PublicLinkSettings {
  slug: string;
  is_active: boolean;
  show_email: boolean;
  show_phone: boolean;
  indexable: boolean;
}

export interface LinkStats {
  views_total: number;
  visitors_total: number;
  /** Pro only. */
  daily: { day: string; views: number }[] | null;
  referrers: { host: string | null; views: number }[] | null;
}

// ── Mock interview ───────────────────────────────────────────────────────────

export interface InterviewTurn {
  index: number;
  role: 'recruiter' | 'candidate';
  kind: 'question' | 'follow_up' | 'answer' | 'closing';
  /** Which prepared question this turn belongs to. */
  question: number;
  text: string;
  at: string;
}

export interface InterviewAnswerFeedback {
  question: number;
  score: number; // 0-10
  went_well: string;
  improve: string;
  sample_answer: string;
}

export interface InterviewReport {
  overall_score: number; // 0-100
  summary: string;
  strengths: string[];
  improvements: string[];
  tips: string[];
  answers: InterviewAnswerFeedback[];
}

export interface InterviewSummary {
  id: string;
  title: string;
  language: string;
  status: 'active' | 'completed';
  question_count: number;
  overall_score: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface InterviewSession extends InterviewSummary {
  /** Index of the question being asked; equals question_count once the interview is over. */
  current_question: number;
  /** The recruiter has said goodbye; only the report is left. */
  done: boolean;
  /** The questions asked so far, as prepared. */
  questions: string[];
  turns: InterviewTurn[];
  report: InterviewReport | null;
}

export interface InterviewAnswerResult {
  answer: InterviewTurn;
  reply: InterviewTurn;
  current_question: number;
  done: boolean;
}

/** Like apiRequest, for endpoints that answer with a file. */
async function apiBlob(endpoint: string, token: string | null): Promise<Blob> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail = typeof errorBody.detail === 'string' ? errorBody.detail : 'API Request Failed';
    throw new ApiError(
      detail,
      response.status,
      Number(response.headers.get('Retry-After')) || undefined
    );
  }
  return response.blob();
}

export const api = {
  // User Profile
  getUserProfile: (token: string | null) =>
    apiRequest<UserProfile>(`/users/me?_t=${Date.now()}`, token),

  // CV CRUD (the server assigns the id)
  getCVs: (token: string | null) => apiRequest<CVRecord[]>(`/cvs/?_t=${Date.now()}`, token),

  getCV: (id: string, token: string | null) =>
    apiRequest<CVRecord>(`/cvs/${id}?_t=${Date.now()}`, token),

  createCV: (data: CVWrite, token: string | null) =>
    apiRequest<CVRecord>('/cvs/', token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCV: (id: string, data: Partial<CVWrite>, token: string | null) =>
    apiRequest<CVRecord>(`/cvs/${id}`, token, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCV: (id: string, token: string | null) =>
    apiRequest<void>(`/cvs/${id}`, token, {
      method: 'DELETE',
    }),

  // AI Actions
  rewriteCV: (
    params: {
      cv_content: CVData;
      action: RewriteAction;
      target_language: CVLang;
      job_description?: string;
    },
    token: string | null
  ) =>
    apiRequest<{ cv: Record<string, unknown>; free_remaining?: number | null }>(
      '/ai/rewrite',
      token,
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    ),

  // Public links
  listLinks: (token: string | null) => apiRequest<PublicLink[]>(`/links?_t=${Date.now()}`, token),

  checkSlug: (slug: string, cvId: string, token: string | null) =>
    apiRequest<{ slug: string; available: boolean; reason: string | null }>(
      `/links/check?slug=${encodeURIComponent(slug)}&cv_id=${encodeURIComponent(cvId)}`,
      token
    ),

  saveLink: (cvId: string, settings: PublicLinkSettings, token: string | null) =>
    apiRequest<PublicLink>(`/cvs/${cvId}/link`, token, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  deleteLink: (cvId: string, token: string | null) =>
    apiRequest<void>(`/cvs/${cvId}/link`, token, { method: 'DELETE' }),

  linkStats: (cvId: string, token: string | null) =>
    apiRequest<LinkStats>(`/cvs/${cvId}/link/stats?_t=${Date.now()}`, token),

  /** The owner has seen the current view counts. */
  markLinksSeen: (token: string | null) =>
    apiRequest<void>('/links/seen', token, { method: 'POST' }),

  // Mock interview (premium plans)
  startInterview: (
    params: {
      cv_content: CVData;
      job_description: string;
      language: CVLang;
      question_count: number;
    },
    token: string | null
  ) =>
    apiRequest<InterviewSession>('/interviews', token, {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  listInterviews: (token: string | null) =>
    apiRequest<InterviewSummary[]>(`/interviews?_t=${Date.now()}`, token),

  getInterview: (id: string, token: string | null) =>
    apiRequest<InterviewSession>(`/interviews/${id}?_t=${Date.now()}`, token),

  deleteInterview: (id: string, token: string | null) =>
    apiRequest<void>(`/interviews/${id}`, token, { method: 'DELETE' }),

  /** A spoken answer: the recording is the request body. */
  answerInterviewAudio: (id: string, recording: Blob, token: string | null) =>
    apiRequest<InterviewAnswerResult>(`/interviews/${id}/answer`, token, {
      method: 'POST',
      body: recording,
      headers: { 'Content-Type': recording.type || 'audio/webm' },
    }),

  answerInterviewText: (id: string, text: string, token: string | null) =>
    apiRequest<InterviewAnswerResult>(`/interviews/${id}/answer`, token, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  /** Speech (MP3) for something the recruiter said. */
  getInterviewAudio: (id: string, turnIndex: number, token: string | null) =>
    apiBlob(`/interviews/${id}/turns/${turnIndex}/audio`, token),

  finishInterview: (id: string, token: string | null) =>
    apiRequest<InterviewSession>(`/interviews/${id}/finish`, token, { method: 'POST' }),

  // Text of an existing resume → structured CV (free users get a limited number)
  importCV: (
    params: { text: string; source: 'pdf' | 'structured'; language: CVLang },
    token: string | null
  ) =>
    apiRequest<{ cv: Record<string, unknown>; remaining_free_imports: number | null }>(
      '/ai/import',
      token,
      { method: 'POST', body: JSON.stringify(params) }
    ),

  simulateATS: (
    cv_content: CVData,
    job_description: string,
    language: CVLang,
    token: string | null
  ) =>
    apiRequest<ATSResult>('/ai/ats', token, {
      method: 'POST',
      body: JSON.stringify({ cv_content, job_description, language }),
    }),

  generateCoverLetter: (
    cv_content: CVData,
    job_description: string,
    language: CVLang,
    token: string | null
  ) =>
    apiRequest<{ cover_letter: string }>('/ai/cover-letter', token, {
      method: 'POST',
      body: JSON.stringify({ cv_content, job_description, language }),
    }),

  // Billing
  createCheckoutSession: (plan_type: PlanType, token: string | null) =>
    apiRequest<{ url: string }>('/billing/create-checkout-session', token, {
      method: 'POST',
      body: JSON.stringify({ plan_type }),
    }),

  redeemPromo: (code: string, token: string | null) =>
    apiRequest<{ success: boolean; message: string; granted_days: number }>(
      '/promo/redeem',
      token,
      {
        method: 'POST',
        body: JSON.stringify({ code }),
      }
    ),
};
