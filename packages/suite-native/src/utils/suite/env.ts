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

export const getLocationOrigin = () => {
    return 'implementation of getLocationOrigin in native';
};

export const submitRequestForm = (
    _formMethod: 'GET' | 'POST' | 'IFRAME',
    _formAction: string,
    _fields: {
        [key: string]: string;
    },
) => {
    return 'implementation of submitRequestForm in native';
};

/**
 * override for suite/utils/env - setOnBeforeUnloadListener
 */
export const setOnBeforeUnloadListener = (_callback: () => void) => {
    // todo:
};
