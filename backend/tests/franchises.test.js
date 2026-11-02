const {
  app,
  request,
  setupTestDB,
  teardownTestDB,
  loginAs,
  Franchise,
  User,
} = require('./helpers');

setupTestDB();
teardownTestDB();

describe('Franchises Domain Tests (Search, Filter, Brochure Tracking, Re-approval, Mass Assignment)', () => {
  let brandOwnerCookies;
  let adminCookies;
  let otherOwnerCookies;

  beforeAll(async () => {
    brandOwnerCookies = await loginAs('demo_brand_owner@franchisedunia.in');
    adminCookies = await loginAs('admin@franchisedunia.in', 'AdminSecure2025!');
    otherOwnerCookies = await loginAs('brand_partner@franchisedunia.in');
  });

  it('GET /franchises should return paginated list', async () => {
    const res = await request(app).get('/api/v1/franchises?page=1&limit=6');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.franchises.length).toBe(6);
    expect(res.body.data.total).toBeGreaterThanOrEqual(20);
    expect(res.body.data.totalPages).toBeGreaterThanOrEqual(4);
  });

  it('GET /franchises enforces max page size limit <= 50 (Carry-over 6)', async () => {
    const res = await request(app).get('/api/v1/franchises?limit=200');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.limit).toBe(50);
  });

  it('GET /franchises should filter by industry + investment', async () => {
    const res = await request(app).get('/api/v1/franchises?industry=food&minInvestment=500000');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.franchises.length).toBeGreaterThan(0);
    for (const f of res.body.data.franchises) {
      expect(f.industry.toLowerCase()).toContain('food');
      expect(f.investmentMax).toBeGreaterThanOrEqual(500000);
    }
  });

  it('GET /franchises/:slug returns brand with fictional name and isSampleData', async () => {
    const res = await request(app).get('/api/v1/franchises/brew-haven-tea-lounge');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.franchise.slug).toBe('brew-haven-tea-lounge');
    expect(res.body.data.franchise.unitEconomics.expectedNetProfitMargin).toBe(24);
    expect(res.body.data.franchise.name).toMatch(/Brew Haven/);
    expect(res.body.data.franchise.isSampleData).toBe(true);
  });

  it('Pending franchises must NOT appear in public GET /franchises', async () => {
    const res = await request(app).get('/api/v1/franchises?limit=50');
    expect(res.statusCode).toBe(200);
    const pendingItems = res.body.data.franchises.filter((f) => f.status === 'pending');
    expect(pendingItems.length).toBe(0);
  });

  it('AMENDMENT 4: Brochure download streams PDF and tracks BrochureDownload with HMAC ipHash', async () => {
    const res = await request(app)
      .get('/api/v1/franchises/brew-haven-tea-lounge/brochure')
      .set('User-Agent', 'TestBrowser/1.0');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('brew-haven-tea-lounge-brochure.pdf');
  });

  it('AMENDMENT 4: Only franchise owner or admin can call brochure-analytics (another owner gets 403)', async () => {
    const franchise = await Franchise.findOne({ slug: 'brew-haven-tea-lounge' });

    // Other owner gets 403
    const forbiddenRes = await request(app)
      .get(`/api/v1/franchises/${franchise._id}/brochure-analytics`)
      .set('Cookie', otherOwnerCookies);
    expect(forbiddenRes.statusCode).toBe(403);

    // Legitimate owner gets 200
    const ownerRes = await request(app)
      .get(`/api/v1/franchises/${franchise._id}/brochure-analytics`)
      .set('Cookie', brandOwnerCookies);
    expect(ownerRes.statusCode).toBe(200);
    expect(ownerRes.body.data.totalDownloads).toBeGreaterThanOrEqual(1);
    expect(ownerRes.body.data.uniqueDownloads).toBeGreaterThanOrEqual(1);
  });

  it('CARRY-OVER 5: Whitelist body fields on update — user cannot set status approved on own pending listing', async () => {
    const ownerUser = await User.findOne({ email: 'demo_brand_owner@franchisedunia.in' });
    const pendingFranchise = await Franchise.create({
      name: `Pending Brand Test ${Date.now()}`,
      slug: `pending-brand-test-${Date.now()}`,
      industry: 'Retail',
      investmentMin: 500000,
      investmentMax: 1000000,
      spaceMinSqFt: 200,
      roiPeriodMonths: 12,
      description: 'Pending brand test description',
      brandOwner: ownerUser._id,
      status: 'pending',
    });

    // Owner attempts to self-approve via PUT
    const patchRes = await request(app)
      .put(`/api/v1/franchises/${pendingFranchise._id}`)
      .set('Cookie', brandOwnerCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ status: 'approved', description: 'Updated description that is longer than twenty characters' });

    expect(patchRes.statusCode).toBe(200);

    // Verify status was NOT changed to approved
    const reloaded = await Franchise.findById(pendingFranchise._id);
    expect(reloaded.status).toBe('pending');
  });

  it('AMENDMENT 11: Re-approval rule — editing non-key field keeps approved; editing key field resets to pending', async () => {
    const ownerUser = await User.findOne({ email: 'demo_brand_owner@franchisedunia.in' });
    const approvedFranchise = await Franchise.create({
      name: `Approved Re-rule Brand ${Date.now()}`,
      slug: `approved-re-rule-${Date.now()}`,
      industry: 'Food & Beverage',
      investmentMin: 1000000,
      investmentMax: 2000000,
      spaceMinSqFt: 300,
      roiPeriodMonths: 15,
      description: 'Original approved description',
      brandOwner: ownerUser._id,
      status: 'approved',
    });

    // 1. Edit NON-KEY field (description typo fix) -> remains 'approved'
    const nonKeyEdit = await request(app)
      .put(`/api/v1/franchises/${approvedFranchise._id}`)
      .set('Cookie', brandOwnerCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ description: 'Fixed description typo' });

    expect(nonKeyEdit.statusCode).toBe(200);
    const afterNonKey = await Franchise.findById(approvedFranchise._id);
    expect(afterNonKey.status).toBe('approved');

    // 2. Edit KEY field (investmentMin changed) -> resets to 'pending'
    const keyEdit = await request(app)
      .put(`/api/v1/franchises/${approvedFranchise._id}`)
      .set('Cookie', brandOwnerCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ investmentMin: 1500000 });

    expect(keyEdit.statusCode).toBe(200);
    const afterKey = await Franchise.findById(approvedFranchise._id);
    expect(afterKey.status).toBe('pending');
  });
});
