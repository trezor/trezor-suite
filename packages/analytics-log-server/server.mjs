import http from 'node:http';
import { URL } from 'node:url';

const PORT = Number(process.env.PORT) || 5180;
const MAX_EVENTS = Number(process.env.MAX_EVENTS) || 500;

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const setCors = res => {
    for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
};

const send = (res, status, body, contentType = 'text/plain') => {
    setCors(res);
    res.statusCode = status;
    res.setHeader('Content-Type', contentType);
    res.end(body);
};

const events = [];
const listeners = new Set();

const notify = () => {
    for (const fn of listeners) fn();
};

const addFromQueryString = searchParams => {
    const type = searchParams.get('c_type');
    if (!type) return null;

    const payload = {};
    for (const [key, value] of searchParams.entries()) {
        if (!key.startsWith('c_')) payload[key] = value;
    }

    const meta = {
        version: searchParams.get('c_v') ?? undefined,
        commit: searchParams.get('c_commit') ?? undefined,
        instanceId: searchParams.get('c_instance_id') ?? undefined,
        sessionId: searchParams.get('c_session_id') ?? undefined,
        messageId: searchParams.get('c_message_id') ?? undefined,
    };

    const event = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type,
        timestamp: searchParams.get('c_timestamp') ?? String(Date.now()),
        payload,
        meta,
        receivedAt: Date.now(),
    };

    events.unshift(event);
    if (events.length > MAX_EVENTS) events.pop();
    notify();
    return event;
};

const getEvents = () => [...events];

const clearEvents = () => {
    events.length = 0;
    notify();
};

const subscribe = listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const server = http.createServer((req, res) => {
    const method = req.method ?? 'GET';
    const pathname = (req.url?.split('?')[0] ?? '/').toString();

    if (method === 'OPTIONS') {
        setCors(res);
        res.statusCode = 204;
        res.end();
        return;
    }

    if (pathname === '/api/health') {
        send(res, 200, 'OK');
        return;
    }

    if (pathname === '/log' || pathname.startsWith('/log/')) {
        if (method !== 'GET') {
            send(res, 405, 'Method Not Allowed');
            return;
        }
        const url = new URL(req.url ?? '/', 'http://localhost');
        const event = addFromQueryString(url.searchParams);
        setCors(res);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end(event ? 'OK' : 'Missing c_type');
        return;
    }

    if (pathname === '/api/analytics-events') {
        send(res, 200, JSON.stringify(getEvents()), 'application/json');
        return;
    }

    if (pathname === '/api/analytics-events/clear') {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (url.searchParams.get('clear') !== '1') {
            send(res, 400, 'Add ?clear=1 to confirm');
            return;
        }
        clearEvents();
        send(res, 200, JSON.stringify({ ok: true }), 'application/json');
        return;
    }

    if (pathname === '/api/analytics-events/stream') {
        setCors(res);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const push = () => {
            res.write(`data: ${JSON.stringify(getEvents())}\n\n`);
        };

        push();
        const unsub = subscribe(push);

        req.on('close', () => {
            unsub();
            res.end();
        });
        return;
    }

    send(res, 404, 'Not Found');
});

server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Analytics log server listening on http://0.0.0.0:${PORT}`);
});

