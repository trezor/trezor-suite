import type { ErrorEvent } from '@sentry/core';

import { allowReportTag } from './constants';

/**
 * Common function in all Sentry application to redact a Sentry event or filter it out completely (then returns null).
 */
export const redactSentryEvent = (event: ErrorEvent): ErrorEvent | null => {
    // sentry events are skipped until user confirm analytics reporting
    const allowReport = event.tags?.[allowReportTag];

    if (allowReport === false) {
        return null;
    }
    // allow report redacted error before confirm status is loaded
    if (typeof allowReport === 'undefined') {
        delete event.breadcrumbs;
        delete event.contexts?.device;
    }

    return event;
};
