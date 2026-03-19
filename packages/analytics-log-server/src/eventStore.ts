const MAX_EVENTS_DEFAULT = 500;

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
        deviceId?: string;
    };
    receivedAt: number;
};

type Listener = () => void;

export const createEventStore = (opts?: { maxEvents?: number }) => {
    const maxEvents = opts?.maxEvents ?? MAX_EVENTS_DEFAULT;
    const events: LoggedEvent[] = [];
    const listeners = new Set<Listener>();

    const notify = () => {
        listeners.forEach(fn => fn());
    };

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
            deviceId: searchParams.get('c_device_id') ?? searchParams.get('device_id') ?? undefined,
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
        if (events.length > maxEvents) {
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
