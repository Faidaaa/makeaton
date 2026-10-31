import mongoose from 'mongoose';

// In-memory mock store for resilient zero-dependency fallback when MongoDB is not running locally
class MemoryStore {
  constructor() {
    this.collections = {
      users: [],
      products: [],
      plans: [],
      quotationtemplates: [],
      subscriptions: [],
      discounts: [],
      taxrules: [],
      invoices: [],
      payments: []
    };
    this.idCounter = 1;
  }

  generateId() {
    return 'mem_' + Date.now().toString(36) + '_' + (this.idCounter++).toString(36);
  }

  getCollection(name) {
    const key = name.toLowerCase();
    if (!this.collections[key]) {
      this.collections[key] = [];
    }
    return this.collections[key];
  }
}

export const memoryStore = new MemoryStore();
let isUsingMemoryStoreFlag = false;
export const isUsingMemoryStore = () => isUsingMemoryStoreFlag;

/**
 * Single authoritative MongoDB Atlas connection for Brightloop.
 * Reads MONGO_URI / MONGODB_URI from process.env and targets 'brightloop' database.
 */
export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn('[Database] No MONGO_URI provided. Activating in-memory storage fallback.');
    isUsingMemoryStoreFlag = true;
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      dbName: 'brightloop',
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} | DB: ${conn.connection.name}`);
    isUsingMemoryStoreFlag = false;
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Connection failed (${error.message}). Activating memory fallback.`);
    isUsingMemoryStoreFlag = true;
    return null;
  }
};

export default connectDB;
