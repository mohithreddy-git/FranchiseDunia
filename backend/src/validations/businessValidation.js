const { z } = require('zod');

const createBusinessSchema = z.object({
  title: z.string().min(3).max(120),
  listingType: z.enum(['sale', 'joint_venture', 'equity_stake', 'partnership']),
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
  region: z.string().min(2),
  establishedYear: z.number().int().min(1950),
  employeeCountBand: z.string().default('5-15'),
  revenueBand: z.string(),
  profitBand: z.string(),
  askingPriceBand: z.string(),
  summary: z.string().min(15),
  protectedFinancials: z
    .object({
      exactRevenue: z.number().int().min(0).default(0),
      exactNetProfit: z.number().int().min(0).default(0),
      balanceSheetSummary: z.string().optional().default(''),
      exactAddress: z.string().optional().default(''),
      customerConcentration: z.string().optional().default(''),
      reasonForSale: z.string().optional().default(''),
      sellerContact: z.string().optional().default(''),
    })
    .optional(),
});

const updateBusinessSchema = createBusinessSchema.partial();

const signNdaSchema = z.object({
  signedName: z.string().min(2, 'Full legal name is required to sign agreement'),
  accepted: z.literal(true, {
    errorMap: () => ({ message: 'You must explicitly accept the terms of confidentiality' }),
  }),
  agreementVersion: z.string().optional().default('v1.0'),
});

module.exports = {
  createBusinessSchema,
  updateBusinessSchema,
  signNdaSchema,
};
