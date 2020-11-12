import { ELECTRON_RECEIVER_SERVER } from '@wallet-constants/coinmarket/buy';

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

export const submitRequestForm = (
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
        window.open(`${ELECTRON_RECEIVER_SERVER}/buy-post?${params}`, '_blank');
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
