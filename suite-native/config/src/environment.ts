import Config from 'react-native-config';

export const isDebugEnv = () => Config.ENVIRONMENT === 'debug';

export const isDevelopOrDebugEnv = () =>
    Config.ENVIRONMENT === 'debug' || Config.ENVIRONMENT === 'develop';

export const getEnv = () => Config.ENVIRONMENT;
