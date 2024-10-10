export const isDebugEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'debug';
// From app perspective, develop and preview are the same environment. The difference is in the build process.
export const isDevelopEnv = () =>
    process.env.EXPO_PUBLIC_ENVIRONMENT === 'develop' ||
    process.env.EXPO_PUBLIC_ENVIRONMENT === 'preview';
export const isProduction = () => process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';

export const isDevelopOrDebugEnv = () => isDebugEnv() || isDevelopEnv();

export const getEnv = () => process.env.EXPO_PUBLIC_ENVIRONMENT;

/** Is true if the app is run inside of Detox E2E test environment. */
export const isDetoxTestBuild = () => process.env.EXPO_PUBLIC_IS_DETOX_BUILD === 'true';
