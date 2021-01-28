import { Appearance, Platform } from 'react-native';
import { SuiteThemeVariant } from '@suite-types';

/**
 * override for suite/utils/env - getUserAgent
 */
export const getUserAgent = () => {
    // todo: find a way how to tell userAgent equivalent on mobile
    // https://www.npmjs.com/package/react-native-device-info
    return 'some mobile device';
};

export const isDesktop = () => false;
export const isWeb = () => false;

export const isMac = () => false;
export const isWindows = () => false;
export const isLinux = () => false;

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
    return 'todo react-native';
};

export const getPlatformLanguage = () => {
    return 'en';
};

export const getLocationOrigin = () => {
    return 'implementation of getLocationOrigin in native';
};

export const getLocationHostname = () => {
    // Used in Tor component, value shouldn't matter in RN env
    return 'rn-localhost';
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

export const getOSTheme = (): SuiteThemeVariant => {
    const colorScheme = Appearance.getColorScheme();
    return colorScheme === 'dark' ? 'dark' : 'light';
};

export const getOSVersion = (): any => {
    // todo
    return undefined;
};
