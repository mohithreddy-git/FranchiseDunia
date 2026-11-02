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
