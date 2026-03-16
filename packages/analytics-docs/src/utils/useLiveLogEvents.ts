import { useCallback, useEffect, useState } from 'react';

import type { LiveLogEvent } from '../types';

const STREAM_PATH = '/api/analytics-events/stream';
const CLEAR_PATH = '/api/analytics-events/clear';

export const useLiveLogEvents = () => {
    const [events, setEvents] = useState<LiveLogEvent[]>([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        const url = `${base}${STREAM_PATH}`;
        const es = new EventSource(url);

        es.onopen = () => setConnected(true);
        es.onerror = () => setConnected(false);

        es.onmessage = (e: MessageEvent<string>) => {
            try {
                const data = JSON.parse(e.data) as LiveLogEvent[];
                setEvents(Array.isArray(data) ? data : []);
            } catch {
                // ignore parse errors
            }
        };

        return () => {
            es.close();
            setConnected(false);
        };
    }, []);

    const clear = useCallback(async () => {
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        await fetch(`${base}${CLEAR_PATH}?clear=1`, { method: 'GET' });
        setEvents([]);
    }, []);

    return { events, connected, clear };
};
