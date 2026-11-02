const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const { connectDB, disconnectDB } = require('../src/config/db');
const seedDatabase = require('../src/utils/seedData');
const User = require('../src/models/User');
const Franchise = require('../src/models/Franchise');
const Lead = require('../src/models/Lead');

jest.setTimeout(30000);

let testUsers = null;
let testFranchises = null;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_DEMO_MODE = 'true';
  await connectDB();
  const seeded = await seedDatabase();
  testUsers = seeded.users;
  testFranchises = seeded.franchises;
});

afterAll(async () => {
  await disconnectDB();
});

describe('1. Database Connection & Environment Rules', () => {
  it('should successfully connect in dev/test using in-memory MongoDB fallback', () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  it('should crash/throw in production when MONGODB_URI is unset', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalUri = process.env.MONGODB_URI;

    process.env.NODE_ENV = 'production';
    delete process.env.MONGODB_URI;

    // Direct check of db.js logic
    const { connectDB: testProdConnect } = require('../src/config/db');
    await expect(testProdConnect()).rejects.toThrow(/MONGODB_URI must be provided in production/);

    process.env.NODE_ENV = originalEnv;
    if (originalUri) process.env.MONGODB_URI = originalUri;
  });
});

describe('2. Authentication & Security (Cookies, RBAC, Admin Protection)', () => {
  it('should successfully register an investor and set httpOnly cookies', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Rahul Sharma',
        email: 'rahul.test@investor.in',
        password: 'Password123!',
        role: 'investor',
        phone: '+91 98989 89898',
        city: 'Mumbai',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('investor');

    // Check Set-Cookie headers
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const hasAccessTokenCookie = cookies.some((c) => c.includes('accessToken=') && c.includes('HttpOnly'));
    const hasRefreshTokenCookie = cookies.some((c) => c.includes('refreshToken=') && c.includes('HttpOnly'));
    expect(hasAccessTokenCookie).toBe(true);
    expect(hasRefreshTokenCookie).toBe(true);
  });

  it('STRICT SECURITY RULE: Registration must NEVER allow role: admin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Hacker Admin',
        email: 'hacker@admin.in',
        password: 'Password123!',
        role: 'admin', // Not allowed by Zod schema
        city: 'Delhi',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/validation failed/i);
  });

  it('should login an existing demo user, issue cookies and return user payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'demo_investor@franchisedunia.in',
        password: 'Password123!',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('demo_investor@franchisedunia.in');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should support token refresh with rotation', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'demo_investor@franchisedunia.in',
        password: 'Password123!',
      });

    const cookies = loginRes.headers['set-cookie'];
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [refreshCookie]);

    expect(refreshRes.statusCode).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.headers['set-cookie']).toBeDefined();
  });

  it('should reject demo login when ENABLE_DEMO_MODE is false', async () => {
    process.env.ENABLE_DEMO_MODE = 'false';

    const res = await request(app)
      .post('/api/v1/auth/demo-login')
      .send({ role: 'investor' });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);

    process.env.ENABLE_DEMO_MODE = 'true';
  });

  it('should authenticate demo user when ENABLE_DEMO_MODE is true', async () => {
    const res = await request(app)
      .post('/api/v1/auth/demo-login')
      .send({ role: 'brand_owner' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('brand_owner');
  });
});

describe('3. Franchise Marketplace (Search, Filter, Detail, Pagination)', () => {
  it('GET /api/v1/franchises should return list with pagination metadata', async () => {
    const res = await request(app).get('/api/v1/franchises?page=1&limit=6');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.franchises.length).toBe(6);
    expect(res.body.data.total).toBeGreaterThanOrEqual(25);
    expect(res.body.data.totalPages).toBeGreaterThanOrEqual(4);
    expect(res.body.data.page).toBe(1);
  });

  it('GET /api/v1/franchises?industry=food&minInvestment=500000&city=Mumbai should filter accurately', async () => {
    const res = await request(app).get(
      '/api/v1/franchises?industry=food&minInvestment=500000&city=Mumbai'
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.franchises.length).toBeGreaterThan(0);

    for (const f of res.body.data.franchises) {
      expect(f.industry.toLowerCase()).toContain('food');
      expect(f.investmentMax).toBeGreaterThanOrEqual(500000);
      const matchesCity =
        f.availableLocations.includes('Mumbai') ||
        f.availableLocations.some((loc) => loc.toLowerCase().includes('pan-india'));
      expect(matchesCity).toBe(true);
    }
  });

  it('GET /api/v1/franchises/:slug should return single brand detailed unit economics', async () => {
    const res = await request(app).get('/api/v1/franchises/chai-point');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.franchise.slug).toBe('chai-point');
    expect(res.body.data.franchise.unitEconomics).toBeDefined();
    expect(res.body.data.franchise.unitEconomics.expectedNetProfitMargin).toBe(24);
  });
});

describe('4. Leads, Inquiries & Strict IDOR Protection', () => {
  let investorToken = null;
  let brandOwnerAToken = null;
  let brandOwnerBToken = null;
  let createdLeadId = null;
  let franchiseOwnedByA = null;

  beforeAll(async () => {
    // Login Investor
    const invRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo_investor@franchisedunia.in', password: 'Password123!' });
    investorToken = invRes.body.data.accessToken;

    // Login Brand Owner A
    const boaRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'demo_brand_owner@franchisedunia.in', password: 'Password123!' });
    brandOwnerAToken = boaRes.body.data.accessToken;

    // Login Brand Owner B (unrelated owner)
    const bobRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'brand_partner@franchisedunia.in', password: 'Password123!' });
    brandOwnerBToken = bobRes.body.data.accessToken;

    franchiseOwnedByA = await Franchise.findOne({ slug: 'chai-point' });
  });

  it('Investor can submit an inquiry (Lead) for a franchise', async () => {
    const res = await request(app)
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${investorToken}`)
      .send({
        brandId: franchiseOwnedByA._id.toString(),
        fullName: 'Aditya Birla',
        email: 'demo_investor@franchisedunia.in',
        phone: '+91 98201 12345',
        investmentBudget: 2500000,
        targetCity: 'Mumbai',
        timeline: '1 - 3 Months',
        hasCommercialSpace: true,
        spaceAvailableSqFt: 500,
        message: 'Interested in opening a Chai Point outlet in Bandra West commercial arcade.',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lead.brandOwner.toString()).toBe(franchiseOwnedByA.brandOwner.toString());
    createdLeadId = res.body.data.lead._id;
  });

  it('Brand Owner A can read the lead that belongs to their brand', async () => {
    const res = await request(app)
      .get(`/api/v1/leads/${createdLeadId}`)
      .set('Authorization', `Bearer ${brandOwnerAToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lead._id.toString()).toBe(createdLeadId.toString());
  });

  it('Brand Owner A can update status of their own lead', async () => {
    const res = await request(app)
      .patch(`/api/v1/leads/${createdLeadId}/status`)
      .set('Authorization', `Bearer ${brandOwnerAToken}`)
      .send({
        status: 'under_review',
        notes: 'Requested store layout floor plan from investor.',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.lead.status).toBe('under_review');
  });

  it('IDOR TEST: Unrelated Brand Owner B must receive 403 Forbidden when trying to view Brand Owner A’s lead', async () => {
    const res = await request(app)
      .get(`/api/v1/leads/${createdLeadId}`)
      .set('Authorization', `Bearer ${brandOwnerBToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/forbidden/i);
  });

  it('IDOR TEST: Unrelated Brand Owner B must receive 403 Forbidden when trying to update Brand Owner A’s lead status', async () => {
    const res = await request(app)
      .patch(`/api/v1/leads/${createdLeadId}/status`)
      .set('Authorization', `Bearer ${brandOwnerBToken}`)
      .send({
        status: 'rejected',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/forbidden/i);
  });
});
