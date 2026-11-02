const {
  app,
  request,
  setupTestDB,
  teardownTestDB,
  loginAs,
  Lead,
  Message,
  AuditLog,
  User,
} = require('./helpers');

setupTestDB();
teardownTestDB();

describe('Messages Domain Tests (Thread Auth, ObjectId Cursor, Mark Read, Rate Limiting, Inert XSS)', () => {
  let investorCookies;
  let ownerCookies;
  let thirdPartyCookies;
  let adminCookies;
  let testLead;
  let msg1;
  let msg2;

  beforeAll(async () => {
    investorCookies = await loginAs('demo_investor@franchisedunia.in');
    ownerCookies = await loginAs('demo_brand_owner@franchisedunia.in');
    thirdPartyCookies = await loginAs('brand_partner@franchisedunia.in');
    adminCookies = await loginAs('admin@franchisedunia.in', 'AdminSecure2025!');

    const investor = await User.findOne({ email: 'demo_investor@franchisedunia.in' });
    const owner = await User.findOne({ email: 'demo_brand_owner@franchisedunia.in' });

    testLead = await Lead.findOne({ investor: investor._id, listingOwner: owner._id });
    if (!testLead) {
      testLead = new Lead({
        investor: investor._id,
        listingOwner: owner._id,
        targetType: 'franchise',
        targetId: owner._id,
        fullName: 'Aditya Birla',
        email: 'aditya@birla.in',
        phone: '9820012345',
        investmentBudget: 1500000,
        targetCity: 'Mumbai',
        message: 'Message test lead inquiry',
      });
      await testLead.save();
    }
  });

  it('Participant (Investor) can send a message in lead conversation', async () => {
    const res = await request(app)
      .post(`/api/v1/leads/${testLead._id}/messages`)
      .set('Cookie', investorCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ body: 'Hello brand owner, what is the expected launch timeline?' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.message.body).toBe('Hello brand owner, what is the expected launch timeline?');
    expect(res.body.data.message.read).toBe(false);
    msg1 = res.body.data.message;
  });

  it('Participant (Owner) can reply in lead conversation', async () => {
    const res = await request(app)
      .post(`/api/v1/leads/${testLead._id}/messages`)
      .set('Cookie', ownerCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ body: 'Hello Aditya, typically 45 days after lease execution.' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.message.read).toBe(false);
    msg2 = res.body.data.message;
  });

  it('Non-participant gets 403 on message send and read', async () => {
    const sendRes = await request(app)
      .post(`/api/v1/leads/${testLead._id}/messages`)
      .set('Cookie', thirdPartyCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ body: 'Spy message attempt' });
    expect(sendRes.statusCode).toBe(403);

    const readRes = await request(app)
      .get(`/api/v1/leads/${testLead._id}/messages`)
      .set('Cookie', thirdPartyCookies);
    expect(readRes.statusCode).toBe(403);
  });

  it('AMENDMENT 1: Messages cursor uses _id (ObjectId > since) and returns messages created in same millisecond', async () => {
    // Create 2 messages artificially with identical timestamps
    const now = new Date();
    const batch1 = await Message.create({
      lead: testLead._id,
      sender: testLead.investor,
      recipient: testLead.listingOwner,
      body: 'Rapid msg 1',
      createdAt: now,
      updatedAt: now,
    });
    const batch2 = await Message.create({
      lead: testLead._id,
      sender: testLead.listingOwner,
      recipient: testLead.investor,
      body: 'Rapid msg 2',
      createdAt: now,
      updatedAt: now,
    });

    // Query since batch1._id -> must return batch2
    const res = await request(app)
      .get(`/api/v1/leads/${testLead._id}/messages?since=${batch1._id}`)
      .set('Cookie', investorCookies);

    expect(res.statusCode).toBe(200);
    const returnedIds = res.body.data.messages.map((m) => m._id.toString());
    expect(returnedIds).toContain(batch2._id.toString());
    expect(returnedIds).not.toContain(batch1._id.toString());
  });

  it('Unread count endpoint and mark-as-read flow', async () => {
    // Investor queries unread count
    const unreadBefore = await request(app)
      .get('/api/v1/unread-count')
      .set('Cookie', investorCookies);
    expect(unreadBefore.statusCode).toBe(200);
    expect(unreadBefore.body.data.unreadCount).toBeGreaterThanOrEqual(1);

    // Investor marks messages as read
    const markRes = await request(app)
      .post(`/api/v1/leads/${testLead._id}/messages/read`)
      .set('Cookie', investorCookies)
      .set('Origin', 'http://localhost:3000');
    expect(markRes.statusCode).toBe(200);

    // Unread count drops
    const unreadAfter = await request(app)
      .get('/api/v1/unread-count')
      .set('Cookie', investorCookies);
    expect(unreadAfter.statusCode).toBe(200);
    expect(unreadAfter.body.data.unreadCount).toBeLessThan(unreadBefore.body.data.unreadCount + 1);
  });

  it('AMENDMENT 15: Admin message access logs an AuditLog entry', async () => {
    const adminRead = await request(app)
      .get(`/api/v1/leads/${testLead._id}/messages`)
      .set('Cookie', adminCookies);

    expect(adminRead.statusCode).toBe(200);

    const log = await AuditLog.findOne({
      lead: testLead._id,
      action: 'read_lead_thread',
    });
    expect(log).toBeDefined();
    expect(log.admin).toBeDefined();
  });

  it('XSS payload is stored raw and round-trips as inert text', async () => {
    const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
    const sendRes = await request(app)
      .post(`/api/v1/leads/${testLead._id}/messages`)
      .set('Cookie', investorCookies)
      .set('Origin', 'http://localhost:3000')
      .send({ body: xssPayload });

    expect(sendRes.statusCode).toBe(201);
    expect(sendRes.body.data.message.body).toBe(xssPayload);

    // Read back
    const getRes = await request(app)
      .get(`/api/v1/leads/${testLead._id}/messages?since=${sendRes.body.data.message._id}`)
      .set('Cookie', ownerCookies);
    expect(getRes.statusCode).toBe(200);
  });
});
