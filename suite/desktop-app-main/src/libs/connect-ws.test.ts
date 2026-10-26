import net from 'net';
import { WebSocket } from 'ws';

import { CORE_CALL, POPUP } from '@trezor/connect';
import { findProcessFromIncomingPort } from '@trezor/node-utils';
import { createDeferred } from '@trezor/utils';

import { rejectMessage } from './connect-popup-messages';
import {
    IDLE_CONNECTION_TIMEOUT_MS,
    MAX_CONCURRENT_CONNECTIONS,
    MAX_CONNECTIONS_PER_ORIGIN,
    PROCESS_LOOKUP_TIMEOUT_MS,
    exposeConnectWs,
} from './connect-ws';
import { createHttpReceiver } from './http-receiver';
import { Logger } from './logger';

jest.mock('@trezor/node-utils', () => ({
    ...jest.requireActual('@trezor/node-utils'),
    findProcessFromIncomingPort: jest.fn(() => Promise.resolve(undefined)),
}));

type ExposeConnectWsParams = Parameters<typeof exposeConnectWs>[0];

const LOOPBACK = '127.0.0.1';
const logger = new Logger('mute');

const handshake = {
    type: POPUP.HANDSHAKE,
    payload: {
        settings: {
            manifest: { appName: 'App', appUrl: 'https://app.test', email: 'dev@app.test' },
        },
    },
};

let requestId = 0;
// Resolves with the response to the message, or with `undefined` once the connection is closed.
const request = (client: WebSocket, message: object) => {
    if (client.readyState !== WebSocket.OPEN) return Promise.resolve(undefined);

    const id = `${++requestId}`;
    const response = createDeferred<unknown>();
    const onMessage = (data: WebSocket.RawData) => {
        const parsed = JSON.parse(data.toString());
        if (parsed.id === id) response.resolve(parsed);
    };
    const onClose = () => response.resolve(undefined);
    client.on('message', onMessage).on('close', onClose);
    client.send(JSON.stringify({ id, ...message }));

    return response.promise.finally(() => client.off('message', onMessage).off('close', onClose));
};

// A raw socket instead of a `ws` client, so that any request target can be sent and the exact
// response observed.
const rawUpgrade = (port: number, path: string, origin: string) => {
    const chunks: Buffer[] = [];
    const socket = net.connect(port, LOOPBACK, () =>
        socket.write(
            [
                `GET ${path} HTTP/1.1`,
                `Host: ${LOOPBACK}:${port}`,
                'Upgrade: websocket',
                'Connection: Upgrade',
                'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==',
                'Sec-WebSocket-Version: 13',
                `Origin: ${origin}`,
                '',
                '',
            ].join('\r\n'),
        ),
    );
    socket.on('data', chunk => chunks.push(chunk));
    const closed = new Promise<boolean>(resolve => {
        const timeout = setTimeout(() => resolve(false), 1000);
        socket.on('close', () => {
            clearTimeout(timeout);
            resolve(true);
        });
    });

    return { socket, closed, received: () => Buffer.concat(chunks).toString() };
};

describe('connect-ws', () => {
    let receiver: ReturnType<typeof createHttpReceiver> | undefined;
    const sockets: net.Socket[] = [];
    const clients: WebSocket[] = [];

    const startServer = async (dependencies?: Partial<ExposeConnectWsParams>) => {
        receiver = createHttpReceiver({ logger, port: 0 });
        const startResult = await receiver.start();
        if (!startResult.success) throw new Error(startResult.message);
        exposeConnectWs({
            httpReceiver: receiver,
            logger,
            mainThreadEmitter: {} as ExposeConnectWsParams['mainThreadEmitter'],
            mainWindowProxy: {} as ExposeConnectWsParams['mainWindowProxy'],
            store: {} as ExposeConnectWsParams['store'],
            ...dependencies,
        });

        return startResult.payload.port;
    };

    const probe = (port: number, path: string, origin = 'https://probe.test') => {
        const upgrade = rawUpgrade(port, path, origin);
        sockets.push(upgrade.socket);

        return upgrade;
    };

    const openClient = async (port: number, origin: string) => {
        const client = new WebSocket(`ws://${LOOPBACK}:${port}/connect-ws`, { origin });
        clients.push(client);
        await new Promise((resolve, reject) => {
            client.on('open', resolve);
            client.on('error', reject);
        });

        return client;
    };

    afterEach(async () => {
        jest.clearAllMocks();
        sockets.splice(0).forEach(socket => socket.destroy());
        clients.splice(0).forEach(client => client.terminate());
        await receiver?.stop();
    });

    // `new URL()` used to throw on this target. Jest fails the test on any uncaught exception.
    it('closes an upgrade with a request target that new URL() rejects', async () => {
        const port = await startServer();
        const upgrade = probe(port, '//[');

        expect(await upgrade.closed).toBe(true);
        expect(upgrade.received()).toBe('');
    });

    it.each([
        ['per-origin', MAX_CONNECTIONS_PER_ORIGIN, () => 'https://same.test'],
        [
            'global',
            MAX_CONCURRENT_CONNECTIONS,
            (i: number) => `https://origin-${Math.floor(i / MAX_CONNECTIONS_PER_ORIGIN)}.test`,
        ],
    ] as const)(
        'closes an upgrade over the %s limit without a response',
        async (_, limit, originOf) => {
            const port = await startServer();
            for (let i = 0; i < limit; i++) {
                await openClient(port, originOf(i));
            }

            const upgrade = probe(port, '/connect-ws', originOf(limit));

            expect(await upgrade.closed).toBe(true);
            expect(upgrade.received()).toBe('');
        },
    );

    it('closes a connection whose handshake has no valid manifest', async () => {
        const client = await openClient(await startServer(), 'https://app.test');
        const firstEvent = new Promise<string>(resolve => {
            client.once('message', data => resolve(data.toString()));
            client.once('close', () => resolve('close'));
        });

        const manifest = { appUrl: 'https://app.test', email: 'dev@app.test' };
        client.send(
            JSON.stringify({ id: '1', type: POPUP.HANDSHAKE, payload: { settings: { manifest } } }),
        );

        expect(await firstEvent).toBe('close');
        expect(findProcessFromIncomingPort).not.toHaveBeenCalled();
    });

    describe('idle timeout', () => {
        beforeEach(() => {
            jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
        });

        afterEach(() => {
            jest.useRealTimers();
            jest.restoreAllMocks();
        });

        it('expires an idle connection, but not while a handshake is in progress', async () => {
            const errors = jest.spyOn(logger, 'error');
            const client = await openClient(await startServer(), 'https://app.test');
            expect(await request(client, handshake)).toMatchObject({ payload: 'ok' });
            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS - 500);

            // The client handshakes again before each call. Hold its process lookup past the
            // deadline that the first handshake set.
            const lookupStarted = createDeferred();
            const lookup = createDeferred<undefined>();
            jest.mocked(findProcessFromIncomingPort).mockImplementationOnce(() => {
                lookupStarted.resolve();

                return lookup.promise;
            });
            const ack = request(client, handshake);
            await lookupStarted.promise;
            await jest.advanceTimersByTimeAsync(500);
            lookup.resolve(undefined);
            expect(await ack).toMatchObject({ payload: 'ok' });

            // Pings, which the client sends on its own, do not keep the connection open.
            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS - 1_000);
            expect(await request(client, { type: 'ping' })).toMatchObject({ type: 'pong' });

            // Both lookups won their race, so the deadline each handshake armed was cancelled
            // and must not report a timeout, long after both have passed.
            expect(errors).not.toHaveBeenCalledWith(
                expect.anything(),
                'findProcessFromIncomingPort timed out',
            );
            await jest.advanceTimersByTimeAsync(1_000);
            expect(await request(client, { type: 'ping' })).toBeUndefined();
        });

        it('expires a connection whose process lookup never settles', async () => {
            const client = await openClient(await startServer(), 'https://app.test');
            expect(await request(client, handshake)).toMatchObject({ payload: 'ok' });

            // The handshake timeout is already cleared on an established connection, so only the
            // bound on the lookup itself can re-arm the idle timeout of a hung handshake.
            const lookupStarted = createDeferred();
            const hungLookup = createDeferred<undefined>();
            jest.mocked(findProcessFromIncomingPort).mockImplementationOnce(() => {
                lookupStarted.resolve();

                return hungLookup.promise;
            });
            const ack = request(client, handshake);
            await lookupStarted.promise;
            await jest.advanceTimersByTimeAsync(PROCESS_LOOKUP_TIMEOUT_MS);
            expect(await ack).toMatchObject({ payload: 'ok' });

            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS);
            expect(await request(client, { type: 'ping' })).toBeUndefined();
        });

        it('does not expire a connection while a call is pending', async () => {
            const rendererCall = createDeferred<{ id: string }>();
            const send = (_channel: string, call: { id: string }) => rendererCall.resolve(call);
            const port = await startServer({
                mainWindowProxy: {
                    getInstance: () => ({ webContents: { send } }),
                } as unknown as ExposeConnectWsParams['mainWindowProxy'],
                store: {
                    setConnectSettings: () => {},
                } as unknown as ExposeConnectWsParams['store'],
            });
            const client = await openClient(port, 'https://app.test');
            // Outside Linux, a call is dropped when no process is found on its port.
            const appProcess = { name: 'app', pid: '1', fullPath: '/app' };
            jest.mocked(findProcessFromIncomingPort).mockResolvedValueOnce(appProcess);
            expect(await request(client, handshake)).toMatchObject({ payload: 'ok' });
            void request(client, { type: CORE_CALL, payload: { method: 'getFeatures' } });
            const { id } = await rendererCall.promise;

            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS * 2);
            expect(await request(client, { type: 'ping' })).toMatchObject({ type: 'pong' });

            rejectMessage(id, new Error('Call failed'));
            await jest.advanceTimersByTimeAsync(IDLE_CONNECTION_TIMEOUT_MS);
            expect(await request(client, { type: 'ping' })).toBeUndefined();
        });
    });
});
