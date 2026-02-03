import type { Options } from '@sentry/core';

/**
 * List of Sentry error messages to be filtered client-side, which are either irrelevant or out of our control.
 * Note that when you add it here, inbound filters in Sentry ingest are still needed for older Suite versions.
 *
 * This is a good place to add commonly occurring lifecycle errors that may happen during normal use (not preventable).
 * Do not add here errors that are now definitively fixed (those belong in Sentry ingest inbound filters).
 */
export const ignoreErrorsCommon = [
    /.*Sequence of config.*is older than the current one.*/,

    // Various kinds of network connectivity problems
    /.*ERR_INTERNET_DISCONNECTED.*/,
    /.*ERR_NETWORK_IO_SUSPENDED.*/,
    /.*ERR_NETWORK_CHANGED.*/,
    /.*ERR_CONNECTION_TIMED_OUT.*/,
    /.*HTTP Error.*/,
    /.*ERR_NAME_NOT_RESOLVED.*/,
    /.*Websocket timeout.*/,
    /.*Socket is closed.*/,
    /.*websocket was closed.*/,
    /.*Timeout for request.*/,
    /.*Websocket closed unexpectedly.*/,
    /.*Failed to fetch.*/,
    /.*Aborted by timeout.*/,
    /.*Client network socket disconnected before secure TLS connection was established.*/,
    /.*Failed to open URL.*/,
    /.*Fetching of remote JWS config failed: Error: Aborted by timeout.*/,
    /.*failed to get recent blockhash: TypeError: fetch failed.*/,

    // Common transport or Connect lifecycle errors
    /.*Transport stopped.*/,
    /.*Response of unexpected type.*/,
    // comes from bridge originally, we allowed user to init another connect call. should now be wrapped however and not thrown on transport layer
    /.*other call in progress.*/,
    /.*session not found.*/,
    /.*Action canceled by user.*/,
    /.*device disconnected during action.*/, // the same as with 'other call in progress'
] satisfies Options['ignoreErrors'];
