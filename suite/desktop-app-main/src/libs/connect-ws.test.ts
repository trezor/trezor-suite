import { EventEmitter } from 'events';
import { WebSocketServer } from 'ws';

import { CORE_CALL, CORE_CALL_CANCEL, POPUP } from '@trezor/connect';
import { findProcessFromIncomingPort } from '@trezor/node-utils';

import { initConnectPopupResponseHandler } from './connect-popup-messages';
import { exposeConnectWs } from './connect-ws';
import { Logger } from './logger';

const ipcHandlers: Record<string, (...args: any[]) => any> = {};

jest.mock('ws', () => ({
    WebSocketServer: jest.fn(() => new EventEmitter()),
}));

jest.mock('../ipcMain', () => ({
    ipcMain: {
        handle: (channel: string, handler: (...args: any[]) => any) => {
            ipcHandlers[channel] = handler;
        },
    },
}));

jest.mock('@trezor/node-utils', () => ({
    findProcessFromIncomingPort: jest.fn(),
}));

jest.mock('./process-icon', () => ({ getProcessIcon: jest.fn() }));

const logger = new Logger('mute');

const handshake = {
    id: '0',
    type: POPUP.HANDSHAKE,
    payload: {
        settings: {
            manifest: { appName: 'Test app', appUrl: 'https://example.com', email: 'a@b.c' },
        },
    },
};

const coreCall = { id: '1', type: CORE_CALL, payload: { method: 'getAddress' } };
const coreCallCancel = { id: '2', type: CORE_CALL_CANCEL, payload: {} };
const popupClosed = { id: '2', type: POPUP.CLOSED, payload: {} };

describe('connect-ws', () => {
    let server: EventEmitter;
    let rendererSend: jest.Mock;

    const getForwardedCalls = (): { id: string; connectionId?: string }[] =>
        rendererSend.mock.calls
            .filter(([channel]) => channel === 'connect-popup/call')
            .map(([, params]) => params);

    const getForwardedCancels = (): { connectionId?: string }[] =>
        rendererSend.mock.calls
            .filter(([channel]) => channel === 'connect-popup/cancel')
            .map(([, params]) => params);

    // Answers the renderer's nth forwarded call the way the renderer does, by echoing its id.
    const respondToForwardedCall = async (index: number, payload: string) => {
        const call = getForwardedCalls()[index];
        const handler = ipcHandlers['connect-popup/response'];
        if (!call || !handler) throw new Error(`no forwarded call ${index} to respond to`);

        await handler(undefined, { id: call.id, success: true, payload });
        await jest.advanceTimersByTimeAsync(0);
    };

    const connect = async () => {
        const ws = Object.assign(new EventEmitter(), { send: jest.fn() });
        server.emit('connection', ws, {
            socket: { remoteAddress: '127.0.0.1', remotePort: 12345 },
            headers: { origin: 'https://example.com' },
        });

        const send = async (message: object) => {
            ws.emit('message', Buffer.from(JSON.stringify(message)));
            await jest.advanceTimersByTimeAsync(0);
        };
        const getResponses = () =>
            ws.send.mock.calls
                .map(([data]) => JSON.parse(data))
                .filter(message => message.type !== POPUP.HANDSHAKE);
        const close = () => ws.emit('close');

        await send(handshake);

        return { send, getResponses, close };
    };

    beforeAll(() => {
        initConnectPopupResponseHandler(logger);
    });

    beforeEach(() => {
        jest.useFakeTimers();
        jest.mocked(findProcessFromIncomingPort).mockResolvedValue({
            name: 'App',
            pid: '1',
            fullPath: '/Applications/App.app',
        });
        rendererSend = jest.fn();

        // The Electron dependencies are only used through these methods in this test.
        const dependencies = {
            httpReceiver: { server: new EventEmitter() },
            mainThreadEmitter: { emit: jest.fn() },
            mainWindowProxy: { getInstance: () => ({ webContents: { send: rendererSend } }) },
            store: { setConnectSettings: jest.fn() },
            logger,
        } as unknown as Parameters<typeof exposeConnectWs>[0];

        exposeConnectWs(dependencies);
        server = jest.mocked(WebSocketServer).mock.results.at(-1)?.value;
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('delivers each response to its own connection when connections reuse a request id', async () => {
        const first = await connect();
        const second = await connect();
        await first.send(coreCall);
        await second.send(coreCall);

        await respondToForwardedCall(0, 'first');
        await respondToForwardedCall(1, 'second');

        expect(first.getResponses()).toEqual([{ id: '1', success: true, payload: 'first' }]);
        expect(second.getResponses()).toEqual([{ id: '1', success: true, payload: 'second' }]);

        first.close();
        second.close();
    });

    it('keeps a pending call when another connection with the same request id closes', async () => {
        const first = await connect();
        const second = await connect();
        await first.send(coreCall);
        await second.send(coreCall);

        first.close();
        await respondToForwardedCall(1, 'second');

        expect(second.getResponses()).toEqual([{ id: '1', success: true, payload: 'second' }]);

        second.close();
    });

    it('answers a request id that is already in flight on the same connection with an error', async () => {
        const client = await connect();
        await client.send(coreCall);
        await client.send(coreCall);

        expect(getForwardedCalls()).toHaveLength(1);
        expect(client.getResponses()).toEqual([
            { id: '1', success: false, payload: { error: 'Duplicate in-flight request id' } },
        ]);

        client.close();
    });

    it('tags each cancel with the connection it came from', async () => {
        const first = await connect();
        const second = await connect();
        await first.send(coreCall);
        await second.send(coreCall);

        await second.send(coreCallCancel);
        await first.send(popupClosed);
        first.close();

        const [firstCall, secondCall] = getForwardedCalls();
        expect(firstCall?.connectionId).not.toBe(secondCall?.connectionId);
        expect(getForwardedCancels().map(({ connectionId }) => connectionId)).toEqual([
            secondCall?.connectionId,
            firstCall?.connectionId,
            firstCall?.connectionId,
        ]);

        second.close();
    });
});
