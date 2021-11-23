import { TOR_URLS } from '@suite-constants/tor';

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
    'theme',
    'http-receiver',
    'metadata',
    'bridge',
    'tor',
    'custom-protocols',
    'auto-updater',
    'store',
    'udev-install',
    'user-data',
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
    TOR_URLS['trezor.io'],
    `*.${TOR_URLS['trezor.io']}`,
];
