import UAParser from 'ua-parser-js';

import type { SuiteThemeVariant, EnvironmentType } from '@suite-types';

/* This way, we can override simple utils, which helps to polyfill methods which are not available in react-native. */
export const getUserAgent = () => navigator?.userAgent || '';

export const getPlatform = () => navigator?.platform || '';

export const getPlatformLanguage = () => navigator?.language || '';

export const getAppVersion = () => navigator?.appVersion || '';

/* For usage in Electron (SSR) */
export const getProcessPlatform = () => process?.platform || '';

export const getScreenWidth = () => window?.screen?.width || 0;

export const getScreenHeight = () => window?.screen?.height || 0;

export const getLocationOrigin = () => window?.location?.origin || '';

export const getLocationHostname = () => window?.location?.hostname || '';

let userAgentParser: UAParser;
const getUserAgentParser = () => {
    if (!userAgentParser) {
        const ua = getUserAgent();
        userAgentParser = new UAParser(ua);
    }
    return userAgentParser;
};

export const isMacOs = () => {
    if (getProcessPlatform() === 'darwin') return true;

    return ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'].includes(getPlatform());
};

export const isWindows = () => {
    if (getProcessPlatform() === 'win32') return true;

    return ['Win32', 'Win64', 'Windows', 'WinCE'].includes(getPlatform());
};

export const isLinux = () => {
    if (getProcessPlatform() === 'linux') return true;

    return /Linux/.test(getPlatform());
};

export const isAndroid = () => getAppVersion().includes('Android');

export const isIOs = () => ['iPhone', 'iPad', 'iPod'].includes(getPlatform());

export const getOsName = () => {
    if (isMacOs()) return 'macos';
    if (isLinux()) return 'linux';
    if (isWindows()) return 'windows';
    if (isAndroid()) return 'android';
    if (isIOs()) return 'ios';

    return '';
};

/* Not correct for Linux as there is many different distributions in different versions */
export const getOsVersion = () => getUserAgentParser().getOS().version || '';

export const getBrowserName = (): string => {
    const browserName = getUserAgentParser().getBrowser().name;

    return browserName?.toLowerCase() || '';
};

export const getBrowserVersion = (): string => getUserAgentParser().getBrowser().version || '';

export const isWeb = () => process.env.SUITE_TYPE === 'web';

export const isDesktop = () => process.env.SUITE_TYPE === 'desktop';

export const isMobile = () => process.env.SUITE_TYPE === 'mobile';

export const getEnvironment = (): EnvironmentType => {
    if (isWeb()) return 'web';
    if (isDesktop()) return 'desktop';
    if (isMobile()) return 'mobile';

    return '';
};

export const submitRequestForm = async (
    formMethod: 'GET' | 'POST' | 'IFRAME',
    formAction: string,
    fields: {
        [key: string]: string;
    },
) => {
    // for IFRAME there is nothing to submit
    if (formMethod === 'IFRAME') return;

    if (formMethod === 'GET' && formAction) {
        window.open(formAction, isDesktop() ? '_blank' : '_self');
        return;
    }

    if (isDesktop()) {
        let params = `a=${encodeURIComponent(formAction)}`;
        Object.keys(fields).forEach(k => {
            params += `&${k}=${encodeURIComponent(fields[k])}`;
        });
        const serverUrl = await window.desktopApi?.getHttpReceiverAddress('/buy-post');
        window.open(`${serverUrl}?${params}`, '_blank');
    } else {
        const form = document.createElement('form');
        form.method = formMethod;
        form.action = formAction;
        Object.keys(fields).forEach(key => {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = fields[key];
            form.appendChild(hiddenField);
        });

        if (!document.body) return;
        document.body.appendChild(form);
        form.submit();
    }
};

/**
 * Use this function to add event listener that will be fired before application is closed
 * @param callback
 */
export const setOnBeforeUnloadListener = (callback: () => void) => {
    window.addEventListener('beforeunload', callback);
};

export const getOsTheme = (): SuiteThemeVariant => {
    if (typeof window === 'undefined') return 'light'; // in SSR, where window object is not defined, just return light theme
    // retrieving os color scheme is supported in Chrome 76+, Firefox 67+
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

/* Working only in desktop app */
export const getOsType = () => window.desktopApi?.getOsType();
