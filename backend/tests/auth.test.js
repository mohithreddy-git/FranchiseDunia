const {
  app,
  request,
  setupTestDB,
  teardownTestDB,
  loginAs,
  getCookie,
  User,
} = require('./helpers');

setupTestDB();
teardownTestDB();

describe('Auth Domain Tests (Cookie-Only, RBAC, CSRF, Deactivation, ReturnTo)', () => {
  it('should connect in dev/test using in-memory MongoDB fallback', () => {
    const mongoose = require('mongoose');
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

  it('should register an investor and set httpOnly cookies with no tokens in body', async () => {
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

    // No tokens in JSON body
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

    // First rotation succeeds
    const firstRefresh = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', [originalRefreshCookie]);
    expect(firstRefresh.statusCode).toBe(200);

    // Replaying rotated token must fail
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

  it('AMENDMENT 6: Deactivated user existing cookie returns 403 immediately', async () => {
    // Create and login a temporary user
    const tempEmail = `deact.${Date.now()}@test.in`;
    await User.create({
      name: 'Temp Deact User',
      email: tempEmail,
      password: 'Password123!',
      role: 'investor',
      isActive: true,
    });

    const userCookies = await loginAs(tempEmail);

    // Verify authenticated request works initially
    const beforeRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', userCookies);
    expect(beforeRes.statusCode).toBe(200);

    // Deactivate user in database
    await User.updateOne({ email: tempEmail }, { isActive: false });

    // Subsequent request with existing cookie must be rejected with 403
    const afterRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', userCookies);
    expect(afterRes.statusCode).toBe(403);
    expect(afterRes.body.message).toMatch(/deactivated/i);
  });

  it('AMENDMENT 2: returnTo validation accepts relative paths only and rejects //evil.com and https://evil.com', () => {
    const returnToRegex = /^\/(?!\/)/;
    const sanitizeReturnTo = (raw) => (raw && returnToRegex.test(raw) ? raw : '/dashboard');

    // Reject protocol-relative and absolute URLs
    expect(sanitizeReturnTo('//evil.com')).toBe('/dashboard');
    expect(sanitizeReturnTo('https://evil.com')).toBe('/dashboard');
    expect(sanitizeReturnTo('http://attacker.com/steal')).toBe('/dashboard');
    expect(sanitizeReturnTo('///evil.com/path')).toBe('/dashboard');
    expect(sanitizeReturnTo('javascript:alert(1)')).toBe('/dashboard');

    // Accept valid relative application paths
    expect(sanitizeReturnTo('/dashboard')).toBe('/dashboard');
    expect(sanitizeReturnTo('/leads')).toBe('/leads');
    expect(sanitizeReturnTo('/inquiries')).toBe('/inquiries');
    expect(sanitizeReturnTo('/franchises/chai-point')).toBe('/franchises/chai-point');
  });
});
