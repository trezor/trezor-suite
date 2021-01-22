export const PROTOCOL = 'file';

// General modules (both dev & prod)
export const MODULES = [
    // Event Logging
    'event-logging/process',
    'event-logging/app',
    'event-logging/contents',
    // Standard modules
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
];

// Modules only used in prod mode
export const MODULES_PROD = ['csp', 'file-protocol', 'auto-updater'];

// Modules only used in dev mode
export const MODULES_DEV = ['dev-tools'];
