import {
  AdminDashboardData,
  ApiResponse,
  BrandOwnerDashboardData,
  BusinessForSale,
  BusinessSellerDashboardData,
  Event,
  EventOrganizerDashboardData,
  EventRegistration,
  Franchise,
  InvestorDashboardData,
  Lead,
  LeadStatus,
  Message,
  NdaAgreement,
  PaginatedBusinesses,
  PaginatedEvents,
  PaginatedFranchises,
  PipelineCounts,
  SavedListing,
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
    const error = new Error(errorMsg) as Error & { statusCode?: number; errors?: unknown[]; data?: any };
    error.statusCode = response.status;
    error.errors = data.errors;
    error.data = data.data;
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

    update: (id: string, payload: Partial<Franchise>) =>
      fetcher<{ franchise: Franchise }>(`/franchises/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),

    getBrochureUrl: (slug: string) => `${API_BASE}/franchises/${slug}/brochure`,

    getBrochureAnalytics: (id: string) =>
      fetcher<{
        franchiseId: string;
        slug: string;
        periodDays: number;
        totalDownloads: number;
        uniqueDownloads: number;
      }>(`/franchises/${id}/brochure-analytics`),
  },

  leads: {
    create: (payload: {
      targetType?: 'franchise' | 'business';
      targetId?: string;
      brandId?: string;
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

    list: (params: QueryParams = {}) =>
      fetcher<{ leads: Lead[]; total: number; page: number; limit: number; totalPages: number }>(
        `/leads${buildQuery(params)}`
      ),

    myInquiries: (params: QueryParams = {}) =>
      fetcher<{ leads: Lead[]; total: number; page: number; limit: number; totalPages: number }>(
        `/leads${buildQuery(params)}`
      ),

    getPipelineCounts: () => fetcher<{ counts: PipelineCounts }>('/leads/pipeline-counts'),

    getById: (id: string) => fetcher<{ lead: Lead }>(`/leads/${id}`),

    updateStatus: (id: string, payload: { status: LeadStatus; notes?: string; reason?: string }) =>
      fetcher<{ lead: Lead }>(`/leads/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
  },

  messages: {
    list: (leadId: string, since?: string) =>
      fetcher<{ messages: Message[] }>(
        `/leads/${leadId}/messages${since ? `?since=${encodeURIComponent(since)}` : ''}`
      ),

    send: (leadId: string, body: string) =>
      fetcher<{ message: Message }>(`/leads/${leadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),

    markRead: (leadId: string) =>
      fetcher<{ markedReadCount: number }>(`/leads/${leadId}/messages/read`, {
        method: 'POST',
      }),

    getUnreadCount: () => fetcher<{ unreadCount: number }>('/unread-count'),
  },

  saved: {
    save: (targetType: 'franchise' | 'event' | 'business', targetId: string) =>
      fetcher<{ saved: SavedListing }>('/saved', {
        method: 'POST',
        body: JSON.stringify({ targetType, targetId }),
      }),

    unsave: (targetType: 'franchise' | 'event' | 'business', targetId: string) =>
      fetcher<null>(`/saved?targetType=${targetType}&targetId=${targetId}`, {
        method: 'DELETE',
      }),

    list: (type?: string) =>
      fetcher<{ saved: SavedListing[]; total: number }>(`/saved${type ? `?type=${type}` : ''}`),
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

    create: (payload: Partial<Event>) =>
      fetcher<{ event: Event }>('/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    register: (eventId: string) =>
      fetcher<{ registration: EventRegistration; event: Partial<Event> }>(
        `/events/${eventId}/register`,
        { method: 'POST' }
      ),

    cancelRegistration: (eventId: string) =>
      fetcher<null>(`/events/${eventId}/register`, { method: 'DELETE' }),

    getIcsUrl: (slug: string) => `${API_BASE}/events/${slug}/calendar.ics`,

    getAttendeesCsvUrl: (eventId: string) => `${API_BASE}/events/${eventId}/attendees.csv`,

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

    create: (payload: Partial<BusinessForSale>) =>
      fetcher<{ business: BusinessForSale }>('/business-for-sale', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    update: (id: string, payload: Partial<BusinessForSale>) =>
      fetcher<{ business: BusinessForSale }>(`/business-for-sale/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),

    signNda: (id: string, payload: { signedName: string; accepted: true; agreementVersion?: string }) =>
      fetcher<{ ndaAgreement: NdaAgreement; alreadySigned: boolean; businessId: string }>(
        `/business-for-sale/${id}/nda`,
        {
          method: 'POST',
          body: JSON.stringify({ ...payload, agreementVersion: payload.agreementVersion || 'v1.0' }),
        }
      ),
  },

  dashboards: {
    investor: () => fetcher<InvestorDashboardData>('/dashboard/investor'),
    brandOwner: () => fetcher<BrandOwnerDashboardData>('/dashboard/brand-owner'),
    businessSeller: () => fetcher<BusinessSellerDashboardData>('/dashboard/business-seller'),
    eventOrganizer: () => fetcher<EventOrganizerDashboardData>('/dashboard/event-organizer'),
    admin: () => fetcher<AdminDashboardData>('/dashboard/admin'),
  },

  admin: {
    getPendingListings: () =>
      fetcher<{
        franchises: Franchise[];
        events: Event[];
        businesses: BusinessForSale[];
        totalPending: number;
      }>('/admin/pending'),

    updateListingStatus: (
      type: 'franchise' | 'event' | 'business',
      id: string,
      status: 'approved' | 'rejected' | 'pending',
      rejectionReason?: string
    ) =>
      fetcher<{ id: string; type: string; status: string; rejectionReason?: string }>(
        `/admin/${type}/${id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status, rejectionReason }),
        }
      ),

    getUsers: (params: QueryParams = {}) =>
      fetcher<{ users: User[]; total: number; page: number; limit: number; totalPages: number }>(
        `/admin/users${buildQuery(params)}`
      ),

    toggleUserActive: (id: string, isActive: boolean) =>
      fetcher<{ id: string; email: string; isActive: boolean }>(`/admin/users/${id}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
  },
};

export type ApiError = Error & { statusCode?: number; errors?: unknown[]; data?: any };
