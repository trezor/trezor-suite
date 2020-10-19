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
