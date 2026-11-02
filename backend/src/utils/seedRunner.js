const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { connectDB, disconnectDB } = require('../config/db');
const seedDatabase = require('./seedData');

const run = async () => {
  try {
    await connectDB();
    await seedDatabase();
    console.log('✨ Database seeding completed successfully.');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

run();
