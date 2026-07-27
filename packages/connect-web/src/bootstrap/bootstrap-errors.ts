export const BootstrapError = {
    ENV_NOT_SUPPORTED: 'env-not-supported', // general error for unsupported environment or missing APIs
    HANDSHAKE_TIMEOUT: 'handshake-timeout', // handshake between iframe and popup failed (popup did not respond)
    STORAGE_ACCESS_DENIED: 'storage-access-denied', // storage access denied in iframe
    CHANNEL_ID_MISSING: 'channel-id-missing', // channel ID missing in handshake
    ORIGIN_MISSING: 'origin-missing', // origin missing in handshake
    UNKNOWN: 'unknown', // unknown error
} as const;
