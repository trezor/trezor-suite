import { exhaustive } from '@trezor/type-utils';

import { type AppsEmbeddingEvent, type AppsEmbeddingWindowOpenOutcome } from './types';

// A record rather than a nested switch: adding an outcome then fails to compile here too.
const WINDOW_OPEN_OUTCOME_LABEL: Record<AppsEmbeddingWindowOpenOutcome, string> = {
    denied: 'denied',
    'opened-in-app': 'opened in an app window',
    'opened-in-system-browser': 'opened in the system browser',
};

const MAX_MESSAGE_DATA_LENGTH = 500;

const formatMessageData = (data: unknown) => {
    try {
        const serialized = JSON.stringify(data);

        return serialized.length > MAX_MESSAGE_DATA_LENGTH
            ? `${serialized.slice(0, MAX_MESSAGE_DATA_LENGTH)}…`
            : serialized;
    } catch {
        return '[unserializable data]';
    }
};

/**
 * One-line rendering of a showcase event for the per-platform event logs.
 * @debug
 */
export const formatAppsEmbeddingEvent = (event: AppsEmbeddingEvent): string => {
    switch (event.type) {
        case 'loaded':
            return `loaded — ${event.detail}`;
        case 'navigated':
            return `navigated — ${event.url}`;
        case 'load-failed':
            return `load failed — ${event.detail}`;
        case 'callback':
            return `callback ${event.status.toUpperCase()} — ${event.url}`;
        case 'message':
            return `message ${formatMessageData(event.data)}`;
        case 'window-open-attempt':
            return `window.open ${WINDOW_OPEN_OUTCOME_LABEL[event.outcome]} — ${event.url}`;
        case 'navigation-blocked':
            return `navigation blocked — ${event.url}`;
        case 'closed':
            return `closed — ${event.detail}`;
        default:
            return exhaustive(event);
    }
};
