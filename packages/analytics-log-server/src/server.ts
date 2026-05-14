import * as http from 'http';

import { createEventStore } from './eventStore.js';
import { handleClearEvents, handleEventsStream, handleGetEvents, handleLog } from './handlers.js';

const PORT = Number(process.env.PORT) || 5181;
const MAX_EVENTS = Number(process.env.MAX_EVENTS) || 500;

const store = createEventStore({ maxEvents: MAX_EVENTS });
const onLog = handleLog(store);
const onGetEvents = handleGetEvents(store);
const onClearEvents = handleClearEvents(store);
const onEventsStream = handleEventsStream(store);

const server = http.createServer((req, res) => {
    const pathname = req.url?.split('?')[0] ?? '/';

    if (pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');

        return;
    }

    if (pathname === '/log' || pathname.startsWith('/log/')) {
        onLog({ method: req.method ?? 'GET', url: req.url ?? '/', on: req.on?.bind(req) }, res);

        return;
    }
    if (pathname === '/api/analytics-events') {
        onGetEvents({ method: req.method ?? 'GET', url: req.url ?? '/' }, res);

        return;
    }
    if (pathname === '/api/analytics-events/clear') {
        onClearEvents({ method: req.method ?? 'GET', url: req.url ?? '/' }, res);

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

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Analytics log server listening on http://0.0.0.0:${PORT}`);
});
