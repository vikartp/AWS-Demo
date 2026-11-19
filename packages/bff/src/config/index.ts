import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Backend service URL (local container or Lambda invoke)
  backendUrl: process.env.BACKEND_URL || 'http://backend:3001',

  // Auth config
  authProvider: (process.env.AUTH_PROVIDER || 'local') as 'local' | 'cognito',
  jwtSecret: process.env.JWT_SECRET || 'local-dev-secret-change-in-production',
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || '',
  cognitoClientId: process.env.COGNITO_CLIENT_ID || '',
  cognitoRegion: process.env.COGNITO_REGION || 'us-east-1',
} as const;
