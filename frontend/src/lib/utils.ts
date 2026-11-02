import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats integer INR Rupees using Indian numbering system
 * Example: 2500000 -> "₹25,00,000"
 */
export function formatINR(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Compact Indian currency formatting for high-impact cards
 * Example: 1800000 -> "₹18 Lakhs", 15000000 -> "₹1.50 Cr"
 */
export function formatCompactINR(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    const l = amount / 100000;
    return `₹${l % 1 === 0 ? l : l.toFixed(1)} Lakh`;
  }
  return formatINR(amount);
}

export const INDUSTRIES = [
  'Food & Beverage',
  'Retail',
  'Healthcare',
  'Education',
  'Technology',
  'Fitness & Wellness',
  'Logistics & Supply Chain',
  'Automotive & Mobility',
] as const;

export const TOP_CITIES = [
  'Mumbai',
  'Delhi NCR',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Kolkata',
  'Ahmedabad',
  'Chandigarh',
  'Jaipur',
] as const;
