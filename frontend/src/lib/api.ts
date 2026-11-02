import {
  ApiResponse,
  BusinessForSale,
  Event,
  EventRegistration,
  Franchise,
  Lead,
  NdaAgreement,
  PaginatedBusinesses,
  PaginatedEvents,
  PaginatedFranchises,
  User,
  UserRole,
} from '@/types';

// Use /api/v1 so that Next.js rewrites proxy to backend (same-origin cookies in all envs)
const API_BASE = '/api/v1';

type QueryParams = Record<string, string | number | boolean | undefined>;

async function fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Essential for httpOnly cookies (accessToken, refreshToken)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg) as Error & { statusCode?: number; errors?: unknown[] };
    error.statusCode = response.status;
    error.errors = data.errors;
    throw error;
  }

  return data.data;
}

function buildQuery(params: QueryParams): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'All') {
      query.append(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  auth: {
    register: (payload: {
      name: string;
      email: string;
      password: string;
      role: UserRole;
      phone?: string;
      city?: string;
      company?: string;
    }) =>
      fetcher<{ user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    login: (credentials: { email: string; password: string }) =>
      fetcher<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    logout: () =>
      fetcher<null>('/auth/logout', {
        method: 'POST',
      }),

    getMe: () => fetcher<{ user: User }>('/auth/me'),

    demoLogin: (role: UserRole) =>
      fetcher<{ user: User }>('/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ role }),
      }),

    getDemoStatus: () => fetcher<{ demoModeEnabled: boolean }>('/auth/demo-status'),
  },

  franchises: {
    list: (params: QueryParams) =>
      fetcher<PaginatedFranchises>(`/franchises${buildQuery(params)}`),

    getBySlug: (slug: string) => fetcher<{ franchise: Franchise }>(`/franchises/${slug}`),

    create: (payload: Partial<Franchise>) =>
      fetcher<{ franchise: Franchise }>('/franchises', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  leads: {
    create: (payload: {
      brandId: string;
      fullName: string;
      email: string;
      phone: string;
      investmentBudget: number;
      targetCity: string;
      timeline?: string;
      hasCommercialSpace?: boolean;
      spaceAvailableSqFt?: number;
      message: string;
    }) =>
      fetcher<{ lead: Lead }>('/leads', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    list: () => fetcher<{ leads: Lead[]; total: number }>('/leads'),

    getById: (id: string) => fetcher<{ lead: Lead }>(`/leads/${id}`),
  },

  events: {
    list: (params: QueryParams = {}) =>
      fetcher<PaginatedEvents>(`/events${buildQuery(params)}`),

    getBySlug: (slug: string) =>
      fetcher<{
        event: Event;
        googleCalendarUrl: string;
        isRegistered: boolean;
        ticketCode: string | null;
        isSoldOut: boolean;
      }>(`/events/${slug}`),

    register: (eventId: string) =>
      fetcher<{ registration: EventRegistration; event: Partial<Event> }>(
        `/events/${eventId}/register`,
        { method: 'POST' }
      ),

    cancelRegistration: (eventId: string) =>
      fetcher<null>(`/events/${eventId}/register`, { method: 'DELETE' }),

    getIcsUrl: (slug: string) => `${API_BASE}/events/${slug}/calendar.ics`,

    getGoogleCalendarUrl: (event: Event) => {
      const base = 'https://calendar.google.com/calendar/render';
      const formatUtc = (d: string) =>
        new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const text = encodeURIComponent(event.title);
      const dates = `${formatUtc(event.startDate)}/${formatUtc(event.endDate)}`;
      const details = encodeURIComponent(event.description || '');
      const location = encodeURIComponent(`${event.venue}, ${event.city}`);
      return `${base}?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
    },
  },

  businessForSale: {
    list: (params: QueryParams = {}) =>
      fetcher<PaginatedBusinesses>(`/business-for-sale${buildQuery(params)}`),

    getById: (id: string) =>
      fetcher<{ business: BusinessForSale; ndaSigned: boolean }>(`/business-for-sale/${id}`),

    signNda: (id: string, payload: { signedName: string; accepted: true }) =>
      fetcher<{ ndaAgreement: NdaAgreement; alreadySigned: boolean; businessId: string }>(
        `/business-for-sale/${id}/nda`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      ),
  },
};

export type ApiError = Error & { statusCode?: number; errors?: unknown[] };
