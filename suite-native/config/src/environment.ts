export const isDebugEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'debug';
export const isDevelopEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'develop';
export const isStagingEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'staging';
export const isProduction = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';

export const isDevelopOrDebugEnv = () => isDebugEnv() || isDevelopEnv();

export const getEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT;
