import WebSocket, { WebSocketServer } from 'ws';

import { blockbookFixtures } from './blockbook';
import { blockfrostFixtures } from './blockfrost';
import { rippleFixtures } from './ripple';

const DEFAULT_RESPONSES = {
    blockbook: blockbookFixtures,
    ripple: rippleFixtures,
    blockfrost: blockfrostFixtures,
};

export const createServer = () => {
    const server = new WebSocketServer({ port: 18088 });

    const processRequest = (
        ws: WebSocket,
        params: { type: string | null; shortcut: string | null },
        message: WebSocket.RawData,
    ) => {
        const request = JSON.parse(message.toString('utf-8'));
        if (!request || !params.type) {
            throw new Error('Unknown WsCacheServer request');
        }
        const serverResponses = DEFAULT_RESPONSES[params.type as keyof typeof DEFAULT_RESPONSES];
        if (!serverResponses) {
            throw new Error(`Unknown WsCacheServer responses for ${params.type}`);
        }

        const field = params.type === 'blockbook' ? 'method' : 'command';
        const command = request[field];
        if (!command) {
            throw new Error(`Unknown WsCacheServer request without ${field}`);
        }

        const fn = serverResponses[command as keyof typeof serverResponses];
        if (!fn) {
            throw new Error(`Unknown WsCacheServer response for ${command}`);
        }

        try {
            // @ts-expect-error -- dynamic function call
            const data = fn(params, request);
            ws.send(JSON.stringify({ ...data, id: request.id }));
        } catch {
            // empty
        }
    };

    server.on('connection', (ws, request) => {
        // request.url starts with /?
        const query = new URLSearchParams(request.url?.substring(2));
        const params = { type: query.get('type'), shortcut: query.get('shortcut') };
        ws.on('message', message => processRequest(ws, params, message));
    });

    return new Promise<typeof server>((resolve, reject) => {
        server.on('listening', () => resolve(server));
        server.on('error', error => reject(error));
    });
};
