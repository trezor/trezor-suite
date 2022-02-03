import UAParser from 'ua-parser-js';
import { desktopApi, SuiteThemeVariant } from '@trezor/suite-desktop-api';

import type { EnvironmentType } from '@suite-types';

/* This way, we can override simple utils, which helps to polyfill methods which are not available in react-native. */
export const getUserAgent = () => window.navigator.userAgent;

// List of platforms https://docker.apachezone.com/blog/74
export const getPlatform = () => window.navigator.platform;

export const getPlatformLanguage = () => window.navigator.language;

export const getPlatformLanguages = () => window.navigator.languages;

export const getScreenWidth = () => window.screen.width;

export const getScreenHeight = () => window.screen.height;

export const getWindowWidth = () => window.innerWidth;

export const getWindowHeight = () => window.innerHeight;

export const getLocationOrigin = () => window.location.origin;

export const getLocationHostname = () => window.location.hostname;

/* For usage in Electron */
export const getProcessPlatform = () => process.platform;

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
    if (typeof window === 'undefined') return;

    return getPlatform().startsWith('Mac');
};

export const isWindows = () => {
    if (getProcessPlatform() === 'win32') return true;
    if (typeof window === 'undefined') return;

    return getPlatform().startsWith('Win');
};

export const isIOs = () => ['iPhone', 'iPad', 'iPod'].includes(getPlatform());

export const isAndroid = () => /Android/.test(getUserAgent());

export const isChromeOs = () => /CrOS/.test(getUserAgent());

export const isLinux = () => {
    if (getProcessPlatform() === 'linux') return true;
    if (typeof window === 'undefined') return;

    // exclude Android and Chrome OS as window.navigator.platform of those OS is Linux
    if (isAndroid() || isChromeOs()) return false;

    return getPlatform().startsWith('Linux');
};

export const getOsName = () => {
    if (isWindows()) return 'windows';
    if (isMacOs()) return 'macos';
    if (isAndroid()) return 'android';
    if (isChromeOs()) return 'chromeos';
    if (isLinux()) return 'linux';
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
        const serverUrl = await desktopApi.getHttpReceiverAddress('/buy-post');
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

const getDarkThemeQuery = (): MediaQueryList | undefined => {
    const matchMedia = window?.matchMedia;
    return matchMedia && matchMedia('(prefers-color-scheme: dark)');
};

export const getOsTheme = () => (getDarkThemeQuery()?.matches ? 'dark' : 'light');

export const watchOsTheme = (callback: (theme: Exclude<SuiteThemeVariant, 'system'>) => void) => {
    const onThemeChange = (e: MediaQueryListEvent) => callback(e.matches ? 'dark' : 'light');
    const query = getDarkThemeQuery();
    query?.addEventListener('change', onThemeChange);
    return () => query?.removeEventListener('change', onThemeChange);
};
