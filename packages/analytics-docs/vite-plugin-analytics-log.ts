/**
 * Vite plugin: middleware for /log (receive Suite analytics) and /api/analytics-events (read/SSE/clear).
 * Enables CORS so Suite (web/desktop) on another origin can send events.
 */

import type { Plugin } from 'vite';

import { createEventStore } from './server/eventStore';
import {
    handleClearEvents,
    handleEventsStream,
    handleGetEvents,
    handleLog,
} from './server/handlers';

export const analyticsLogPlugin = (): Plugin => {
    const store = createEventStore();
    const onLog = handleLog(store);
    const onGetEvents = handleGetEvents(store);
    const onClearEvents = handleClearEvents(store);
    const onEventsStream = handleEventsStream(store);

    return {
        name: 'analytics-log',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const pathname = req.url?.split('?')[0] ?? '';

                if (pathname === '/log' || pathname.startsWith('/log/')) {
                    onLog(
                        { method: req.method ?? 'GET', url: req.url ?? '/', on: req.on?.bind(req) },
                        res,
                    );

                    return;
                }
                if (pathname === '/api/analytics-events') {
                    onGetEvents(
                        { method: req.method ?? 'GET', url: req.url ?? '/' },
                        res,
                    );

                    return;
                }
                if (pathname === '/api/analytics-events/clear') {
                    onClearEvents(
                        { method: req.method ?? 'GET', url: req.url ?? '/' },
                        res,
                    );

                    return;
                }
                if (pathname === '/api/analytics-events/stream') {
                    onEventsStream(
                        {
                            method: req.method ?? 'GET',
                            url: req.url ?? '/',
                            on: (ev: string, fn: () => void) => req.on?.(ev, fn),
                        },
                        res,
                    );

                    return;
                }
                next();
            });
        },
    };
};
