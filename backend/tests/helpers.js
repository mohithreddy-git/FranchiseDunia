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
const Lead = require('../src/models/Lead');
const Message = require('../src/models/Message');
const SavedListing = require('../src/models/SavedListing');
const BrochureDownload = require('../src/models/BrochureDownload');
const AuditLog = require('../src/models/AuditLog');

jest.setTimeout(60000);

let isConnected = false;
let seededData = null;

const setupTestDB = () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.ENABLE_DEMO_MODE = 'true';
    process.env.IP_HASH_SECRET = 'franchisedunia_test_ip_hash_secret_2026';
    if (!isConnected) {
      await connectDB();
      isConnected = true;
    }
    seededData = await seedDatabase();
  });
};

const teardownTestDB = () => {
  afterAll(async () => {
    // Keep connection open across suite in test run or disconnect at very end
    if (mongoose.connection.readyState !== 0) {
      await disconnectDB();
      isConnected = false;
    }
  });
};

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

module.exports = {
  app,
  request,
  mongoose,
  setupTestDB,
  teardownTestDB,
  loginAs,
  getCookie,
  assertNoProtectedKeys,
  User,
  Franchise,
  Event,
  BusinessForSale,
  NdaAgreement,
  EventRegistration,
  Lead,
  Message,
  SavedListing,
  BrochureDownload,
  AuditLog,
};
