const { z } = require('zod');

const createFranchiseSchema = z.object({
  name: z.string().min(2).max(100),
  tagline: z.string().max(200).optional().default(''),
  industry: z.enum([
    'Food & Beverage',
    'Retail',
    'Healthcare',
    'Education',
    'Technology',
    'Fitness & Wellness',
    'Logistics & Supply Chain',
    'Automotive & Mobility',
  ]),
  investmentMin: z.number().int().min(0, 'Minimum investment must be >= 0'),
  investmentMax: z.number().int().min(0, 'Maximum investment must be >= 0'),
  franchiseFee: z.number().int().min(0).optional().default(0),
  royaltyPercent: z.number().min(0).max(100).optional().default(0),
  spaceMinSqFt: z.number().int().min(0),
  spaceMaxSqFt: z.number().int().optional().default(0),
  roiPeriodMonths: z.number().int().min(1),
  unitsOperational: z.number().int().min(1).optional().default(1),
  headquarters: z.string().optional().default('Mumbai, India'),
  availableLocations: z.array(z.string()).optional().default(['Pan-India']),
  establishedYear: z.number().int().optional().default(2020),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  supportProvided: z.array(z.string()).optional().default([]),
  unitEconomics: z
    .object({
      expectedMonthlyRevenue: z.number().int().default(0),
      expectedNetProfitMargin: z.number().default(20),
      paybackPeriodMonths: z.number().default(18),
      breakEvenPeriodMonths: z.number().default(6),
    })
    .optional(),
  logoUrl: z.string().optional().default(''),
  coverImageUrl: z.string().optional().default(''),
  gallery: z.array(z.string()).optional().default([]),
  brochureUrl: z.string().optional().default('/docs/brochure-sample.pdf'),
  isFeatured: z.boolean().optional().default(false),
});

const updateFranchiseSchema = createFranchiseSchema.partial();

module.exports = {
  createFranchiseSchema,
  updateFranchiseSchema,
};
