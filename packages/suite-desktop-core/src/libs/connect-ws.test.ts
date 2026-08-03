import { EventEmitter } from 'events';

import { CORE_CALL, CORE_CALL_CANCEL, POPUP } from '@trezor/connect';

import { exposeConnectWs } from './connect-ws';

// Capture the WebSocketServer instance created inside exposeConnectWs so the test
// can drive the 'connection' handler directly (the real upgrade path is stubbed).
jest.mock('ws', () => {
    const { EventEmitter: NodeEventEmitter } = require('events');

    class MockWebSocketServer extends NodeEventEmitter {
        handleUpgrade = jest.fn();
        constructor() {
            super();
            (global as any).__mockConnectWss = this;
        }
    }

    return { WebSocketServer: MockWebSocketServer };
});

jest.mock('@trezor/node-utils', () => ({
    findProcessFromIncomingPort: jest
        .fn()
        .mockResolvedValue({ name: 'dapp', fullPath: '/opt/dapp', warning: false }),
}));

jest.mock('./process-icon', () => ({
    getProcessIcon: jest.fn().mockResolvedValue(undefined),
}));

// addMessage arms a 5-min setTimeout and returns a never-resolving deferred here so a
// CORE_CALL parks in `connectionPendingMessages` (which is exactly the pending state the
// cancel guard checks) without leaking a real timer.
jest.mock('./connect-popup-messages', () => ({
    addMessage: jest.fn(() => ({
        promise: new Promise(() => {}),
        resolve: jest.fn(),
        reject: jest.fn(),
    })),
    deleteMessage: jest.fn(),
    setAppInit: jest.fn(),
}));

const tick = () => new Promise(resolve => setImmediate(resolve));

const makeReq = () => ({
    socket: { remoteAddress: '127.0.0.1', remotePort: 5555 },
    headers: { origin: 'https://dapp.example' },
});

const makeWs = () => {
    const ws: any = new EventEmitter();
    ws.send = jest.fn();
    ws.close = jest.fn();

    return ws;
};

describe('connect-ws cancel authorization', () => {
    let webContentsSend: jest.Mock;
    let mainWindowProxy: any;

    const setup = () => {
        webContentsSend = jest.fn();
        mainWindowProxy = {
            getInstance: jest.fn(() => ({ webContents: { send: webContentsSend } })),
        };

        exposeConnectWs({
            mainThreadEmitter: { emit: jest.fn() } as any,
            mainWindowProxy,
            httpReceiver: { server: { on: jest.fn() } } as any,
            store: { setConnectSettings: jest.fn() } as any,
        });

        return (global as any).__mockConnectWss as EventEmitter;
    };

    beforeEach(() => {
        (global as any).logger = { info: jest.fn(), error: jest.fn(), debug: jest.fn() };
    });

    it('ignores a CORE_CALL_CANCEL from a connection that never issued a call', async () => {
        const wss = setup();
        const ws = makeWs();
        wss.emit('connection', ws, makeReq());

        ws.emit(
            'message',
            JSON.stringify({ id: '1', type: CORE_CALL_CANCEL, payload: { callId: 'victim' } }),
        );
        await tick();

        expect(webContentsSend).not.toHaveBeenCalledWith('connect-popup/cancel', expect.anything());
    });

    it('ignores a POPUP.CLOSED from a connection that never issued a call', async () => {
        const wss = setup();
        const ws = makeWs();
        wss.emit('connection', ws, makeReq());

        ws.emit(
            'message',
            JSON.stringify({ id: '1', type: POPUP.CLOSED, payload: { callId: 'victim' } }),
        );
        await tick();

        expect(webContentsSend).not.toHaveBeenCalledWith('connect-popup/cancel', expect.anything());
    });

    it('forwards a CORE_CALL_CANCEL from a connection that has an in-flight call', async () => {
        const wss = setup();
        const ws = makeWs();
        wss.emit('connection', ws, makeReq());

        // Handshake so processOnPort + manifest are resolved.
        ws.emit(
            'message',
            JSON.stringify({
                id: '1',
                type: POPUP.HANDSHAKE,
                payload: {
                    settings: {
                        manifest: {
                            appName: 'Dapp',
                            appUrl: 'https://dapp.example',
                            email: 'dev@dapp.example',
                        },
                        version: '1.0.0',
                    },
                },
            }),
        );
        await tick();
        await tick();

        // A real CORE_CALL parks in connectionPendingMessages (deferred never resolves).
        ws.emit(
            'message',
            JSON.stringify({ id: '2', type: CORE_CALL, payload: { method: 'getAddress' } }),
        );
        await tick();
        await tick();

        webContentsSend.mockClear();

        ws.emit(
            'message',
            JSON.stringify({
                id: '3',
                type: CORE_CALL_CANCEL,
                payload: { reason: 'user', callId: 'c' },
            }),
        );
        await tick();

        expect(webContentsSend).toHaveBeenCalledWith('connect-popup/cancel', {
            error: 'user',
            callId: 'c',
        });
    });
});
