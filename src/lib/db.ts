// src/lib/db.ts

import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 60000,
  retryWrites: true,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient>;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, it's best to not use a global variable.
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;