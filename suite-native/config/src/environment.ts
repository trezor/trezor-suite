export const isDebugEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'debug';
export const isDevelopEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'develop';
export const isProduction = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';

export const isDevelopOrDebugEnv = () => isDebugEnv() || isDevelopEnv();

export const getJWSPublicKey = () => process.env.EXPO_PUBLIC_JWS_PUBLIC_KEY;

export const getEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT;
