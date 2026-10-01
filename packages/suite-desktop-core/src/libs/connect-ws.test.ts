import { EventEmitter } from 'events';
import { WebSocketServer } from 'ws';

import { CORE_CALL, type Manifest, POPUP, type PopupHandshake } from '@trezor/connect';
import { findProcessFromIncomingPort } from '@trezor/node-utils';
import { type Deferred, createDeferred } from '@trezor/utils';

import { addMessage } from './connect-popup-messages';
import { exposeConnectWs } from './connect-ws';

jest.mock('ws', () => ({
    WebSocketServer: jest.fn(() => new EventEmitter()),
}));

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect-common/src/events/core-call'),
    ...jest.requireActual('@trezor/connect-common/src/events/popup'),
}));

jest.mock('@trezor/node-utils', () => ({
    findProcessFromIncomingPort: jest.fn(),
}));

jest.mock('@trezor/env-utils', () => ({ isLinux: () => true }));

jest.mock('@trezor/utils', () => ({
    ...jest.requireActual('@trezor/utils/src/createDeferred'),
    ...jest.requireActual('@trezor/utils/src/resolveAfter'),
}));

jest.mock('./connect-popup-messages', () => ({
    addMessage: jest.fn(),
    deleteMessage: jest.fn(),
    setAppInit: jest.fn(),
}));

jest.mock('./process-icon', () => ({ getProcessIcon: jest.fn() }));

const manifest: Manifest = {
    appName: 'Test app',
    appUrl: 'https://example.com',
    email: 'test@example.com',
};

const handshake: PopupHandshake = {
    type: POPUP.HANDSHAKE,
    payload: { settings: { manifest, version: '10.0.0' } },
};

describe('Connect WebSocket connection lifetime', () => {
    const originalLogger = global.logger;
    let server: EventEmitter;
    let responses: Deferred<{ success: boolean }>[];

    const connect = () => {
        const ws = Object.assign(new EventEmitter(), { send: jest.fn() });
        const socket = {
            remoteAddress: '127.0.0.1',
            remotePort: 12345,
            destroyed: false,
            destroy: jest.fn(() => {
                socket.destroyed = true;
                ws.emit('close');
            }),
        };
        server.emit('connection', ws, { socket, headers: { origin: 'https://example.com' } });

        const send = async (message: object, id = '1') => {
            ws.emit('message', Buffer.from(JSON.stringify({ id, ...message })));
            await jest.advanceTimersByTimeAsync(0);
        };

        return { ws, socket, send };
    };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        responses = [];
        jest.mocked(findProcessFromIncomingPort).mockResolvedValue(undefined);
        jest.mocked(addMessage).mockImplementation(() => {
            const response = createDeferred<{ success: boolean }>();
            responses.push(response);

            return response;
        });
        global.logger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            exit: jest.fn(),
            getLog: () => [],
            level: 'debug',
            config: {
                colors: false,
                writeToConsole: false,
                writeToDisk: false,
                outputFile: '',
                outputPath: '',
                logFormat: '',
                dedupeTimeout: 0,
                memoryCap: 0,
            },
        };

        // The Electron dependencies are only used through these methods in this test.
        const dependencies = {
            httpReceiver: { server: new EventEmitter() },
            mainThreadEmitter: { emit: jest.fn() },
            mainWindowProxy: { getInstance: () => ({ webContents: { send: jest.fn() } }) },
            store: { setConnectSettings: jest.fn() },
        } as unknown as Parameters<typeof exposeConnectWs>[0];

        exposeConnectWs(dependencies);
        const result = jest.mocked(WebSocketServer).mock.results[0];
        if (!result) throw new Error('WebSocket server was not created');
        server = result.value;
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        global.logger = originalLogger;
    });

    it.each([undefined, {}, { email: manifest.email, appUrl: manifest.appUrl }])(
        'closes an invalid handshake without acknowledging it or looking up a process: %j',
        async invalidManifest => {
            const connection = connect();

            await connection.send({
                type: POPUP.HANDSHAKE,
                payload: { settings: { manifest: invalidManifest } },
            });

            expect(connection.socket.destroyed).toBe(true);
            expect(connection.ws.send).not.toHaveBeenCalled();
            expect(findProcessFromIncomingPort).not.toHaveBeenCalled();
        },
    );

    it('releases capacity after invalid handshakes', async () => {
        for (let index = 0; index < 50; index++) {
            await connect().send({ type: POPUP.HANDSHAKE, payload: { settings: {} } });
        }
        const connection = connect();
        await connection.send(handshake);

        expect(connection.socket.destroyed).toBe(false);
        expect(connection.ws.send).toHaveBeenCalledWith(
            JSON.stringify({ id: '1', type: POPUP.HANDSHAKE, payload: 'ok' }),
        );
    });

    it('expires idle connections even when pings and repeated handshakes are received', async () => {
        const connection = connect();
        await connection.send(handshake);
        await jest.advanceTimersByTimeAsync(59000);
        await connection.send({ type: 'ping' });
        await connection.send(handshake);
        expect(connection.socket.destroyed).toBe(false);

        await jest.advanceTimersByTimeAsync(1000);

        expect(connection.socket.destroyed).toBe(true);
    });

    it('releases capacity when valid handshakes are followed by no calls', async () => {
        for (let index = 0; index < 50; index++) {
            await connect().send(handshake);
        }
        await jest.advanceTimersByTimeAsync(60000);
        const connection = connect();
        await connection.send(handshake);

        expect(connection.socket.destroyed).toBe(false);
        expect(connection.ws.send).toHaveBeenCalled();
    });

    it('keeps pending calls alive and starts a fresh idle timeout after the last response', async () => {
        const connection = connect();
        await connection.send(handshake);
        await jest.advanceTimersByTimeAsync(59000);
        await connection.send({ type: CORE_CALL, payload: { method: 'getAddress' } }, '2');
        await connection.send({ type: CORE_CALL, payload: { method: 'getAddress' } }, '3');
        expect(responses).toHaveLength(2);
        await jest.advanceTimersByTimeAsync(120000);
        expect(connection.socket.destroyed).toBe(false);

        responses[0]?.resolve({ success: true });
        await jest.advanceTimersByTimeAsync(120000);
        expect(connection.socket.destroyed).toBe(false);

        responses[1]?.resolve({ success: true });
        await jest.advanceTimersByTimeAsync(59000);
        expect(connection.socket.destroyed).toBe(false);
        await jest.advanceTimersByTimeAsync(1000);
        expect(connection.socket.destroyed).toBe(true);
    });

    it('starts the idle timeout again after a call fails', async () => {
        const connection = connect();
        await connection.send(handshake);
        await connection.send({ type: CORE_CALL, payload: { method: 'getAddress' } }, '2');

        responses[0]?.reject(new Error('Call failed'));
        await jest.advanceTimersByTimeAsync(60000);

        expect(connection.socket.destroyed).toBe(true);
    });

    it('does not restart the idle timeout when a response arrives after disconnecting', async () => {
        const connection = connect();
        await connection.send(handshake);
        await connection.send({ type: CORE_CALL, payload: { method: 'getAddress' } }, '2');
        connection.socket.destroy();

        responses[0]?.resolve({ success: true });
        await jest.advanceTimersByTimeAsync(0);

        expect(jest.getTimerCount()).toBe(0);
    });

    it('does not start an idle timer if process lookup finishes after the connection closes', async () => {
        const lookup = createDeferred<undefined>();
        jest.mocked(findProcessFromIncomingPort).mockReturnValue(lookup.promise);
        const connection = connect();
        await connection.send(handshake);
        await jest.advanceTimersByTimeAsync(10000);
        expect(connection.socket.destroyed).toBe(true);

        lookup.resolve(undefined);
        await jest.advanceTimersByTimeAsync(0);

        expect(connection.ws.send).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
    });
});
