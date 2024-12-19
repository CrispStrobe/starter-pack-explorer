// src/types/env.d.ts

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

export {}