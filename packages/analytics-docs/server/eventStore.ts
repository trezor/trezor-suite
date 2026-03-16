/**
 * In-memory store for analytics events received via GET /log.
 * Used by both Vite dev middleware and optional production server.
 */

const MAX_EVENTS = 500;

export type LoggedEvent = {
    id: string;
    type: string;
    timestamp: string;
    payload: Record<string, string>;
    meta: {
        version?: string;
        commit?: string;
        instanceId?: string;
        sessionId?: string;
        messageId?: string;
    };
    receivedAt: number;
};

type Listener = () => void;

export const createEventStore = () => {
    const events: LoggedEvent[] = [];
    const listeners = new Set<Listener>();

    const notify = () => {
        listeners.forEach(fn => fn());
    };

    /**
     * Parse query string from analytics-uploader format (GET with c_* and payload keys).
     */
    const addFromQueryString = (searchParams: URLSearchParams): LoggedEvent | null => {
        const type = searchParams.get('c_type');
        if (!type) return null;

        const payload: Record<string, string> = {};
        const meta: LoggedEvent['meta'] = {
            version: searchParams.get('c_v') ?? undefined,
            commit: searchParams.get('c_commit') ?? undefined,
            instanceId: searchParams.get('c_instance_id') ?? undefined,
            sessionId: searchParams.get('c_session_id') ?? undefined,
            messageId: searchParams.get('c_message_id') ?? undefined,
        };

        searchParams.forEach((value, key) => {
            if (!key.startsWith('c_')) {
                payload[key] = value;
            }
        });

        const event: LoggedEvent = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            type,
            timestamp: searchParams.get('c_timestamp') ?? String(Date.now()),
            payload,
            meta,
            receivedAt: Date.now(),
        };

        events.unshift(event);
        if (events.length > MAX_EVENTS) {
            events.pop();
        }
        notify();

        return event;
    };

    const getEvents = (): LoggedEvent[] => [...events];

    const clear = (): void => {
        events.length = 0;
        notify();
    };

    const subscribe = (listener: Listener): (() => void) => {
        listeners.add(listener);

        return () => listeners.delete(listener);
    };

    return { addFromQueryString, getEvents, clear, subscribe };
};

export type EventStore = ReturnType<typeof createEventStore>;
