/**
 * Minimal production server: serves static build (dist/) and analytics log API.
 * Run after `yarn build`, then: npx tsx server/standalone.ts
 * Listens on port 5180 by default; set PORT env to override.
 */

import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { fileURLToPath } from 'url';

import {
    createEventStore,
    handleClearEvents,
    handleEventsStream,
    handleGetEvents,
    handleLog,
} from '@trezor/analytics-log-server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT) || 5180;

const store = createEventStore();
const onLog = handleLog(store);
const onGetEvents = handleGetEvents(store);
const onClearEvents = handleClearEvents(store);
const onEventsStream = handleEventsStream(store);

const MIME: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
};

function serveStatic(res: http.ServerResponse, filePath: string) {
    const ext = path.extname(filePath);
    const contentType = MIME[ext] ?? 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
    const pathname = req.url?.split('?')[0] ?? '/';

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

    const safePath = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.join(DIST, safePath.replace(/^\//, '').replace(/\.\./g, ''));
    if (!filePath.startsWith(DIST)) {
        res.writeHead(403);
        res.end();

        return;
    }
    fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            fs.readFile(path.join(DIST, 'index.html'), (_, data) => {
                res.end(data ?? 'Not found');
            });

            return;
        }
        serveStatic(res, filePath);
    });
});

server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Analytics docs + log server at http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`Set Suite Custom Analytics URL to http://localhost:${PORT}/log`);
});
