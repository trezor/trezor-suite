import type { ErrorEvent, EventHint } from '@sentry/core';

/**
 * Backfill information for Object-type errors, which are otherwise hard to debug.
 */
export const normalizeObjectErrors = (event: ErrorEvent | null, hint?: EventHint) => {
    const originalException = hint?.originalException;
    if (event && originalException && typeof originalException === 'object') {
        // in extra, the object is normally readable, better than an [object Object] message
        event.extra = { originalException };
    }

    return event;
};
