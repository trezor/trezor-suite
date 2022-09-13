import Config from 'react-native-config';

export const isDevelopment = () =>
    Config.ENVIRONMENT === 'debug' || Config.ENVIRONMENT === 'develop';

export const getEnvironment = () => Config.ENVIRONMENT;
