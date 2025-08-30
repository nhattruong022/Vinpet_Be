// Custom type definitions for Express
declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      MONGODB_URI: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      CORS_ORIGIN: string;
      RATE_LIMIT_WINDOW_MS: string;
      RATE_LIMIT_MAX_REQUESTS: string;
    }
  }
}
