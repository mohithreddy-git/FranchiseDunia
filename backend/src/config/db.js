const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const isProd = process.env.NODE_ENV === 'production';
  const mongoUri = process.env.MONGODB_URI;

  if (isProd) {
    if (!mongoUri) {
      console.error('❌ [DATABASE FATAL ERROR] MONGODB_URI is unset in production environment.');
      throw new Error('CRITICAL: MONGODB_URI must be provided in production mode. Process terminating.');
    }

    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`🚀 [DB MODE: PRODUCTION] Connected to MongoDB Atlas/Cluster at: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.error('❌ [DATABASE FATAL ERROR] Failed to connect to MongoDB URI in production:', err.message);
      throw err;
    }
  }

  // Development / Test environment
  if (mongoUri) {
    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`🌿 [DB MODE: EXTERNAL DEV DB] Connected to MongoDB at: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.warn(`⚠️ [DB WARNING] Failed to connect to specified MONGODB_URI (${err.message}). Falling back to MongoMemoryServer...`);
    }
  }

  // Fallback to In-Memory MongoDB in dev/test when MONGODB_URI is unset or fails
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    if (!mongoMemoryServer) {
      mongoMemoryServer = await MongoMemoryServer.create();
    }
    const inMemoryUri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(inMemoryUri);
    console.log(`🧪 [DB MODE: DEV IN-MEMORY FALLBACK] Active: mongodb-memory-server running at ${inMemoryUri}`);
    return conn;
  } catch (memErr) {
    console.error('❌ [DATABASE ERROR] Failed to initialize MongoMemoryServer fallback:', memErr);
    throw memErr;
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    mongoMemoryServer = null;
  }
};

module.exports = { connectDB, disconnectDB };
