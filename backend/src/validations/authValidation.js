const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  // STRICT RULE: Registration can NEVER create admin
  role: z.enum(['investor', 'brand_owner', 'business_seller', 'event_organizer'], {
    errorMap: () => ({
      message: 'Role must be one of: investor, brand_owner, business_seller, event_organizer',
    }),
  }),
  phone: z.string().optional().default(''),
  city: z.string().optional().default('Mumbai'),
  company: z.string().optional().default(''),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const demoLoginSchema = z.object({
  role: z.enum(['investor', 'brand_owner', 'business_seller', 'event_organizer', 'admin'], {
    errorMap: () => ({ message: 'Valid demo role is required' }),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  demoLoginSchema,
};
