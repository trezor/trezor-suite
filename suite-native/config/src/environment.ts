import Config from 'react-native-config';

export const isDebugEnv = () => Config.ENVIRONMENT === 'debug';

export const isDevelopEnv = () => Config.ENVIRONMENT === 'develop';

export const isDevelopOrDebugEnv = () => isDebugEnv() || isDevelopEnv();

export const getEnv = () => Config.ENVIRONMENT;
