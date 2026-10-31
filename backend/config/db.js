import mongoose from 'mongoose';

/**
 * Single authoritative MongoDB Atlas connection for Brightloop.
 * Reads MONGO_URI from process.env and targets the shared 'brightloop' database.
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      dbName: 'brightloop',
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} | DB: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection failed: ${error.message}`);
    throw error;
  }
};

export default connectDB;

