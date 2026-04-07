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

    // Common Electron lifecycle errors
    /.*Frame property was accessed after it navigated or was destroyed.*/, // Renderer process already closed while main is still responding to its IPC

    // nodeJS deprecation errors
    /.*DEP0040.*punycode.*/, // used deep within tech stack, not much we can do about it atm
] satisfies Options['ignoreErrors'];
