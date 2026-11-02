const { z } = require('zod');

const createEventSchema = z.object({
  title: z.string().min(3).max(150),
  type: z.enum(['exhibition', 'investor_summit', 'networking', 'webinar']),
  city: z.string().min(2),
  venue: z.string().min(2),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  capacity: z.number().int().min(1),
  ticketPrice: z.number().int().min(0).optional().default(0),
  description: z.string().min(10),
  agenda: z
    .array(
      z.object({
        time: z.string(),
        title: z.string(),
        description: z.string().optional().default(''),
      })
    )
    .optional()
    .default([]),
  speakers: z
    .array(
      z.object({
        name: z.string(),
        title: z.string(),
        org: z.string().optional().default(''),
        photoUrl: z.string().optional().default(''),
      })
    )
    .optional()
    .default([]),
  exhibitors: z
    .array(
      z.object({
        name: z.string(),
        boothNo: z.string().optional().default(''),
        industry: z.string().optional().default(''),
      })
    )
    .optional()
    .default([]),
  coverImageUrl: z.string().optional().default(''),
});

const updateEventSchema = createEventSchema.partial();

module.exports = {
  createEventSchema,
  updateEventSchema,
};
