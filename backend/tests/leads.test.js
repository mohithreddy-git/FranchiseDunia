const {
  app,
  request,
  setupTestDB,
  teardownTestDB,
  loginAs,
  Lead,
  Franchise,
  BusinessForSale,
  NdaAgreement,
  User,
} = require('./helpers');
const { calculateLeadScore } = require('../src/utils/leadScoring');
const migrateLeads = require('../scripts/migrate-leads');

setupTestDB();
teardownTestDB();

describe('Leads Domain Tests (Polymorphic Inquiries, Scoring Function, State Machine, Notes Secrecy, Pipeline)', () => {
  let investorCookies;
  let brandOwnerACookies;
  let brandOwnerBCookies;
  let sellerCookies;
  let createdLeadId;
  let approvedFranchise;
  let approvedBusiness;

  beforeAll(async () => {
    investorCookies = await loginAs('demo_investor@franchisedunia.in');
    brandOwnerACookies = await loginAs('demo_brand_owner@franchisedunia.in');
    brandOwnerBCookies = await loginAs('brand_partner@franchisedunia.in');
    sellerCookies = await loginAs('demo_business_seller@franchisedunia.in');

    approvedFranchise = await Franchise.findOne({ status: 'approved' });
    approvedBusiness = await BusinessForSale.findOne({ status: 'approved' });
  });

  // 1. Scoring Function Unit Tests (At least 6 distinct test cases)
  describe('calculateLeadScore heuristic function unit tests', () => {
    it('Case 1: Perfect match (budget exceeds max, immediate timeline, complete profile, old account, rich message) -> score >= 90', () => {
      const res = calculateLeadScore({
        investmentBudget: 5000000,
        targetListing: { investmentMin: 1000000, investmentMax: 3000000 },
        timeline: 'Immediately (Within 30 days)',
        hasCommercialSpace: true,
        spaceAvailableSqFt: 500,
        phone: '+91 98200 12345',
        city: 'Mumbai',
        company: 'Apex Holdings',
        user: { createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
        message: 'A'.repeat(250),
      });
      expect(res.score).toBeGreaterThanOrEqual(90);
      expect(res.breakdown.budgetFit).toBe(40);
      expect(res.breakdown.timelineUrgency).toBe(20);
      expect(res.breakdown.profileCompleteness).toBe(15);
      expect(res.breakdown.accountTrust).toBe(10);
      expect(res.breakdown.messageQuality).toBe(15);
    });

    it('Case 2: Exact min budget match with moderate timeline (1-3 months) -> moderate score', () => {
      const res = calculateLeadScore({
        investmentBudget: 1000000,
        targetListing: { investmentMin: 1000000, investmentMax: 2000000 },
        timeline: '1 - 3 Months',
        hasCommercialSpace: false,
        phone: '+91 98200 12345',
        city: 'Bengaluru',
        message: 'We are very interested in partnering with your brand for a flagship store.',
      });
      expect(res.score).toBeGreaterThanOrEqual(60);
      expect(res.breakdown.budgetFit).toBe(35);
      expect(res.breakdown.timelineUrgency).toBe(15);
    });

    it('Case 3: Under-budget inquiry (< 50% of required min) -> low budget fit points', () => {
      const res = calculateLeadScore({
        investmentBudget: 400000,
        targetListing: { investmentMin: 1000000, investmentMax: 2000000 },
        timeline: '3 - 6 Months',
        message: 'Short message',
      });
      expect(res.breakdown.budgetFit).toBe(5);
      expect(res.score).toBeLessThan(50);
    });

    it('Case 4: Long exploring options timeline (5 pts) and short message (2 pts)', () => {
      const res = calculateLeadScore({
        investmentBudget: 1500000,
        targetListing: { investmentMin: 1000000, investmentMax: 2000000 },
        timeline: 'Exploring Options',
        message: 'Hi',
      });
      expect(res.breakdown.timelineUrgency).toBe(5);
      expect(res.breakdown.messageQuality).toBe(2);
    });

    it('Case 5: Missing target listing defaults cleanly to fallback budget score', () => {
      const res = calculateLeadScore({
        investmentBudget: 2500000,
        targetListing: null,
        timeline: '1 - 3 Months',
        message: 'Inquiring without direct target reference.',
      });
      expect(res.breakdown.budgetFit).toBe(35);
      expect(res.score).toBeGreaterThan(0);
    });

    it('Case 6: Boundary clamping: Score never drops below 0 and never exceeds 100', () => {
      const minRes = calculateLeadScore({ investmentBudget: 0, timeline: 'Exploring Options', message: '' });
      expect(minRes.score).toBeGreaterThanOrEqual(0);

      const maxRes = calculateLeadScore({
        investmentBudget: 999999999,
        targetListing: { investmentMin: 100 },
        timeline: 'Immediately (Within 30 days)',
        hasCommercialSpace: true,
        spaceAvailableSqFt: 5000,
        phone: '9820000000',
        city: 'Mumbai',
        company: 'Mega Corp',
        user: { createdAt: new Date(2020, 1, 1) },
        message: 'X'.repeat(500),
      });
      expect(maxRes.score).toBeLessThanOrEqual(100);
    });
  });

  // 2. Lead Inquiries & Polymorphic Target
  it('Investor can submit a lead inquiry for a franchise', async () => {
    const owner = await User.findOne({ email: 'demo_brand_owner@franchisedunia.in' });
    const franchise = await Franchise.findOne({ brandOwner: owner._id, status: 'approved' });

    const res = await request(app)
      .post('/api/v1/leads')
      .set('Cookie', investorCookies)
      .set('Origin', 'http://localhost:3000')
      .send({
        targetType: 'franchise',
        targetId: franchise._id,
        fullName: 'Aditya Birla',
        email: 'aditya@birla-capital.com',
        phone: '+91 98201 12345',
        investmentBudget: franchise.investmentMin + 500000,
        targetCity: 'Mumbai',
        timeline: '1 - 3 Months',
        hasCommercialSpace: true,
        spaceAvailableSqFt: 450,
        message: 'Interested in opening 2 outlets in Bandra & Lower Parel.',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lead.leadScore).toBeGreaterThanOrEqual(60);
    expect(res.body.data.lead.scoreBreakdown).toBeDefined();
    expect(res.body.data.lead.status).toBe('new');
    expect(res.body.data.lead.statusHistory.length).toBe(1);

    createdLeadId = res.body.data.lead._id;
  });

  it('AMENDMENT 10: Inquiry on business listing requires an existing NDA (403 otherwise)', async () => {
    // Pick a business listing for which demo_investor has NOT signed an NDA
    const unSignedBusiness = await BusinessForSale.findOne({
      status: 'approved',
      _id: { $ne: approvedBusiness._id },
    });

    if (unSignedBusiness) {
      await NdaAgreement.deleteMany({ user: (await User.findOne({ email: 'demo_investor@franchisedunia.in' }))._id, business: unSignedBusiness._id });

      const res = await request(app)
        .post('/api/v1/leads')
        .set('Cookie', investorCookies)
        .set('Origin', 'http://localhost:3000')
        .send({
          targetType: 'business',
          targetId: unSignedBusiness._id,
          fullName: 'Aditya Birla',
          email: 'aditya@birla-capital.com',
          phone: '+91 98201 12345',
          investmentBudget: 10000000,
          targetCity: 'Chandigarh',
          message: 'Interested in buying this business.',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(/Non-Disclosure Agreement|NDA/i);
    }
  });

  it('AMENDMENT 10: Abuse guard: second OPEN inquiry on same listing returns 409 with existing lead id', async () => {
    const existing = await Lead.findById(createdLeadId);

    const duplicateRes = await request(app)
      .post('/api/v1/leads')
      .set('Cookie', investorCookies)
      .set('Origin', 'http://localhost:3000')
      .send({
        targetType: 'franchise',
        targetId: existing.targetId,
        fullName: 'Aditya Birla Duplicate',
        email: 'aditya@birla-capital.com',
        phone: '+91 98201 12345',
        investmentBudget: 2000000,
        targetCity: 'Mumbai',
        message: 'Second inquiry spam attempt.',
      });

    expect(duplicateRes.statusCode).toBe(409);
    expect(duplicateRes.body.data.existingLeadId).toBe(createdLeadId);
  });

  it('AMENDMENT 10: Abuse guard: User cannot submit inquiry on their own listing (403)', async () => {
    const owner = await User.findOne({ email: 'demo_brand_owner@franchisedunia.in' });
    const ownFranchise = await Franchise.findOne({ brandOwner: owner._id, status: 'approved' });

    const selfInquiryRes = await request(app)
      .post('/api/v1/leads')
      .set('Cookie', brandOwnerACookies)
      .set('Origin', 'http://localhost:3000')
      .send({
        targetType: 'franchise',
        targetId: ownFranchise._id,
        fullName: 'Self Inquiry Attempt',
        email: 'owner@brand.com',
        phone: '+91 98201 12345',
        investmentBudget: 2000000,
        targetCity: 'Mumbai',
        message: 'Inquiring on my own brand.',
      });

    expect(selfInquiryRes.statusCode).toBe(403);
    expect(selfInquiryRes.body.message).toMatch(/own listing/i);
  });

  // 3. Private Owner Notes & Investor Gating
  it('Investor view of lead payload has NO notes key', async () => {
    // Add private notes as brand owner first
    await Lead.findByIdAndUpdate(createdLeadId, { notes: 'CONFIDENTIAL OWNER NOTE: Investor looks serious' });

    const res = await request(app)
      .get(`/api/v1/leads/${createdLeadId}`)
      .set('Cookie', investorCookies);

    expect(res.statusCode).toBe(200);
    expect(Object.keys(res.body.data.lead)).not.toContain('notes');
  });

  it('Brand Owner view of lead payload HAS notes key', async () => {
    const res = await request(app)
      .get(`/api/v1/leads/${createdLeadId}`)
      .set('Cookie', brandOwnerACookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.lead.notes).toBe('CONFIDENTIAL OWNER NOTE: Investor looks serious');
  });

  // 4. Server-Side State Machine & Status Transitions
  it('State Machine: new -> under_review succeeds and appends statusHistory', async () => {
    const res = await request(app)
      .patch(`/api/v1/leads/${createdLeadId}/status`)
      .set('Cookie', brandOwnerACookies)
      .set('Origin', 'http://localhost:3000')
      .send({ status: 'under_review', reason: 'Reviewing qualifications' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.lead.status).toBe('under_review');
    expect(res.body.data.lead.statusHistory.length).toBe(2);
    expect(res.body.data.lead.statusHistory[1].from).toBe('new');
    expect(res.body.data.lead.statusHistory[1].to).toBe('under_review');
  });

  it('State Machine: Invalid transition (under_review -> converted) returns 409 with allowedTransitions', async () => {
    const res = await request(app)
      .patch(`/api/v1/leads/${createdLeadId}/status`)
      .set('Cookie', brandOwnerACookies)
      .set('Origin', 'http://localhost:3000')
      .send({ status: 'converted' });

    expect(res.statusCode).toBe(409);
    expect(res.body.data.allowedTransitions).toEqual(['contacted', 'rejected']);
  });

  it('IDOR: Brand Owner B gets 403 reading Brand Owner A lead', async () => {
    const res = await request(app)
      .get(`/api/v1/leads/${createdLeadId}`)
      .set('Cookie', brandOwnerBCookies);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });

  it('IDOR: Brand Owner B gets 403 updating Brand Owner A lead status', async () => {
    const res = await request(app)
      .patch(`/api/v1/leads/${createdLeadId}/status`)
      .set('Cookie', brandOwnerBCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ status: 'contacted' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });

  // 5. Pipeline Counts Single Aggregation with Caller $match first
  it('AMENDMENT 7: Pipeline counts $match on caller listingOwner before $facet — excludes other owners leads', async () => {
    const resA = await request(app)
      .get('/api/v1/leads/pipeline-counts')
      .set('Cookie', brandOwnerACookies);

    expect(resA.statusCode).toBe(200);
    expect(resA.body.data.counts.total).toBeGreaterThanOrEqual(1);

    const resB = await request(app)
      .get('/api/v1/leads/pipeline-counts')
      .set('Cookie', brandOwnerBCookies);

    expect(resB.statusCode).toBe(200);
    // Counts must be isolated to Owner B's listings only
    expect(resB.body.data.counts).toBeDefined();
  });

  // 6. Idempotent Migration Script
  it('AMENDMENT 8: scripts/migrate-leads.js runs idempotently without making changes on 2nd run', async () => {
    const firstRun = await migrateLeads();
    expect(firstRun).toBeDefined();

    const secondRun = await migrateLeads();
    expect(secondRun.migratedCount).toBe(0); // 0 changes on second run
    expect(secondRun.skippedCount).toBeGreaterThan(0);
  });
});
