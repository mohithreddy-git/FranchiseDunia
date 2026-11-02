export type UserRole =
  | 'investor'
  | 'brand_owner'
  | 'business_seller'
  | 'event_organizer'
  | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  city?: string;
  company?: string;
  isVerified?: boolean;
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
  isSampleData?: boolean;
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

export interface Lead {
  _id: string;
  investor: string | Partial<User>;
  brandId: string | Partial<Franchise>;
  brandOwner: string | Partial<User>;
  fullName: string;
  email: string;
  phone: string;
  investmentBudget: number;
  targetCity: string;
  timeline: string;
  hasCommercialSpace: boolean;
  spaceAvailableSqFt?: number;
  message: string;
  status: 'new' | 'under_review' | 'contacted' | 'converted' | 'rejected';
  leadScore: number;
  notes?: string;
  createdAt?: string;
}

// ─── Event Types ──────────────────────────────────────────────────────────────

export type EventType = 'exhibition' | 'investor_summit' | 'networking' | 'webinar';

export interface EventSpeaker {
  name: string;
  designation: string;
  company: string;
  photoUrl?: string;
  topic?: string;
}

export interface EventAgendaItem {
  time: string;
  title: string;
  description?: string;
  speaker?: string;
  type: 'keynote' | 'panel' | 'workshop' | 'networking' | 'break';
}

export interface EventExhibitor {
  name: string;
  logoUrl?: string;
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
  bannerImageUrl?: string;
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
  tags?: string[];
  status: 'pending' | 'approved' | 'rejected';
  isSampleData?: boolean;
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
  isSampleData?: boolean;
  isVerified?: boolean;
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
