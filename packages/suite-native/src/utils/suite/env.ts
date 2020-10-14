import { Platform } from 'react-native';

/**
 * override for suite/utils/env - getUserAgent
 */
export const getUserAgent = () => {
    // todo: find a way how to tell userAgent equivalent on mobile
    // https://www.npmjs.com/package/react-native-device-info
    return 'some mobile device';
};

export const isAndroid = () => {
    return Platform.OS === 'android';
};

export const getScreenWidth = () => {
    // todo
    return 1;
};

export const getScreenHeight = () => {
    // todo
    return 1;
};

export const getPlatform = () => {
    return 'linux';
};

export const getPlatformLanguage = () => {
    return 'eskimo';
};

export const isDesktop = () => false;
export const isWeb = () => false;
