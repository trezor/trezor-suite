import type { Options } from '@sentry/core';

/**
 * List of Sentry error messages to be filtered client-side, which are either irrelevant or out of our control.
 * Note that when you add it here, inbound filters in Sentry ingest are still needed for older Suite versions.
 */
export const ignoreErrors = [
    'ERR_INTERNET_DISCONNECTED',
    'ERR_NETWORK_IO_SUSPENDED',
    'ERR_NETWORK_CHANGED',
    'Error: HTTP Error',
    'ResizeObserver loop limit exceeded',
    // comes from bridge originally, we allowed user to init another connect call. should now be wrapped however and not thrown on transport layer
    'other call in progress',
    'Action canceled by user',
    'device disconnected during action', // the same as with 'other call in progress'
] satisfies Options['ignoreErrors'];
