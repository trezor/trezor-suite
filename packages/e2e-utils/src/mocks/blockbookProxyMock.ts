import { WebSocket, WebSocketServer } from 'ws';

import { getFreePort } from '@trezor/node-utils';

import { PASSTHROUGH } from './solanaRpcServerMock';

export type BlockbookWsHandler = (params: unknown) => unknown | typeof PASSTHROUGH;

type BlockbookRequest = { id?: string; method?: string; params?: unknown };

/**
 * Local Blockbook WebSocket proxy used in e2e tests. Unlike Playwright's `page.route`, it
 * intercepts at the network destination, so it also serves the blockchain-link worker where
 * `page.routeWebSocket` cannot reach. Set it as a custom Blockbook backend via its `url`.
 *
 * Every frame is forwarded to the live upstream backend except methods with a registered
 * handler, which are answered locally (return PASSTHROUGH from a handler to forward anyway).
 */
export class BlockbookProxyMock {
    private readonly handlers = new Map<string, BlockbookWsHandler>();
    private server?: WebSocketServer;
    private port?: number;
    private proxiedFrames = 0;

    constructor(private readonly upstreamUrl: string) {}

    get url(): string {
        if (this.port === undefined) {
            throw new Error('BlockbookProxyMock is not running');
        }

        return `ws://localhost:${this.port}`;
    }

    // Number of frames forwarded to the live upstream through this proxy.
    get passthroughCount() {
        return this.proxiedFrames;
    }

    setHandler(method: string, handler: BlockbookWsHandler) {
        this.handlers.set(method, handler);
    }

    async start() {
        const [port] = await getFreePort();
        this.port = port;

        await new Promise<void>((resolve, reject) => {
            this.server = new WebSocketServer({ port });
            this.server.on('connection', client => this.handleConnection(client));
            this.server.on('listening', () => resolve());
            this.server.on('error', error => reject(error));
        });
    }

    async stop() {
        const { server } = this;
        this.server = undefined;
        this.port = undefined;
        if (!server) {
            return;
        }
        server.clients.forEach(client => client.terminate());
        await new Promise<void>(resolve => server.close(() => resolve()));
    }

    private handleConnection(client: WebSocket) {
        // Trezor blockbook instances reject websocket handshakes without a User-Agent (403).
        const upstream = new WebSocket(this.upstreamUrl, {
            headers: { 'User-Agent': 'Trezor Suite e2e' },
        });
        const queuedFrames: string[] = [];

        upstream.on('open', () => {
            queuedFrames.forEach(frame => upstream.send(frame));
            queuedFrames.length = 0;
        });
        upstream.on('message', data => client.send(data.toString()));
        upstream.on('close', () => client.close());
        upstream.on('error', () => client.close());

        client.on('message', data => {
            const frame = data.toString();
            let request: BlockbookRequest = {};
            try {
                request = JSON.parse(frame);
            } catch {
                // Non-JSON frames are forwarded untouched.
            }
            const handler = request.method ? this.handlers.get(request.method) : undefined;

            if (handler) {
                const result = handler(request.params);
                if (result !== PASSTHROUGH) {
                    client.send(JSON.stringify({ id: request.id, data: result }));

                    return;
                }
            }

            this.proxiedFrames += 1;
            if (upstream.readyState === WebSocket.OPEN) {
                upstream.send(frame);
            } else {
                queuedFrames.push(frame);
            }
        });
        client.on('close', () => upstream.terminate());
        client.on('error', () => upstream.terminate());
    }
}
