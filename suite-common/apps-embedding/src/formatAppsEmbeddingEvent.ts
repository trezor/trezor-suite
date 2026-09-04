import { exhaustive } from '@trezor/type-utils';

import { type AppsEmbeddingEvent } from './types';

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
            return `window.open denied — ${event.url}`;
        case 'closed':
            return `closed — ${event.detail}`;
        default:
            return exhaustive(event);
    }
};
