const {
  app,
  request,
  setupTestDB,
  teardownTestDB,
  loginAs,
  Franchise,
  Event,
  BusinessForSale,
  SavedListing,
  User,
} = require('./helpers');

setupTestDB();
teardownTestDB();

describe('Dashboards, Saved Listings & Admin Moderation Domain Tests', () => {
  let investorCookies;
  let brandOwnerCookies;
  let sellerCookies;
  let organizerCookies;
  let adminCookies;

  beforeAll(async () => {
    investorCookies = await loginAs('demo_investor@franchisedunia.in');
    brandOwnerCookies = await loginAs('demo_brand_owner@franchisedunia.in');
    sellerCookies = await loginAs('demo_business_seller@franchisedunia.in');
    organizerCookies = await loginAs('demo_event_organizer@franchisedunia.in');
    adminCookies = await loginAs('admin@franchisedunia.in', 'AdminSecure2025!');
  });

  // 1. Saved Listings (Bookmarks)
  describe('Saved Listings Bookmarking Flow', () => {
    let savedFranchise;

    beforeAll(async () => {
      savedFranchise = await Franchise.findOne({ status: 'approved' });
    });

    it('Investor can bookmark an approved franchise', async () => {
      const res = await request(app)
        .post('/api/v1/saved')
        .set('Cookie', investorCookies)
        .set('Origin', 'http://localhost:3000')
        .send({ targetType: 'franchise', targetId: savedFranchise._id });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.saved.targetId.toString()).toBe(savedFranchise._id.toString());
    });

    it('Saving an unapproved or non-existent target is rejected (404)', async () => {
      const pendingFranchise = await Franchise.findOne({ status: 'pending' });
      const res = await request(app)
        .post('/api/v1/saved')
        .set('Cookie', investorCookies)
        .set('Origin', 'http://localhost:3000')
        .send({ targetType: 'franchise', targetId: pendingFranchise._id });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/non-existent or unapproved/i);
    });

    it('GET /saved returns user bookmarks', async () => {
      const res = await request(app)
        .get('/api/v1/saved?type=franchise')
        .set('Cookie', investorCookies);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.saved.length).toBeGreaterThanOrEqual(1);
    });

    it('AMENDMENT 12: List endpoints include isSaved: true for bookmarked item without N+1 queries', async () => {
      const res = await request(app)
        .get('/api/v1/franchises?limit=50')
        .set('Cookie', investorCookies);

      expect(res.statusCode).toBe(200);
      const targetInList = res.body.data.franchises.find(
        (f) => f._id.toString() === savedFranchise._id.toString()
      );
      expect(targetInList).toBeDefined();
      expect(targetInList.isSaved).toBe(true);
    });

    it('Unsave removes bookmark', async () => {
      const res = await request(app)
        .delete(`/api/v1/saved?targetType=franchise&targetId=${savedFranchise._id}`)
        .set('Cookie', investorCookies)
        .set('Origin', 'http://localhost:3000');

      expect(res.statusCode).toBe(200);
    });
  });

  // 2. Role-Gated Dashboard Endpoints
  describe('Role-gated Dashboards Access Control', () => {
    it('Investor dashboard: investor gets 200, brand_owner gets 403', async () => {
      const okRes = await request(app)
        .get('/api/v1/dashboard/investor')
        .set('Cookie', investorCookies);
      expect(okRes.statusCode).toBe(200);
      expect(okRes.body.data.inquiries).toBeDefined();

      const forbiddenRes = await request(app)
        .get('/api/v1/dashboard/investor')
        .set('Cookie', brandOwnerCookies);
      expect(forbiddenRes.statusCode).toBe(403);
    });

    it('Brand Owner dashboard: brand_owner gets 200, investor gets 403', async () => {
      const okRes = await request(app)
        .get('/api/v1/dashboard/brand-owner')
        .set('Cookie', brandOwnerCookies);
      expect(okRes.statusCode).toBe(200);
      expect(okRes.body.data.franchises).toBeDefined();

      const forbiddenRes = await request(app)
        .get('/api/v1/dashboard/brand-owner')
        .set('Cookie', investorCookies);
      expect(forbiddenRes.statusCode).toBe(403);
    });

    it('Business Seller dashboard: business_seller gets 200, brand_owner gets 403', async () => {
      const okRes = await request(app)
        .get('/api/v1/dashboard/business-seller')
        .set('Cookie', sellerCookies);
      expect(okRes.statusCode).toBe(200);

      const forbiddenRes = await request(app)
        .get('/api/v1/dashboard/business-seller')
        .set('Cookie', brandOwnerCookies);
      expect(forbiddenRes.statusCode).toBe(403);
    });

    it('Event Organizer dashboard: organizer gets 200, investor gets 403', async () => {
      const okRes = await request(app)
        .get('/api/v1/dashboard/event-organizer')
        .set('Cookie', organizerCookies);
      expect(okRes.statusCode).toBe(200);

      const forbiddenRes = await request(app)
        .get('/api/v1/dashboard/event-organizer')
        .set('Cookie', investorCookies);
      expect(forbiddenRes.statusCode).toBe(403);
    });

    it('Admin dashboard: admin gets 200, others get 403', async () => {
      const okRes = await request(app)
        .get('/api/v1/dashboard/admin')
        .set('Cookie', adminCookies);
      expect(okRes.statusCode).toBe(200);
      expect(okRes.body.data.usersByRole).toBeDefined();

      const forbiddenRes = await request(app)
        .get('/api/v1/dashboard/admin')
        .set('Cookie', investorCookies);
      expect(forbiddenRes.statusCode).toBe(403);
    });
  });

  // 3. Admin Moderation & User Management
  describe('Admin Moderation Queue & Deactivation', () => {
    it('GET /admin/pending returns pending franchises, events, and businesses', async () => {
      const res = await request(app)
        .get('/api/v1/admin/pending')
        .set('Cookie', adminCookies);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.totalPending).toBeGreaterThanOrEqual(1);
    });

    it('Non-admin gets 403 on GET /admin/pending', async () => {
      const res = await request(app)
        .get('/api/v1/admin/pending')
        .set('Cookie', investorCookies);

      expect(res.statusCode).toBe(403);
    });

    it('AMENDMENT 6: Rejection of listing requires non-empty reason (400 otherwise)', async () => {
      const pendingFranchise = await Franchise.findOne({ status: 'pending' });

      const failRes = await request(app)
        .patch(`/api/v1/admin/franchise/${pendingFranchise._id}/status`)
        .set('Cookie', adminCookies)
        .set('Origin', 'http://localhost:3000')
        .send({ status: 'rejected', rejectionReason: '   ' });

      expect(failRes.statusCode).toBe(400);
      expect(failRes.body.message).toMatch(/rejectionReason is strictly required/i);

      // Rejection with valid reason succeeds
      const passRes = await request(app)
        .patch(`/api/v1/admin/franchise/${pendingFranchise._id}/status`)
        .set('Cookie', adminCookies)
        .set('Origin', 'http://localhost:3000')
        .send({ status: 'rejected', rejectionReason: 'Incomplete financial disclosures' });

      expect(passRes.statusCode).toBe(200);
      expect(passRes.body.data.rejectionReason).toBe('Incomplete financial disclosures');
    });

    it('PATCH /admin/franchise/:id/status approves pending franchise and makes it publicly visible', async () => {
      const owner = await User.findOne({ email: 'demo_brand_owner@franchisedunia.in' });
      const pendingFranchise = await Franchise.create({
        name: `Pending Brand For Approval ${Date.now()}`,
        slug: `pending-brand-approval-${Date.now()}`,
        industry: 'Healthcare',
        investmentMin: 500000,
        investmentMax: 1000000,
        spaceMinSqFt: 250,
        roiPeriodMonths: 12,
        description: 'Brand for approval test',
        brandOwner: owner._id,
        status: 'pending',
      });

      const res = await request(app)
        .patch(`/api/v1/admin/franchise/${pendingFranchise._id}/status`)
        .set('Cookie', adminCookies)
        .set('Origin', 'http://localhost:3000')
        .send({ status: 'approved' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('PATCH /admin/event/:id/status approves a pending event', async () => {
      const organizer = await User.findOne({ email: 'demo_event_organizer@franchisedunia.in' });
      const pendingEvent = await Event.create({
        title: `Pending Event For Approval ${Date.now()}`,
        slug: `pending-event-approval-${Date.now()}`,
        type: 'webinar',
        city: 'Delhi',
        venue: 'Online',
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        capacity: 100,
        description: 'Webinar for approval test',
        organizer: organizer._id,
        status: 'pending',
      });

      const res = await request(app)
        .patch(`/api/v1/admin/event/${pendingEvent._id}/status`)
        .set('Cookie', adminCookies)
        .set('Origin', 'http://localhost:3000')
        .send({ status: 'approved' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('PATCH /admin/business/:id/status approves a pending business listing', async () => {
      const seller = await User.findOne({ email: 'demo_business_seller@franchisedunia.in' });
      const pendingBusiness = await BusinessForSale.create({
        title: `Pending Business For Approval ${Date.now()}`,
        slug: `pending-business-approval-${Date.now()}`,
        listingType: 'sale',
        industry: 'Retail',
        region: 'Pune',
        establishedYear: 2020,
        employeeCountBand: '5-15',
        revenueBand: '₹1 - 2 Cr',
        profitBand: '₹20 - 40 L',
        askingPriceBand: '₹1.5 Cr',
        summary: 'Pending business for approval test summary description.',
        seller: seller._id,
        status: 'pending',
      });

      const res = await request(app)
        .patch(`/api/v1/admin/business/${pendingBusiness._id}/status`)
        .set('Cookie', adminCookies)
        .set('Origin', 'http://localhost:3000')
        .send({ status: 'approved' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('approved');
    });

    it('AMENDMENT 6: Admin cannot deactivate themselves (400)', async () => {
      const adminUser = await User.findOne({ email: 'admin@franchisedunia.in' });

      const res = await request(app)
        .patch(`/api/v1/admin/users/${adminUser._id}/active`)
        .set('Cookie', adminCookies)
        .set('Origin', 'http://localhost:3000')
        .send({ isActive: false });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/cannot deactivate their own account/i);
    });

    it('Admin can list users and deactivate another user account', async () => {
      const targetUser = await User.findOne({ email: 'demo_investor@franchisedunia.in' });

      const res = await request(app)
        .patch(`/api/v1/admin/users/${targetUser._id}/active`)
        .set('Cookie', adminCookies)
        .set('Origin', 'http://localhost:3000')
        .send({ isActive: false });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.isActive).toBe(false);

      // Reactivate for test suite health
      await User.findByIdAndUpdate(targetUser._id, { isActive: true });
    });
  });
});
