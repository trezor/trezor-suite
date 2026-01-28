import type { ErrorEvent } from '@sentry/core';

import { ALLOW_REPORT_TAG, MAX_EVENTS_INTERVAL_LENGTH, MAX_EVENTS_PER_INTERVAL } from './constants';

let eventCountThisSession = 0;
let countingStartTimestamp = Date.now();
const incrementOrResetCounter = () => {
    if (Date.now() - countingStartTimestamp > MAX_EVENTS_INTERVAL_LENGTH) {
        eventCountThisSession = 0;
        countingStartTimestamp = Date.now();
    }
    eventCountThisSession++;
};

/**
 * Common function in all Sentry application to redact a Sentry event or filter it out completely (then returns null).
 */
export const redactSentryEvent = (event: ErrorEvent): ErrorEvent | null => {
    incrementOrResetCounter();
    // hard limit the number of events sent this session (app instance), to prevent a flurry of events sent in a loop
    if (eventCountThisSession > MAX_EVENTS_PER_INTERVAL) {
        return null;
    }

    // sentry events are skipped until user confirm analytics reporting
    const allowReport = event.tags?.[ALLOW_REPORT_TAG];

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
