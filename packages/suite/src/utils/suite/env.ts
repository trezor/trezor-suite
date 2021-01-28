import { SuiteThemeVariant } from '@suite-types';

/**
 * method does not do much, but still it is useful as we do not
 * have navigator.userAgent in native. This way we may define
 * overrides only for simple utils and do not need to rewrite entire files
 * for example actions or middlewares
 */
export const getUserAgent = () => {
    return navigator.userAgent;
};

export const isAndroid = () => {
    if (typeof navigator === 'undefined') return;
    return navigator.appVersion.includes('Android');
};

export const isMac = () => {
    if (process.platform === 'darwin') return true; // For usage in Electron (SSR)
    if (typeof navigator === 'undefined') return false;
    return ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'].includes(navigator.platform);
};

export const isWindows = () => {
    if (typeof navigator === 'undefined') return;
    return ['Win32', 'Win64', 'Windows', 'WinCE'].includes(navigator.platform);
};

export const isLinux = () => {
    if (typeof navigator === 'undefined') return;
    return /Linux/.test(navigator.platform);
};

export const getScreenWidth = () => {
    return window.screen.width;
};

export const getScreenHeight = () => {
    return window.screen.height;
};

export const getPlatform = () => {
    return window.navigator.platform;
};

export const getPlatformLanguage = () => {
    return window.navigator.language;
};

export const isWeb = () => process.env.SUITE_TYPE === 'web';

export const isDesktop = () => process.env.SUITE_TYPE === 'desktop';

export const getLocationOrigin = () => {
    return window.location.origin;
};

export const getLocationHostname = () => {
    return window.location.hostname;
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

export const getOSTheme = (): SuiteThemeVariant => {
    if (typeof window === 'undefined') return 'light'; // in SSR, where window object is not defined, just return light theme
    // retrieving os color scheme is supported in Chrome 76+, Firefox 67+
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

export const getOSVersion = () => {
    return window.desktopApi?.getOSVersion();
};
