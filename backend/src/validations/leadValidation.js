const { z } = require('zod');

const createLeadSchema = z.object({
  targetType: z.enum(['franchise', 'business']).optional().default('franchise'),
  targetId: z.string().optional(),
  brandId: z.string().optional(), // Legacy alias
  fullName: z.string().min(2, 'Full name is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  investmentBudget: z.number().int().min(10000, 'Investment budget must be at least ₹10,000'),
  targetCity: z.string().min(2, 'Target city is required'),
  timeline: z
    .enum(['Immediately (Within 30 days)', '1 - 3 Months', '3 - 6 Months', 'Exploring Options'])
    .optional()
    .default('1 - 3 Months'),
  hasCommercialSpace: z.boolean().optional().default(false),
  spaceAvailableSqFt: z.number().int().optional().default(0),
  message: z.string().min(5, 'Message must be at least 5 characters').max(1000),
});

const updateLeadStatusSchema = z.object({
  status: z.enum(['new', 'under_review', 'contacted', 'converted', 'rejected']).optional(),
  notes: z.string().max(1000).optional(),
  reason: z.string().max(500).optional(),
});

module.exports = {
  createLeadSchema,
  updateLeadStatusSchema,
};
