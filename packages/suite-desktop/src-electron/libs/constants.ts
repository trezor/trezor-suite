import { TOR_DOMAIN } from '@suite-constants/urls';

export const PROTOCOL = 'file';

// General modules (both dev & prod)
export const MODULES = [
    // Event Logging
    'event-logging/process',
    'event-logging/app',
    'event-logging/contents',
    // Standard modules
    'crash-recover',
    'hang-detect',
    'menu',
    'shortcuts',
    'request-filter',
    'external-links',
    'window-controls',
    'http-receiver',
    'metadata',
    'bridge',
    'tor',
    'analytics',
    'auto-updater',
    'store',
    'udev-install',
];

// Modules only used in prod mode
export const MODULES_PROD = ['csp', 'file-protocol'];

// Modules only used in dev mode
export const MODULES_DEV = ['dev-tools'];

// HTTP server default origins
export const HTTP_ORIGINS_DEFAULT = [
    '127.0.0.1',
    'localhost',
    'trezor.io',
    '*.trezor.io',
    '*.sldev.cz',
    TOR_DOMAIN,
    `*.${TOR_DOMAIN}`,
];
