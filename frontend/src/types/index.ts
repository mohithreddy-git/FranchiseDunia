export type UserRole =
  | 'investor'
  | 'brand_owner'
  | 'business_seller'
  | 'event_organizer'
  | 'admin';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  city?: string;
  company?: string;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: string;
}

// ─── Franchise Types ──────────────────────────────────────────────────────────

export interface UnitEconomics {
  expectedMonthlyRevenue: number;
  expectedNetProfitMargin: number;
  paybackPeriodMonths: number;
  breakEvenPeriodMonths: number;
}

export interface Franchise {
  _id: string;
  name: string;
  slug: string;
  tagline: string;
  industry: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isSampleData?: boolean;
  isSaved?: boolean;
  brandOwner: {
    _id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
    city?: string;
  };
  investmentMin: number;
  investmentMax: number;
  franchiseFee: number;
  royaltyPercent: number;
  spaceMinSqFt: number;
  spaceMaxSqFt: number;
  roiPeriodMonths: number;
  unitsOperational: number;
  headquarters: string;
  availableLocations: string[];
  establishedYear: number;
  description: string;
  supportProvided: string[];
  unitEconomics: UnitEconomics;
  logoUrl?: string;
  coverImageUrl?: string;
  gallery?: string[];
  brochureUrl?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
}

// ─── Lead & Scoring Types ─────────────────────────────────────────────────────

export type LeadStatus = 'new' | 'under_review' | 'contacted' | 'converted' | 'rejected';

export interface ScoreBreakdown {
  budgetFit: number;
  timelineUrgency: number;
  profileCompleteness: number;
  accountTrust: number;
  messageQuality: number;
}

export interface StatusHistoryEntry {
  from: string;
  to: string;
  by: string | User;
  at: string;
  reason?: string;
}

export interface Lead {
  _id: string;
  investor: string | User;
  targetType: 'franchise' | 'business';
  targetId: string | Franchise | BusinessForSale | any;
  targetModel?: 'Franchise' | 'BusinessForSale';
  listingOwner: string | User;
  brandId?: string | Franchise;
  brandOwner?: string | User;
  fullName: string;
  email: string;
  phone: string;
  investmentBudget: number;
  targetCity: string;
  timeline: string;
  hasCommercialSpace: boolean;
  spaceAvailableSqFt?: number;
  message: string;
  status: LeadStatus;
  statusHistory?: StatusHistoryEntry[];
  leadScore: number;
  scoreBreakdown?: ScoreBreakdown;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PipelineCounts {
  new: number;
  under_review: number;
  contacted: number;
  converted: number;
  rejected: number;
  total: number;
  avgScore: number;
}

// ─── Message Types ────────────────────────────────────────────────────────────

export interface Message {
  _id: string;
  lead: string | Lead;
  sender: string | User;
  recipient: string | User;
  body: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Saved Listing Types ──────────────────────────────────────────────────────

export interface SavedListing {
  _id: string;
  user: string | User;
  targetType: 'franchise' | 'event' | 'business';
  targetId: string | Franchise | Event | BusinessForSale | any;
  targetModel: 'Franchise' | 'Event' | 'BusinessForSale';
  createdAt?: string;
}

// ─── Event Types ──────────────────────────────────────────────────────────────

export type EventType = 'exhibition' | 'investor_summit' | 'networking' | 'webinar';

export interface EventSpeaker {
  name: string;
  title?: string;
  org?: string;
  designation?: string;
  company?: string;
  topic?: string;
  photoUrl?: string;
}

export interface EventAgendaItem {
  time: string;
  title: string;
  description?: string;
}

export interface EventExhibitor {
  name: string;
  boothNo?: string;
  boothNumber?: string;
  industry?: string;
}

export interface Event {
  _id: string;
  title: string;
  slug: string;
  type: EventType;
  city: string;
  venue: string;
  startDate: string;
  endDate: string;
  capacity: number;
  registeredCount: number;
  ticketPrice: number;
  description: string;
  coverImageUrl?: string;
  organizer: {
    _id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
  };
  speakers?: EventSpeaker[];
  agenda?: EventAgendaItem[];
  exhibitors?: EventExhibitor[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isSampleData?: boolean;
  isSaved?: boolean;
  isVerified?: boolean;
  createdAt?: string;
}

export interface EventRegistration {
  _id: string;
  event: string | Event;
  user: string | User;
  ticketCode: string;
  status: 'confirmed' | 'cancelled';
  createdAt?: string;
}

export interface PaginatedEvents {
  events: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Business-for-Sale Types ──────────────────────────────────────────────────

export type BusinessListingType = 'sale' | 'joint_venture' | 'equity_stake' | 'partnership';

export interface ProtectedFinancials {
  exactRevenue: number;
  exactNetProfit: number;
  balanceSheetSummary: string;
  exactAddress: string;
  customerConcentration: string;
  reasonForSale: string;
  sellerContact: string;
}

export interface BusinessForSale {
  _id: string;
  id: string;
  title: string;
  slug: string;
  listingType: BusinessListingType;
  industry: string;
  region: string;
  establishedYear: number;
  employeeCountBand: string;
  revenueBand: string;
  profitBand: string;
  askingPriceBand: string;
  summary: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isSampleData?: boolean;
  isVerified?: boolean;
  isSaved?: boolean;
  seller?: {
    id: string;
    name: string;
    company?: string;
  };
  // Protected — only present after NDA signed by viewer
  protectedFinancials?: ProtectedFinancials;
  createdAt?: string;
  updatedAt?: string;
}

export interface NdaAgreement {
  _id: string;
  user: string | User;
  business: string | BusinessForSale;
  signedName: string;
  agreementVersion: string;
  signedAt: string;
  ipAddress?: string;
}

export interface PaginatedBusinesses {
  businesses: BusinessForSale[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Dashboard Metric Types ───────────────────────────────────────────────────

export interface InvestorDashboardData {
  inquiries: Lead[];
  savedListings: SavedListing[];
  rsvps: EventRegistration[];
  ndas: NdaAgreement[];
}

export interface BrandOwnerDashboardData {
  franchises: Franchise[];
  leadsSummary: {
    total: number;
    newThisWeek: number;
    avgScore: number;
    pipelineCounts: Record<LeadStatus, number>;
  };
  brochuresSummary: {
    totalDownloads: number;
    uniqueDownloads: number;
  };
}

export interface BusinessSellerDashboardData {
  businesses: BusinessForSale[];
  inquiries: Lead[];
  executedNdas: any[];
}

export interface EventOrganizerDashboardData {
  events: Event[];
  totalEvents: number;
  totalRegistrations: number;
}

export interface AdminDashboardData {
  usersByRole: Record<string, number>;
  franchisesByStatus: Record<string, number>;
  eventsByStatus: Record<string, number>;
  businessesByStatus: Record<string, number>;
  leadsThisWeek: number;
  totalRegistrations: number;
}

// ─── Generic API Response Wrapper ─────────────────────────────────────────────

export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedFranchises {
  franchises: Franchise[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
