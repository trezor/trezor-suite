import { ALLOW_REPORT_TAG, MAX_EVENTS_INTERVAL_LENGTH, MAX_EVENTS_PER_INTERVAL } from './constants';
import { type ChainableBeforeSend } from './types';

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
 *
 * Note that in case of Desktop & Mobile, the SDKs share tags and userId between processes
 * (it consistently handles events e.g. from Electron Main vs. Renderer)
 */
export const redactSentryEvent: ChainableBeforeSend = event => {
    if (event === null) return null;

    incrementOrResetCounter();
    // hard limit the number of events sent this session (app instance), to prevent a flurry of events sent in a loop
    if (eventCountThisSession > MAX_EVENTS_PER_INTERVAL) {
        return null;
    }

    const allowReport = event.tags?.[ALLOW_REPORT_TAG];

    // sentry events are skipped after user rejects analytics reporting (or a past decision is loaded)
    if (allowReport === false) {
        return null;
    }

    // before the analytics confirm/reject status is known, allow report, but with only minimal info (no data about the host machine)
    if (allowReport !== true) {
        delete event.breadcrumbs;
        delete event.contexts;
        delete event.request;
    }

    // whole event is sent after user confirms analytics (or a past decision is loaded)
    return event;
};
