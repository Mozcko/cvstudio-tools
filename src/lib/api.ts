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

export const api = {
  // User Profile
  getUserProfile: (token: string | null) =>
    apiRequest<{ id: string; is_pro: boolean; pro_expires_at: string | null }>(
      `/users/me?_t=${Date.now()}`,
      token
    ),

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
    apiRequest<{ cv: Record<string, unknown> }>('/ai/rewrite', token, {
      method: 'POST',
      body: JSON.stringify(params),
    }),

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
