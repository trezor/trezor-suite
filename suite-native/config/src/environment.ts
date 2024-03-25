import { z } from 'zod';

const envVariables = z.object({
    EXPO_PUBLIC_ENVIRONMENT: z.string(),
    EXPO_PUBLIC_JWS_PUBLIC_KEY: z.string(),
});

const env = envVariables.parse(process.env);

export const isDebugEnv = () => env.EXPO_PUBLIC_ENVIRONMENT === 'debug';
export const isDevelopEnv = () => env.EXPO_PUBLIC_ENVIRONMENT === 'develop';
export const isProduction = () => env.EXPO_PUBLIC_ENVIRONMENT === 'production';

export const isDevelopOrDebugEnv = () => isDebugEnv() || isDevelopEnv();

export const getJWSPublicKey = () => env.EXPO_PUBLIC_JWS_PUBLIC_KEY;

export const getEnv = () => env.EXPO_PUBLIC_ENVIRONMENT;
