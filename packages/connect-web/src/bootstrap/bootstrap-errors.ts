export const BootstrapError = {
    ENV_NOT_SUPPORTED: 'env-not-supported', // general error for unsupported environment or missing APIs
    HANDSHAKE_TIMEOUT: 'handshake-timeout', // handshake between iframe and popup failed (popup did not respond)
    STORAGE_ACCESS_DENIED: 'storage-access-denied', // storage access denied in iframe
    CHANNEL_ID_MISSING: 'channel-id-missing', // channel ID missing in handshake
    ORIGIN_MISSING: 'origin-missing', // origin missing in handshake
    UNKNOWN: 'unknown', // unknown error
} as const;

/**
 * URL of the Suite connect-popup page that shows the given bootstrap error.
 */
export const getPopupErrorURL = (popupPageURL: string, errorCode: string) => {
    const url = new URL(popupPageURL);
    url.search = '';
    url.searchParams.set('connect-popup-err', errorCode);

    return url.toString();
};
