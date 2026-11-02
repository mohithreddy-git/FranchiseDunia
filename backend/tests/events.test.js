const {
  app,
  request,
  setupTestDB,
  teardownTestDB,
  loginAs,
  Event,
  EventRegistration,
  User,
} = require('./helpers');

setupTestDB();
teardownTestDB();

describe('Events Domain Tests (Capacity, RSVP, .ics, CSV Sanitization, IDOR, Limit Guard)', () => {
  let investorCookies;
  let organizerACookies;
  let organizerBCookies;
  let adminCookies;
  let testEvent;

  beforeAll(async () => {
    investorCookies = await loginAs('demo_investor@franchisedunia.in');
    organizerACookies = await loginAs('demo_event_organizer@franchisedunia.in');
    organizerBCookies = await loginAs('organizer_b@franchisedunia.in');
    adminCookies = await loginAs('admin@franchisedunia.in', 'AdminSecure2025!');

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

  it('GET /events enforces max page size limit <= 50 (Carry-over 6)', async () => {
    const res = await request(app).get('/api/v1/events?limit=100');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.limit).toBe(50);
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
    await Event.findByIdAndUpdate(testEvent._id, { registeredCount: 0 });
    await EventRegistration.deleteMany({ event: testEvent._id });

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
    expect(icsText).toContain('\r\n');
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

  it('AMENDMENT 5: attendees.csv ownership check — organizer B gets 403 for organizer A event', async () => {
    const orgAEvent = await Event.findOne({
      organizer: (await User.findOne({ email: 'demo_event_organizer@franchisedunia.in' }))._id,
    });

    const forbiddenRes = await request(app)
      .get(`/api/v1/events/${orgAEvent._id}/attendees.csv`)
      .set('Cookie', organizerBCookies);

    expect(forbiddenRes.statusCode).toBe(403);
  });

  it('AMENDMENT 5: attendees.csv neutralizes formula injection cells starting with = + - @ TAB CR', async () => {
    const { sanitizeCsvCell } = require('../src/utils/csvSanitizer');

    expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(sanitizeCsvCell('+cmd|/c calc')).toBe("'+cmd|/c calc");
    expect(sanitizeCsvCell('-1000')).toBe("'-1000");
    expect(sanitizeCsvCell('@IMPORTXML(...)')).toBe("'@IMPORTXML(...)");
    expect(sanitizeCsvCell('\tmaliciousTab')).toBe("'\tmaliciousTab");
    expect(sanitizeCsvCell('\rmaliciousCR')).toBe("'\rmaliciousCR");
    expect(sanitizeCsvCell('Normal Safe Text')).toBe('Normal Safe Text');
  });
});
