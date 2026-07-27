import http from 'http';
import { type WebSocket, WebSocketServer } from 'ws';

import { getFreePort } from '@trezor/node-utils';

/**
 * Returned by a handler that wants the request forwarded to the upstream backend,
 * mirroring an unmocked Solana JSON-RPC method.
 */
export const PASSTHROUGH = Symbol('passthrough');

export type SolanaRpcHandler = (params: unknown[]) => unknown | typeof PASSTHROUGH;

type JsonRpcRequest = { id?: number | string; method?: string; params?: unknown[] };

/**
 * Local Solana JSON-RPC backend used in e2e tests. Unlike Playwright's `page.route`, it intercepts
 * at the network destination, so it also serves the blockchain-link worker running outside Chromium
 * (desktop). Set it as a custom Solana backend via its `url`.
 *
 * - HTTP: mocked methods are answered from their handler, the rest are proxied to `upstreamUrl`.
 * - WebSocket (same port): acknowledges `@solana/kit` subscriptions so `accountNotifications` resolve.
 */
export class SolanaRpcServerMock {
    private readonly handlers = new Map<string, SolanaRpcHandler>();
    private httpServer?: http.Server;
    private subscriptionServer?: WebSocketServer;
    private port?: number;
    private nextSubscriptionId = 1;
    private proxiedRequests = 0;

    constructor(private readonly upstreamUrl: string) {}

    get url(): string {
        if (this.port === undefined) {
            throw new Error('SolanaRpcServerMock is not running');
        }

        return `http://localhost:${this.port}`;
    }

    // Number of requests forwarded to the live upstream. Non-zero value proves the mock is
    // actually serving the backend, so a broadcast cannot slip past it to a real endpoint.
    get passthroughCount(): number {
        return this.proxiedRequests;
    }

    setHandler(method: string, handler: SolanaRpcHandler): void {
        this.handlers.set(method, handler);
    }

    async start(): Promise<void> {
        [this.port] = await getFreePort();
        this.httpServer = http.createServer((request, response) =>
            this.handleHttpRequest(request, response),
        );
        this.subscriptionServer = new WebSocketServer({ server: this.httpServer });
        this.subscriptionServer.on('connection', socket =>
            socket.on('message', data => this.acknowledgeSubscription(socket, data)),
        );

        await new Promise<void>(resolve => this.httpServer!.listen(this.port, resolve));
    }

    dropConnections(): void {
        this.subscriptionServer?.clients.forEach(client => client.terminate());
    }

    async stop(): Promise<void> {
        this.subscriptionServer?.clients.forEach(client => client.terminate());
        this.subscriptionServer?.close();
        if (!this.httpServer) {
            return;
        }
        // close() alone would hang on the worker's keep-alive sockets, so drop them explicitly
        await new Promise<void>(resolve => {
            this.httpServer!.close(() => resolve());
            this.httpServer!.closeAllConnections();
        });
    }

    private acknowledgeSubscription(socket: WebSocket, data: unknown) {
        let message: JsonRpcRequest;
        try {
            message = JSON.parse(String(data));
        } catch {
            return;
        }

        const method = message.method ?? '';
        if (method.endsWith('Unsubscribe')) {
            socket.send(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: true }));
        } else if (method.endsWith('Subscribe')) {
            socket.send(
                JSON.stringify({
                    jsonrpc: '2.0',
                    id: message.id,
                    result: this.nextSubscriptionId++,
                }),
            );
        }
    }

    private handleHttpRequest(request: http.IncomingMessage, response: http.ServerResponse) {
        response.setHeader('access-control-allow-origin', '*');
        response.setHeader('access-control-allow-headers', 'content-type');
        response.setHeader('access-control-allow-methods', 'POST, OPTIONS');
        if (request.method === 'OPTIONS') {
            response.writeHead(204).end();

            return;
        }

        const chunks: Buffer[] = [];
        request.on('data', chunk => chunks.push(chunk));
        request.on('end', () => this.respondToRpcCall(Buffer.concat(chunks), response));
    }

    private async respondToRpcCall(rawBody: Buffer, response: http.ServerResponse) {
        let request: JsonRpcRequest;
        try {
            request = JSON.parse(rawBody.toString());
        } catch {
            response.writeHead(400).end();

            return;
        }

        try {
            const handler = request.method ? this.handlers.get(request.method) : undefined;
            if (!handler) {
                await this.proxyToUpstream(rawBody, response);

                return;
            }

            const result = await handler(request.params ?? []);
            if (result === PASSTHROUGH) {
                await this.proxyToUpstream(rawBody, response);

                return;
            }
            if (result === undefined) {
                throw new Error(
                    `Handler for "${request.method}" returned undefined; return PASSTHROUGH to proxy to upstream`,
                );
            }

            this.sendJson(response, 200, { jsonrpc: '2.0', id: request.id, result });
        } catch (error) {
            if (response.headersSent) {
                response.end();

                return;
            }
            this.sendJson(response, 500, {
                jsonrpc: '2.0',
                id: request.id,
                error: { code: -32603, message: String(error) },
            });
        }
    }

    private async proxyToUpstream(rawBody: Buffer, response: http.ServerResponse) {
        this.proxiedRequests += 1;
        try {
            const upstreamResponse = await fetch(this.upstreamUrl, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: rawBody.toString(),
            });
            response.writeHead(upstreamResponse.status, { 'content-type': 'application/json' });
            response.end(await upstreamResponse.text());
        } catch {
            response.writeHead(502).end();
        }
    }

    private sendJson(response: http.ServerResponse, status: number, body: unknown) {
        const payload = JSON.stringify(body);
        response.writeHead(status, { 'content-type': 'application/json' });
        response.end(payload);
    }
}
