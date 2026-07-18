const mongoose = require('mongoose');

const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connectDB = async () => {
const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/reportgen';

  try {
    await mongoose.connect(uri, connectOptions);
    console.log('MongoDB connected (Atlas)');
    return;
  } catch (err) {
    console.warn('Atlas/local MongoDB failed:', err.message);
    console.warn('Starting in-memory database for local development...');
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), connectOptions);
    console.log('MongoDB connected (in-memory — app will work locally)');
  } catch (err) {
    console.error('MongoDB connection error', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
