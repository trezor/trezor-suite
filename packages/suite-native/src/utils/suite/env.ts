import { Appearance, Platform } from 'react-native';
import { SuiteThemeVariant } from '@suite-types';

/**
 * override for suite/utils/env - getUserAgent
 */
export const getUserAgent = () =>
    // todo: find a way how to tell userAgent equivalent on mobile
    // https://www.npmjs.com/package/react-native-device-info
    'some mobile device';

export const getProcessPlatform = () => '';

export const getScreenWidth = () =>
    // todo
    1;

export const getScreenHeight = () =>
    // todo
    1;

export const getPlatform = () => 'todo react-native';

export const getPlatformLanguage = () => 'en';

export const getLocationOrigin = () => 'implementation of getLocationOrigin in native';

export const getLocationHostname = () =>
    // Used in Tor component, value shouldn't matter in RN env
    'rn-localhost';

export const isMacOs = () => false;
export const isWindows = () => false;
export const isLinux = () => false;
export const isAndroid = () => Platform.OS === 'android';
export const isIOs = () => Platform.OS === 'ios';

export const getOsName = () => Platform.OS;

export const getOsVersion = () => '';

export const getBrowserName = () => '';

export const getBrowserVersion = () => '';

export const isDesktop = () => false;
export const isWeb = () => false;
export const isMobile = () => false;

export const getEnvironment = () => '';

export const submitRequestForm = (
    _formMethod: 'GET' | 'POST' | 'IFRAME',
    _formAction: string,
    _fields: {
        [key: string]: string;
    },
) => 'implementation of submitRequestForm in native';

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

export const getOSVersion = (): any =>
    // todo
    undefined;
