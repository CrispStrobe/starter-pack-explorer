// src/lib/db.ts

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

let clientPromise: Promise<MongoClient>;

if (!uri) {
  // Throw an error only if not in build process
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('Please add your Mongo URI to the environment variables');
  }
  // If in build process, provide a fallback or mock
  clientPromise = Promise.resolve(null as unknown as MongoClient);
} else {
  const options = {};

  // Extend the global interface to include _mongoClientPromise
  declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
  }

  let client: MongoClient;

  if (process.env.NODE_ENV === 'development') {
    // In development, use a global variable to prevent multiple connections
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production, create a new client for each connection
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

export default clientPromise;
