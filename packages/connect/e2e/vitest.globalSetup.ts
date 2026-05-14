// Vitest global setup — runs once before all tests in Node.js context (not in browser).
// Starts the WebSocket cache server before all tests (if TESTS_USE_WS_CACHE is enabled).

import { createServer } from './__wscache__';

let server: { close: () => void } | undefined;

export async function setup() {
    if (process.env.TESTS_USE_WS_CACHE === 'true') {
        try {
            server = await createServer();
        } catch (err: any) {
            if (err?.code === 'EADDRINUSE') {
                console.warn('WS cache server port already in use, skipping');
            } else {
                throw err;
            }
        }
    }
}

export function teardown() {
    if (server) {
        server.close();
    }
}
