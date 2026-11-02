const {
  app,
  request,
  setupTestDB,
  teardownTestDB,
  loginAs,
  assertNoProtectedKeys,
  BusinessForSale,
  NdaAgreement,
  User,
} = require('./helpers');

setupTestDB();
teardownTestDB();

describe('Business-for-Sale Domain Tests (Protected Financials, NDA Pinning, Forbidden Filters, IDOR, Omission)', () => {
  let investorCookies;
  let sellerACookies;
  let sellerBCookies;
  let adminCookies;
  let targetBusiness;

  const PROTECTED_KEYS = [
    'exactRevenue',
    'exactNetProfit',
    'balanceSheetSummary',
    'exactAddress',
    'customerConcentration',
    'reasonForSale',
    'sellerContact',
  ];

  beforeAll(async () => {
    investorCookies = await loginAs('demo_investor@franchisedunia.in');
    sellerACookies = await loginAs('demo_business_seller@franchisedunia.in');
    sellerBCookies = await loginAs('seller_b@franchisedunia.in');
    adminCookies = await loginAs('admin@franchisedunia.in', 'AdminSecure2025!');

    targetBusiness = await BusinessForSale.findOne({
      status: 'approved',
      seller: { $ne: (await User.findOne({ email: 'demo_investor@franchisedunia.in' }))._id },
    });
  });

  it('GET /business-for-sale returns paginated list', async () => {
    const res = await request(app).get('/api/v1/business-for-sale?page=1&limit=6');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.businesses.length).toBeGreaterThan(0);
  });

  it('GET /business-for-sale enforces max page size limit <= 50 (Carry-over 6)', async () => {
    const res = await request(app).get('/api/v1/business-for-sale?limit=100');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.limit).toBe(50);
  });

  it('CARRY-OVER 1: GET /business-for-sale LIST NEVER contains protectedFinancials key (omitted entirely, no null)', async () => {
    for (const cookies of [null, investorCookies, adminCookies]) {
      const reqBuilder = request(app).get('/api/v1/business-for-sale');
      if (cookies) reqBuilder.set('Cookie', cookies);
      const res = await reqBuilder;

      expect(res.statusCode).toBe(200);
      for (const b of res.body.data.businesses) {
        expect(Object.keys(b)).not.toContain('protectedFinancials');
        assertNoProtectedKeys(b, PROTECTED_KEYS);
      }
    }
  });

  it('CARRY-OVER 1: GET /business-for-sale/:id — unauthenticated: OMIT protectedFinancials key entirely', async () => {
    const res = await request(app).get(`/api/v1/business-for-sale/${targetBusiness._id}`);
    expect(res.statusCode).toBe(200);
    expect(Object.keys(res.body.data.business)).not.toContain('protectedFinancials');
    assertNoProtectedKeys(res.body.data.business, PROTECTED_KEYS);
    expect(res.body.data.ndaSigned).toBe(false);
  });

  it('CARRY-OVER 1: GET /business-for-sale/:id — authenticated but unsigned: OMIT protectedFinancials key entirely', async () => {
    const unsignedUser = new User({
      name: 'Unsigned User',
      email: `unsigned.${Date.now()}@test.in`,
      password: 'Password123!',
      role: 'investor',
      city: 'Delhi',
    });
    await unsignedUser.save();
    const cookies = await loginAs(unsignedUser.email);

    const res = await request(app)
      .get(`/api/v1/business-for-sale/${targetBusiness._id}`)
      .set('Cookie', cookies);

    expect(res.statusCode).toBe(200);
    expect(Object.keys(res.body.data.business)).not.toContain('protectedFinancials');
    assertNoProtectedKeys(res.body.data.business, PROTECTED_KEYS);
    expect(res.body.data.ndaSigned).toBe(false);
  });

  it('CARRY-OVER 2: GET /business-for-sale: forbidden filter params (?minRevenue, ?sort=exactRevenue, ?sort=-exactNetProfit) return 400', async () => {
    const r1 = await request(app).get('/api/v1/business-for-sale?minRevenue=5000000');
    expect(r1.statusCode).toBe(400);
    expect(r1.body.message).toMatch(/prohibited|confidential/i);

    const r2 = await request(app).get('/api/v1/business-for-sale?sort=exactRevenue');
    expect(r2.statusCode).toBe(400);
    expect(r2.body.message).toMatch(/disallowed|confidential/i);

    const r3 = await request(app).get('/api/v1/business-for-sale?sort=-exactNetProfit');
    expect(r3.statusCode).toBe(400);
    expect(r3.body.message).toMatch(/disallowed|confidential/i);
  });

  it('AMENDMENT 3: ?q= search works against teaser fields only (title, summary, industry)', async () => {
    const res = await request(app).get('/api/v1/business-for-sale?q=school');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.businesses.length).toBeGreaterThan(0);
  });

  it('CARRY-OVER 3: POST /business-for-sale/:id/nda — missing or stale agreementVersion returns 400', async () => {
    const res = await request(app)
      .post(`/api/v1/business-for-sale/${targetBusiness._id}/nda`)
      .set('Cookie', investorCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ signedName: 'Aditya Birla', accepted: true, agreementVersion: 'v0.9-stale' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/stale|version/i);
  });

  it('POST /business-for-sale/:id/nda — investor signs NDA successfully with pinned version v1.0', async () => {
    const res = await request(app)
      .post(`/api/v1/business-for-sale/${targetBusiness._id}/nda`)
      .set('Cookie', investorCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ signedName: 'Aditya Birla', accepted: true, agreementVersion: 'v1.0' });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.data.ndaAgreement.agreementVersion).toBe('v1.0');
  });

  it('POST /business-for-sale/:id/nda — idempotent: second call returns 200 alreadySigned:true', async () => {
    const res = await request(app)
      .post(`/api/v1/business-for-sale/${targetBusiness._id}/nda`)
      .set('Cookie', investorCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ signedName: 'Aditya Birla', accepted: true, agreementVersion: 'v1.0' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.alreadySigned).toBe(true);
  });

  it('GET /business-for-sale/:id — after NDA signed: protectedFinancials ARE present and complete', async () => {
    const res = await request(app)
      .get(`/api/v1/business-for-sale/${targetBusiness._id}`)
      .set('Cookie', investorCookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.ndaSigned).toBe(true);
    expect(res.body.data.business.protectedFinancials).toBeDefined();
    for (const key of PROTECTED_KEYS) {
      expect(res.body.data.business.protectedFinancials[key]).toBeDefined();
    }
  });

  it('IDOR: Seller B cannot access protected data when Investor signed NDA', async () => {
    const sellerBListing = await BusinessForSale.findOne({
      seller: { $ne: (await User.findOne({ email: 'seller_b@franchisedunia.in' }))._id },
      _id: { $ne: targetBusiness._id },
    });
    if (sellerBListing) {
      const res = await request(app)
        .get(`/api/v1/business-for-sale/${sellerBListing._id}`)
        .set('Cookie', sellerBCookies);

      expect(res.statusCode).toBe(200);
      expect(Object.keys(res.body.data.business)).not.toContain('protectedFinancials');
    }
  });

  it('Seller CANNOT sign NDA on their own listing (400)', async () => {
    const sellerA = await User.findOne({ email: 'demo_business_seller@franchisedunia.in' });
    const ownListing = await BusinessForSale.findOne({ seller: sellerA._id });

    const res = await request(app)
      .post(`/api/v1/business-for-sale/${ownListing._id}/nda`)
      .set('Cookie', sellerACookies)
      .set('Origin', 'http://localhost:3000')
      .send({ signedName: 'Pooja Singhania', accepted: true, agreementVersion: 'v1.0' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/owner privileges|seller of this listing/i);
  });

  it("IDOR: Seller B gets 403 editing Seller A's business listing", async () => {
    const sellerA = await User.findOne({ email: 'demo_business_seller@franchisedunia.in' });
    const listingA = await BusinessForSale.findOne({ seller: sellerA._id });

    const res = await request(app)
      .put(`/api/v1/business-for-sale/${listingA._id}`)
      .set('Cookie', sellerBCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ summary: 'Hijacked description that is longer than fifteen characters.' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/forbidden/i);
  });
});
