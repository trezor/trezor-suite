import type { Options } from '@sentry/core';

import { ignoreErrorsCommon } from '@suite-common/sentry';

export const ignoreErrors = [
    ...ignoreErrorsCommon,
    /.*ResizeObserver loop limit exceeded.*/,
    /.*Timeout waiting for TOR control port.*/,
    /.*write EPIPE.*/,

    // Common IDB lifecycle errors
    /.*The database connection is closing.*/,
    /.*Error: InvalidStateError: Failed to execute 'transaction' on 'IDBDatabase'.*/,

    // nodeJS deprecation errors
    /.*DEP0040.*punycode.*/, // used deep within tech stack, not much we can do about it atm

    // browser-only Sentry global handler sends duplicated errors (in event.extra it wraps an error message that is also sent as a separate error event)
    /.*unhandledrejection*object Object.*/,
] satisfies Options['ignoreErrors'];
