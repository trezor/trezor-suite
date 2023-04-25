import Config from 'react-native-config';

export const isDebugEnv = () => Config.ENVIRONMENT === 'debug';
export const isDevelopEnv = () => Config.ENVIRONMENT === 'develop';
export const isStagingEnv = () => Config.ENVIRONMENT === 'staging';
export const isProduction = () => Config.ENVIRONMENT === 'production';

export const isDevelopOrDebugEnv = () => isDebugEnv() || isDevelopEnv();

export const getEnv = () => Config.ENVIRONMENT;
