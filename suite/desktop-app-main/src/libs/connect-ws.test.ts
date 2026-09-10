import net from 'net';
import { WebSocket } from 'ws';

import {
    type ExposeConnectWsParams,
    MAX_CONCURRENT_CONNECTIONS,
    MAX_CONNECTIONS_PER_ORIGIN,
    exposeConnectWs,
} from './connect-ws';
import { createHttpReceiver } from './http-receiver';
import { Logger } from './logger';

const logger = new Logger('mute');

const LOOPBACK = '127.0.0.1';
const TEST_ORIGIN = 'https://connect.test';
// Client text frame with the MASK bit clear, which the RFC forbids. `ws` rejects it while parsing,
// which is the error that used to escape as an `uncaughtException`.
const UNMASKED_FRAME = Buffer.from([0x81, 0x01, 0x41]);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const waitFor = async (condition: () => boolean, timeoutMs = 2000) => {
    const deadline = Date.now() + timeoutMs;
    while (!condition()) {
        if (Date.now() > deadline) {
            throw new Error('condition was not met in time');
        }
        await delay(10);
    }
};

type RawUpgradeParams = {
    port: number;
    path?: string;
    origin?: string;
    /** Bytes written together with the request, so they arrive as the upgrade `head`. */
    trailing?: Buffer;
};

/**
 * Drives a WebSocket upgrade over a raw socket, which - unlike a `ws` client - can pipeline
 * garbage after the request and can observe exactly which bytes the server sends back.
 */
const rawUpgrade = ({ port, path = '/connect-ws', origin, trailing }: RawUpgradeParams) => {
    const chunks: Buffer[] = [];
    const socket = net.connect(port, LOOPBACK, () => {
        const request = Buffer.from(
            [
                `GET ${path} HTTP/1.1`,
                `Host: ${LOOPBACK}:${port}`,
                'Upgrade: websocket',
                'Connection: Upgrade',
                'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==',
                'Sec-WebSocket-Version: 13',
                ...(origin ? [`Origin: ${origin}`] : []),
                '',
                '',
            ].join('\r\n'),
        );
        socket.write(trailing ? Buffer.concat([request, trailing]) : request);
    });
    socket.on('data', chunk => chunks.push(chunk));
    // A rejected upgrade is closed while the request may still be unread, which the peer sees as
    // a reset rather than a clean shutdown. Either way nothing was sent, which is what we assert.
    socket.on('error', () => {});
    const closed = new Promise<void>(resolve => socket.on('close', () => resolve()));

    return { socket, closed, received: () => Buffer.concat(chunks) };
};

/**
 * Waits for a rejected upgrade to be closed, but not indefinitely: a socket that is still open is
 * itself a failure, and the assertions on the received bytes describe it better than a timeout.
 */
const settle = async (upgrade: ReturnType<typeof rawUpgrade>) => {
    await Promise.race([upgrade.closed, delay(1000)]);
};

const collectUncaughtExceptions = () => {
    const errors: Error[] = [];
    const onUncaughtException = (error: Error) => errors.push(error);
    process.on('uncaughtException', onUncaughtException);

    return {
        errors,
        stop: () => process.off('uncaughtException', onUncaughtException),
    };
};

describe('connect-ws upgrade handling', () => {
    let receiver: ReturnType<typeof createHttpReceiver> | undefined;
    const clients: WebSocket[] = [];
    const rawSockets: net.Socket[] = [];

    const startServer = async () => {
        receiver = createHttpReceiver({ logger, port: 0 });
        const startResult = await receiver.start();
        if (!startResult.success) {
            throw new Error(`server failed to start: ${startResult.message}`);
        }

        const params: ExposeConnectWsParams = {
            httpReceiver: receiver,
            logger,
            mainThreadEmitter: {
                emit: jest.fn(),
            } as unknown as ExposeConnectWsParams['mainThreadEmitter'],
            mainWindowProxy: {
                getInstance: () => undefined,
            } as unknown as ExposeConnectWsParams['mainWindowProxy'],
            store: {
                setConnectSettings: jest.fn(),
            } as unknown as ExposeConnectWsParams['store'],
        };
        exposeConnectWs(params);

        return startResult.payload.port;
    };

    const probe = (upgradeParams: RawUpgradeParams) => {
        const upgrade = rawUpgrade(upgradeParams);
        rawSockets.push(upgrade.socket);

        return upgrade;
    };

    const openClient = (port: number, origin: string) =>
        new Promise<WebSocket>((resolve, reject) => {
            const client = new WebSocket(`ws://${LOOPBACK}:${port}/connect-ws`, { origin });
            client.on('open', () => resolve(client));
            client.on('error', reject);
        });

    const openAcceptedClient = async (port: number, origin: string) => {
        const client = await openClient(port, origin);
        clients.push(client);

        return client;
    };

    const fillOriginCapacity = async (port: number, origin: string) => {
        for (let i = 0; i < MAX_CONNECTIONS_PER_ORIGIN; i++) {
            await openAcceptedClient(port, origin);
        }
    };

    const fillGlobalCapacity = async (port: number) => {
        // The per-origin limit is lower than the global one, so the global limit can only be
        // reached from several origins.
        for (let originIndex = 0; clients.length < MAX_CONCURRENT_CONNECTIONS; originIndex++) {
            const remaining = Math.min(
                MAX_CONNECTIONS_PER_ORIGIN,
                MAX_CONCURRENT_CONNECTIONS - clients.length,
            );
            for (let i = 0; i < remaining; i++) {
                await openAcceptedClient(port, `https://origin-${originIndex}.test`);
            }
        }
    };

    afterEach(async () => {
        clients.forEach(client => client.terminate());
        clients.length = 0;
        rawSockets.forEach(socket => socket.destroy());
        rawSockets.length = 0;
        await receiver?.stop();
        receiver = undefined;
    });

    it('rejects an upgrade on another route without sending a single byte', async () => {
        const port = await startServer();

        const upgrade = probe({ port, path: '/not-connect-ws' });
        await settle(upgrade);

        expect(upgrade.received().length).toBe(0);
    });

    it('rejects an upgrade over the per-origin limit without upgrading it', async () => {
        const port = await startServer();
        await fillOriginCapacity(port, TEST_ORIGIN);

        const upgrade = probe({ port, origin: TEST_ORIGIN });
        await settle(upgrade);

        const received = upgrade.received().toString();
        expect(received).not.toContain('HTTP/1.1 101');
        expect(received).toContain('HTTP/1.1 503');
    });

    it('rejects an upgrade over the global limit without upgrading it', async () => {
        const port = await startServer();
        await fillGlobalCapacity(port);

        const upgrade = probe({ port, origin: 'https://not-yet-connected.test' });
        await settle(upgrade);

        const received = upgrade.received().toString();
        expect(received).not.toContain('HTTP/1.1 101');
        expect(received).toContain('HTTP/1.1 503');
    }, 20000);

    it('does not throw on a malformed frame pipelined into a rejected upgrade', async () => {
        const port = await startServer();
        await fillOriginCapacity(port, TEST_ORIGIN);
        const uncaught = collectUncaughtExceptions();

        const upgrade = probe({ port, origin: TEST_ORIGIN, trailing: UNMASKED_FRAME });
        await settle(upgrade);
        await delay(50);
        uncaught.stop();

        // The upgrade is refused before `handleUpgrade`, so the frame never reaches a parser.
        expect(upgrade.received().toString()).not.toContain('HTTP/1.1 101');
        expect(uncaught.errors).toEqual([]);
    });

    it('does not throw on a malformed frame pipelined into an accepted upgrade', async () => {
        const port = await startServer();
        const uncaught = collectUncaughtExceptions();

        const upgrade = probe({ port, origin: TEST_ORIGIN, trailing: UNMASKED_FRAME });
        // The accepted socket is not closed by the protocol error right away, so wait for the
        // close frame instead - the `101` response is ASCII, so any high byte is that frame.
        await waitFor(() => upgrade.received().includes(0x88));
        uncaught.stop();

        expect(upgrade.received().toString()).toContain('HTTP/1.1 101');
        // The head is parsed a tick after the connection is handed over, so the error only stays
        // handled as long as `ws.on('error')` is registered first in the `connection` handler.
        expect(uncaught.errors).toEqual([]);
    });

    it('accepts a replacement connection once an accepted one closes', async () => {
        const port = await startServer();
        await fillOriginCapacity(port, TEST_ORIGIN);
        const rejected = probe({ port, origin: TEST_ORIGIN });
        await settle(rejected);
        expect(rejected.received().toString()).toContain('HTTP/1.1 503');

        const closing = clients.pop();
        closing?.terminate();

        // The slot is released when the server side of the closed connection emits `close`, which
        // can happen a little after the client is gone, so give the replacement a few attempts.
        let replacement: WebSocket | undefined;
        for (let attempt = 0; attempt < 20 && !replacement; attempt++) {
            replacement = await openAcceptedClient(port, TEST_ORIGIN).catch(() => undefined);
            if (!replacement) {
                await delay(25);
            }
        }

        expect(replacement?.readyState).toBe(WebSocket.OPEN);
    });
});
