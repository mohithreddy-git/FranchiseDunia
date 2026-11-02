import { ApiResponse, Franchise, Lead, PaginatedFranchises, User, UserRole } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

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
    const error = new Error(errorMsg) as Error & { statusCode?: number; errors?: any[] };
    error.statusCode = response.status;
    error.errors = data.errors;
    throw error;
  }

  return data.data;
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
    }) => fetcher<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

    login: (credentials: { email: string; password: string }) =>
      fetcher<{ user: User; accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    logout: () =>
      fetcher<null>('/auth/logout', {
        method: 'POST',
      }),

    getMe: () => fetcher<{ user: User }>('/auth/me'),

    demoLogin: (role: UserRole) =>
      fetcher<{ user: User; accessToken: string }>('/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ role }),
      }),

    getDemoStatus: () => fetcher<{ demoModeEnabled: boolean }>('/auth/demo-status'),
  },

  franchises: {
    list: (params: Record<string, string | number | boolean | undefined>) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== 'All') {
          query.append(key, String(value));
        }
      });
      const queryString = query.toString();
      return fetcher<PaginatedFranchises>(`/franchises${queryString ? `?${queryString}` : ''}`);
    },

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
};
