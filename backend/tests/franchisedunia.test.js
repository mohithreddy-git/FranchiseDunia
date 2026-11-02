const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const { connectDB, disconnectDB } = require('../src/config/db');
const seedDatabase = require('../src/utils/seedData');
const User = require('../src/models/User');
const Franchise = require('../src/models/Franchise');
const Event = require('../src/models/Event');
const BusinessForSale = require('../src/models/BusinessForSale');
const NdaAgreement = require('../src/models/NdaAgreement');
const EventRegistration = require('../src/models/EventRegistration');

jest.setTimeout(60000);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Login a user and return cookies array for chaining with .set('Cookie', cookies) */
const loginAs = async (email, password = 'Password123!') => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .set('Origin', 'http://localhost:3000')
    .send({ email, password });
  expect(res.statusCode).toBe(200);
  return res.headers['set-cookie'];
};

/** Extract a named cookie string from set-cookie header array */
const getCookie = (cookies, name) => cookies.find((c) => c.startsWith(`${name}=`));

/** Recursively check that a value contains none of the forbidden keys */
const assertNoProtectedKeys = (obj, keys, path = '') => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    expect(keys.map((k) => k.toLowerCase())).not.toContain(key.toLowerCase());
    assertNoProtectedKeys(obj[key], keys, fullPath);
  }
};

// ─── Shared state ─────────────────────────────────────────────────────────────
let seeded = null;

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.ENABLE_DEMO_MODE = 'true';
  await connectDB();
  seeded = await seedDatabase();
});

afterAll(async () => {
  await disconnectDB();
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. Database Connection & Environment Rules
// ═════════════════════════════════════════════════════════════════════════════
describe('1. Database Connection & Environment Rules', () => {
  it('should connect in dev/test using in-memory MongoDB fallback', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  it('should throw in production when MONGODB_URI is unset', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalUri = process.env.MONGODB_URI;
    process.env.NODE_ENV = 'production';
    delete process.env.MONGODB_URI;

    const { connectDB: testProdConnect } = require('../src/config/db');
    await expect(testProdConnect()).rejects.toThrow(/MONGODB_URI must be provided in production/);

    process.env.NODE_ENV = originalEnv;
    if (originalUri) process.env.MONGODB_URI = originalUri;
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. Authentication & Security
// ═════════════════════════════════════════════════════════════════════════════
describe('2. Authentication & Security (Cookie-Only, RBAC, CSRF, Reuse Detection)', () => {
  it('should register an investor and set httpOnly cookies', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Origin', 'http://localhost:3000')
      .send({
        name: 'Test Investor',
        email: `investor.reg.${Date.now()}@test.in`,
        password: 'Password123!',
        role: 'investor',
        phone: '+91 98989 89898',
        city: 'Mumbai',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('investor');

    // CARRY-OVER FIX 1: No tokens in JSON body
    expect(res.body.data.accessToken).toBeUndefined();
    expect(res.body.data.refreshToken).toBeUndefined();

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.includes('accessToken=') && c.includes('HttpOnly'))).toBe(true);
    expect(cookies.some((c) => c.includes('refreshToken=') && c.includes('HttpOnly'))).toBe(true);
  });

  it('CARRY-OVER FIX 1: Login must NOT include tokens in JSON response body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'http://localhost:3000')
      .send({ email: 'demo_investor@franchisedunia.in', password: 'Password123!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.accessToken).toBeUndefined();
    expect(res.body.data.refreshToken).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('CARRY-OVER FIX 1: /refresh must NOT return tokens in JSON response body', async () => {
    const loginCookies = await loginAs('demo_investor@franchisedunia.in');
    const refreshCookie = getCookie(loginCookies, 'refreshToken');

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', [refreshCookie]);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.accessToken).toBeUndefined();
    expect(res.body.data.refreshToken).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('CARRY-OVER FIX 2: Refresh token reuse detection — revokes session and returns 401', async () => {
    const loginCookies = await loginAs('demo_investor@franchisedunia.in');
    const originalRefreshCookie = getCookie(loginCookies, 'refreshToken');

    // Use the refresh token once — session rotates
    const firstRefresh = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', [originalRefreshCookie]);
    expect(firstRefresh.statusCode).toBe(200);

    // Now replay the ORIGINAL (already-rotated) refresh token — must be rejected
    const reuseAttempt = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', [originalRefreshCookie]);

    expect(reuseAttempt.statusCode).toBe(401);
    expect(reuseAttempt.body.success).toBe(false);
    expect(reuseAttempt.body.message).toMatch(/reuse detected/i);
  });

  it('CARRY-OVER FIX 3: CSRF — POST from untrusted origin must return 403', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'http://evil-site.com')
      .send({ email: 'demo_investor@franchisedunia.in', password: 'Password123!' });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/CSRF/i);
  });

  it('STRICT SECURITY: Registration must NEVER allow role: admin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Origin', 'http://localhost:3000')
      .send({
        name: 'Hacker Admin',
        email: `hacker.${Date.now()}@admin.in`,
        password: 'Password123!',
        role: 'admin',
        city: 'Delhi',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/validation failed/i);
  });

  it('should reject demo-login when ENABLE_DEMO_MODE=false', async () => {
    process.env.ENABLE_DEMO_MODE = 'false';
    const res = await request(app)
      .post('/api/v1/auth/demo-login')
      .set('Origin', 'http://localhost:3000')
      .send({ role: 'investor' });
    expect(res.statusCode).toBe(403);
    process.env.ENABLE_DEMO_MODE = 'true';
  });

  it('should authenticate demo user when ENABLE_DEMO_MODE=true', async () => {
    const res = await request(app)
      .post('/api/v1/auth/demo-login')
      .set('Origin', 'http://localhost:3000')
      .send({ role: 'brand_owner' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.role).toBe('brand_owner');
    expect(res.body.data.accessToken).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. Franchise Marketplace
// ═════════════════════════════════════════════════════════════════════════════
describe('3. Franchise Marketplace (Search, Filter, Detail, Pagination)', () => {
  it('GET /franchises should return paginated list', async () => {
    const res = await request(app).get('/api/v1/franchises?page=1&limit=6');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.franchises.length).toBe(6);
    expect(res.body.data.total).toBeGreaterThanOrEqual(20);
    expect(res.body.data.totalPages).toBeGreaterThanOrEqual(4);
  });

  it('GET /franchises should filter by industry + investment', async () => {
    const res = await request(app).get(
      '/api/v1/franchises?industry=food&minInvestment=500000'
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.data.franchises.length).toBeGreaterThan(0);
    for (const f of res.body.data.franchises) {
      expect(f.industry.toLowerCase()).toContain('food');
      expect(f.investmentMax).toBeGreaterThanOrEqual(500000);
    }
  });

  it('GET /franchises/:slug returns brand with fictional name (CARRY-OVER FIX 4)', async () => {
    const res = await request(app).get('/api/v1/franchises/brew-haven-tea-lounge');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.franchise.slug).toBe('brew-haven-tea-lounge');
    expect(res.body.data.franchise.unitEconomics.expectedNetProfitMargin).toBe(24);
    // Verify fictional brand (no real brand names)
    expect(res.body.data.franchise.name).toMatch(/Brew Haven/);
    expect(res.body.data.franchise.isSampleData).toBe(true);
  });

  it('Pending franchises must NOT appear in public GET /franchises', async () => {
    const res = await request(app).get('/api/v1/franchises?limit=100');
    expect(res.statusCode).toBe(200);
    const pendingItems = res.body.data.franchises.filter((f) => f.status === 'pending');
    expect(pendingItems.length).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. Leads & IDOR Protection
// ═════════════════════════════════════════════════════════════════════════════
describe('4. Leads, Inquiries & Strict IDOR Protection', () => {
  let investorCookies;
  let brandOwnerACookies;
  let brandOwnerBCookies;
  let createdLeadId;
  let franchiseOwnedByA;

  beforeAll(async () => {
    investorCookies = await loginAs('demo_investor@franchisedunia.in');
    brandOwnerACookies = await loginAs('demo_brand_owner@franchisedunia.in');
    brandOwnerBCookies = await loginAs('brand_partner@franchisedunia.in');
    franchiseOwnedByA = await Franchise.findOne({ slug: 'brew-haven-tea-lounge' });
  });

  it('Investor can submit a lead inquiry (cookie auth)', async () => {
    const res = await request(app)
      .post('/api/v1/leads')
      .set('Cookie', investorCookies)
      .set('Origin', 'http://localhost:3000')
      .send({
        brandId: franchiseOwnedByA._id.toString(),
        fullName: 'Aditya Investor',
        email: 'demo_investor@franchisedunia.in',
        phone: '+91 98201 12345',
        investmentBudget: 2500000,
        targetCity: 'Mumbai',
        timeline: '1 - 3 Months',
        hasCommercialSpace: true,
        spaceAvailableSqFt: 500,
        message: 'Interested in a Brew Haven outlet in Bandra West.',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.lead.brandOwner.toString()).toBe(
      franchiseOwnedByA.brandOwner.toString()
    );
    createdLeadId = res.body.data.lead._id;
  });

  it('Brand Owner A can read their own lead', async () => {
    const res = await request(app)
      .get(`/api/v1/leads/${createdLeadId}`)
      .set('Cookie', brandOwnerACookies);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.lead._id.toString()).toBe(createdLeadId.toString());
  });

  it('Brand Owner A can update their own lead status', async () => {
    const res = await request(app)
      .patch(`/api/v1/leads/${createdLeadId}/status`)
      .set('Cookie', brandOwnerACookies)
      .set('Origin', 'http://localhost:3000')
      .send({ status: 'under_review', notes: 'Reviewing application.' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.lead.status).toBe('under_review');
  });

  it("IDOR: Brand Owner B gets 403 reading Brand Owner A's lead", async () => {
    const res = await request(app)
      .get(`/api/v1/leads/${createdLeadId}`)
      .set('Cookie', brandOwnerBCookies);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });

  it("IDOR: Brand Owner B gets 403 updating Brand Owner A's lead status", async () => {
    const res = await request(app)
      .patch(`/api/v1/leads/${createdLeadId}/status`)
      .set('Cookie', brandOwnerBCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ status: 'rejected' });
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 5. Events Hub (Milestone 2)
// ═════════════════════════════════════════════════════════════════════════════
describe('5. Events Hub — Capacity, RSVP, .ics, IDOR, Approval', () => {
  let investorCookies;
  let organizerACookies;
  let organizerBCookies;
  let testEvent; // seeded approved event with capacity 5

  beforeAll(async () => {
    investorCookies = await loginAs('demo_investor@franchisedunia.in');
    organizerACookies = await loginAs('demo_event_organizer@franchisedunia.in');
    organizerBCookies = await loginAs('organizer_b@franchisedunia.in');

    // Create a small-capacity event (5) for race condition testing
    const organizerA = await User.findOne({ email: 'demo_event_organizer@franchisedunia.in' });
    testEvent = new Event({
      title: 'Capacity Race Test Event',
      slug: `capacity-race-test-${Date.now()}`,
      type: 'investor_summit',
      city: 'Mumbai',
      venue: 'Test Venue',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      capacity: 5,
      registeredCount: 0,
      ticketPrice: 0,
      organizer: organizerA._id,
      status: 'approved',
      description: 'Race condition capacity test event',
      isSampleData: true,
    });
    await testEvent.save();
  });

  it('GET /events returns only approved events publicly', async () => {
    const res = await request(app).get('/api/v1/events');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.events.length).toBeGreaterThan(0);
    const pendingEvents = res.body.data.events.filter((e) => e.status === 'pending');
    expect(pendingEvents.length).toBe(0);
  });

  it('GET /events?city=Mumbai&type=exhibition filters correctly', async () => {
    const res = await request(app).get('/api/v1/events?city=Mumbai&type=exhibition');
    expect(res.statusCode).toBe(200);
    for (const e of res.body.data.events) {
      expect(e.city.toLowerCase()).toBe('mumbai');
      expect(e.type).toBe('exhibition');
    }
  });

  it('GET /events/:slug returns event detail', async () => {
    const anEvent = await Event.findOne({ status: 'approved' });
    const res = await request(app).get(`/api/v1/events/${anEvent.slug}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.event.slug).toBe(anEvent.slug);
    expect(res.body.data.googleCalendarUrl).toContain('calendar.google.com');
  });

  it('RSVP: Investor can register for an event (201)', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${testEvent._id}/register`)
      .set('Cookie', investorCookies)
      .set('Origin', 'http://localhost:3000');

    expect(res.statusCode).toBe(201);
    expect(res.body.data.registration.ticketCode).toMatch(/^FD-[A-F0-9]{8}$/);
    expect(res.body.data.registration.status).toBe('confirmed');
  });

  it('RSVP: Duplicate registration returns 409', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${testEvent._id}/register`)
      .set('Cookie', investorCookies)
      .set('Origin', 'http://localhost:3000');

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it('Cancel RSVP: frees seat atomically', async () => {
    const before = await Event.findById(testEvent._id);

    const res = await request(app)
      .delete(`/api/v1/events/${testEvent._id}/register`)
      .set('Cookie', investorCookies)
      .set('Origin', 'http://localhost:3000');

    expect(res.statusCode).toBe(200);

    const after = await Event.findById(testEvent._id);
    expect(after.registeredCount).toBe(before.registeredCount - 1);
  });

  it('CAPACITY RACE: exactly capacity=5 registrations succeed under concurrency', async () => {
    // Reset the count to 0
    await Event.findByIdAndUpdate(testEvent._id, { registeredCount: 0 });
    await EventRegistration.deleteMany({ event: testEvent._id });

    // Create 10 fresh investor users to simulate concurrent unique users
    const userPromises = Array.from({ length: 10 }, (_, i) =>
      (async () => {
        const u = new User({
          name: `RaceUser ${i}`,
          email: `race.user.${Date.now()}.${i}@test.in`,
          password: 'Password123!',
          role: 'investor',
          city: 'Mumbai',
        });
        await u.save();
        return loginAs(u.email);
      })()
    );
    const cookieSets = await Promise.all(userPromises);

    // Fire all 10 concurrent registrations
    const results = await Promise.all(
      cookieSets.map((cookies) =>
        request(app)
          .post(`/api/v1/events/${testEvent._id}/register`)
          .set('Cookie', cookies)
          .set('Origin', 'http://localhost:3000')
      )
    );

    const successes = results.filter((r) => r.statusCode === 201);
    const failures = results.filter((r) => r.statusCode === 400);

    expect(successes.length).toBe(5);
    expect(failures.length).toBe(5);

    const finalEvent = await Event.findById(testEvent._id);
    expect(finalEvent.registeredCount).toBe(5);
  });

  it('.ics download has CRLF line endings and required RFC 5545 fields', async () => {
    const anEvent = await Event.findOne({ status: 'approved' });
    const res = await request(app).get(`/api/v1/events/${anEvent.slug}/calendar.ics`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');

    const icsText = res.text;
    expect(icsText).toContain('BEGIN:VCALENDAR');
    expect(icsText).toContain('END:VCALENDAR');
    expect(icsText).toContain('BEGIN:VEVENT');
    expect(icsText).toContain('END:VEVENT');
    expect(icsText).toContain('UID:');
    expect(icsText).toMatch(/DTSTART:\d{8}T\d{6}Z/);

    // Verify CRLF line endings (RFC 5545 §3.1)
    expect(icsText).toContain('\r\n');
    // All line breaks must be CRLF — no bare LF
    const linesWithBareLf = icsText.split('\r\n').some((line) => line.includes('\n'));
    expect(linesWithBareLf).toBe(false);
  });

  it("IDOR: Organizer B gets 403 editing Organizer A's event", async () => {
    const orgAEvent = await Event.findOne({
      organizer: (await User.findOne({ email: 'demo_event_organizer@franchisedunia.in' }))._id,
    });

    const res = await request(app)
      .put(`/api/v1/events/${orgAEvent._id}`)
      .set('Cookie', organizerBCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ description: 'Hijacked description' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 6. Business-for-Sale & NDA Gate (Milestone 3)
// ═════════════════════════════════════════════════════════════════════════════
describe('6. Business-for-Sale — Protected Financials & Server-Side NDA Gate', () => {
  const PROTECTED_FIELD_NAMES = [
    'exactRevenue',
    'exactNetProfit',
    'balanceSheetSummary',
    'exactAddress',
    'customerConcentration',
    'reasonForSale',
    'sellerContact',
  ];

  let investorCookies;
  let sellerACookies;
  let sellerBCookies;
  let testBusiness; // seeded business owned by sellerA

  beforeAll(async () => {
    investorCookies = await loginAs('demo_investor@franchisedunia.in');
    sellerACookies = await loginAs('demo_business_seller@franchisedunia.in');
    sellerBCookies = await loginAs('seller_b@franchisedunia.in');

    testBusiness = await BusinessForSale.findOne({ status: 'approved' });
  });

  it('GET /business-for-sale returns paginated list', async () => {
    const res = await request(app).get('/api/v1/business-for-sale?page=1&limit=6');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.businesses.length).toBeGreaterThan(0);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /business-for-sale LIST: NEVER contains protected keys for ANY user (including admin)', async () => {
    const adminCookies = await loginAs('admin@franchisedunia.in', 'AdminSecure2025!');
    const res = await request(app)
      .get('/api/v1/business-for-sale?limit=100')
      .set('Cookie', adminCookies);
    expect(res.statusCode).toBe(200);

    for (const biz of res.body.data.businesses) {
      assertNoProtectedKeys(biz, PROTECTED_FIELD_NAMES);
    }
  });

  it('GET /business-for-sale/:id — unauthenticated: NO protected keys in response', async () => {
    const res = await request(app).get(`/api/v1/business-for-sale/${testBusiness._id}`);
    expect(res.statusCode).toBe(200);
    assertNoProtectedKeys(res.body.data.business, PROTECTED_FIELD_NAMES);
    expect(res.body.data.ndaSigned).toBe(false);
  });

  it('GET /business-for-sale/:id — authenticated but unsigned: NO protected keys', async () => {
    const res = await request(app)
      .get(`/api/v1/business-for-sale/${testBusiness._id}`)
      .set('Cookie', investorCookies);
    expect(res.statusCode).toBe(200);
    assertNoProtectedKeys(res.body.data.business, PROTECTED_FIELD_NAMES);
    expect(res.body.data.ndaSigned).toBe(false);
  });

  it('GET /business-for-sale: forbidden filter param ?minRevenue returns 400', async () => {
    const res = await request(app).get('/api/v1/business-for-sale?minRevenue=1000000');
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/prohibited/i);
  });

  it('POST /business-for-sale/:id/nda — investor signs NDA successfully', async () => {
    const res = await request(app)
      .post(`/api/v1/business-for-sale/${testBusiness._id}/nda`)
      .set('Cookie', investorCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ signedName: 'Aditya Birla', accepted: true });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.data.ndaAgreement).toBeDefined();
  });

  it('POST /business-for-sale/:id/nda — idempotent: second call returns 200 alreadySigned:true', async () => {
    const res = await request(app)
      .post(`/api/v1/business-for-sale/${testBusiness._id}/nda`)
      .set('Cookie', investorCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ signedName: 'Aditya Birla', accepted: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.alreadySigned).toBe(true);
  });

  it('GET /business-for-sale/:id — after NDA signed: protectedFinancials ARE present', async () => {
    const res = await request(app)
      .get(`/api/v1/business-for-sale/${testBusiness._id}`)
      .set('Cookie', investorCookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.ndaSigned).toBe(true);
    expect(res.body.data.business.protectedFinancials).toBeDefined();
    expect(res.body.data.business.protectedFinancials.exactRevenue).toBeDefined();
    expect(res.body.data.business.protectedFinancials.exactAddress).toBeDefined();
  });

  it('IDOR: Seller B cannot access protected data when Investor signed NDA', async () => {
    // sellerB is a different seller and has not signed NDA — should not see protected fields
    const res = await request(app)
      .get(`/api/v1/business-for-sale/${testBusiness._id}`)
      .set('Cookie', sellerBCookies);

    expect(res.statusCode).toBe(200);
    // sellerB has NOT signed NDA for this listing
    assertNoProtectedKeys(res.body.data.business, PROTECTED_FIELD_NAMES);
  });

  it('Seller CANNOT sign NDA on their own listing', async () => {
    // Find a business owned by sellerA
    const sellerA = await User.findOne({ email: 'demo_business_seller@franchisedunia.in' });
    const ownListing = await BusinessForSale.findOne({ seller: sellerA._id, status: 'approved' });
    if (!ownListing) return; // guard: skip if seed didn't create one for sellerA

    const res = await request(app)
      .post(`/api/v1/business-for-sale/${ownListing._id}/nda`)
      .set('Cookie', sellerACookies)
      .set('Origin', 'http://localhost:3000')
      .send({ signedName: 'Pooja Singhania', accepted: true });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/owner privileges|seller of this listing/i);
  });

  it("IDOR: Seller B gets 403 editing Seller A's business listing", async () => {
    const sellerA = await User.findOne({ email: 'demo_business_seller@franchisedunia.in' });
    const listingA = await BusinessForSale.findOne({ seller: sellerA._id });

    if (!listingA) return; // guard

    const res = await request(app)
      .put(`/api/v1/business-for-sale/${listingA._id}`)
      .set('Cookie', sellerBCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ summary: 'Hijacked description that is longer than fifteen characters.' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 7. Admin Moderation Endpoints
// ═════════════════════════════════════════════════════════════════════════════
describe('7. Admin Moderation — Pending Queue & Status Approval', () => {
  let adminCookies;

  beforeAll(async () => {
    adminCookies = await loginAs('admin@franchisedunia.in', 'AdminSecure2025!');
  });

  it('GET /admin/pending returns pending franchises, events, and businesses', async () => {
    const res = await request(app)
      .get('/api/v1/admin/pending')
      .set('Cookie', adminCookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.franchises).toBeDefined();
    expect(res.body.data.events).toBeDefined();
    expect(res.body.data.businesses).toBeDefined();

    // Seeded 2 pending franchises + 2 pending events + 2 pending businesses
    expect(res.body.data.franchises.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.events.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.businesses.length).toBeGreaterThanOrEqual(2);
  });

  it('Non-admin gets 403 on GET /admin/pending', async () => {
    const investorCookies = await loginAs('demo_investor@franchisedunia.in');
    const res = await request(app)
      .get('/api/v1/admin/pending')
      .set('Cookie', investorCookies);
    expect(res.statusCode).toBe(403);
  });

  it('PATCH /admin/franchise/:id/status approves pending franchise and makes it publicly visible', async () => {
    const pendingFranchise = await Franchise.findOne({ status: 'pending' });
    expect(pendingFranchise).not.toBeNull();

    const approveRes = await request(app)
      .patch(`/api/v1/admin/franchise/${pendingFranchise._id}/status`)
      .set('Cookie', adminCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ status: 'approved' });

    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.body.data.status).toBe('approved');

    // Now verify it appears in the public listing
    const publicRes = await request(app).get(`/api/v1/franchises/${pendingFranchise.slug}`);
    expect(publicRes.statusCode).toBe(200);
  });

  it('PATCH /admin/event/:id/status approves a pending event', async () => {
    const pendingEvent = await Event.findOne({ status: 'pending' });
    if (!pendingEvent) return;

    const res = await request(app)
      .patch(`/api/v1/admin/event/${pendingEvent._id}/status`)
      .set('Cookie', adminCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ status: 'approved' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('approved');
  });

  it('PATCH /admin/business/:id/status approves a pending business listing', async () => {
    const pendingBiz = await BusinessForSale.findOne({ status: 'pending' });
    if (!pendingBiz) return;

    const res = await request(app)
      .patch(`/api/v1/admin/business/${pendingBiz._id}/status`)
      .set('Cookie', adminCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ status: 'approved' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('approved');
  });
});
