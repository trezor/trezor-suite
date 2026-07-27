import type { EventStore } from './eventStore.js';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export type Req = { method: string; url: string; on?: (ev: string, fn: () => void) => void };
export type Res = {
    setHeader: (name: string, value: string | number) => void;
    writeHead: (statusCode: number, headers?: Record<string, string>) => void;
    write?: (chunk: string) => void;
    end: (body?: string) => void;
};

const setCors = (res: Res) => {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
};

const send = (res: Res, status: number, body: string, contentType: string) => {
    setCors(res);
    res.setHeader('Content-Type', contentType);
    res.writeHead(status);
    res.end(body);
};

const sendJson = (res: Res, status: number, data: unknown) => {
    send(res, status, JSON.stringify(data), 'application/json');
};

export const handleLog = (store: EventStore) => (req: Req, res: Res) => {
    if (req.method === 'OPTIONS') {
        setCors(res);
        res.writeHead(204);
        res.end();

        return;
    }
    if (req.method !== 'GET') {
        send(res, 405, 'Method Not Allowed', 'text/plain');

        return;
    }
    const url = new URL(req.url, 'http://localhost');
    const event = store.addFromQueryString(url.searchParams);
    setCors(res);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(event ? 'OK' : 'Missing c_type');
};

export const handleGetEvents = (store: EventStore) => (_req: Req, res: Res) => {
    sendJson(res, 200, store.getEvents());
};

export const handleClearEvents = (store: EventStore) => (req: Req, res: Res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.searchParams.get('clear') !== '1') {
        send(res, 400, 'Add ?clear=1 to confirm', 'text/plain');

        return;
    }
    store.clear();
    sendJson(res, 200, { ok: true });
};

export const handleEventsStream = (store: EventStore) => (req: Req, res: Res) => {
    setCors(res);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.writeHead(200);

    const push = () => {
        const data = JSON.stringify(store.getEvents());
        if (res.write) {
            res.write(`data: ${data}\n\n`);
        } else {
            res.end(`data: ${data}\n\n`);
        }
    };

    push();
    const unsub = store.subscribe(push);

    req.on?.('close', () => {
        unsub();
        res.end();
    });
};
