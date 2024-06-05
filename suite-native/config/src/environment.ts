import Constants from 'expo-constants';

export const isDebugEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'debug';
export const isDevelopEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'develop';
export const isProduction = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';

export const isDevelopOrDebugEnv = () => isDebugEnv() || isDevelopEnv();

export const getEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT;

/** Is true if the app is run inside of Detox E2E test environment. */
export const isDetoxTestBuild = () => !!Constants.expoConfig?.extra?.isDetoxTestBuild;
