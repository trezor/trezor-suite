import { useCallback, useEffect, useState } from 'react';

import type { LiveLogEvent } from '../types';

const STREAM_PATH = '/api/analytics-events/stream';
const CLEAR_PATH = '/api/analytics-events/clear';

const joinUrl = (baseUrl: string, path: string) => `${baseUrl.replace(/\/+$/, '')}${path}`;

export const useLiveLogEvents = (baseUrl: string) => {
    const [events, setEvents] = useState<LiveLogEvent[]>([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const url = joinUrl(baseUrl, STREAM_PATH);
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
    }, [baseUrl]);

    const clear = useCallback(async () => {
        await fetch(`${joinUrl(baseUrl, CLEAR_PATH)}?clear=1`, { method: 'GET' });
        setEvents([]);
    }, [baseUrl]);

    return { events, connected, clear };
};
