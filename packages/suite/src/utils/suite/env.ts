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
