const ipcHandlers: Record<string, (...args: any[]) => any> = {};

jest.mock('../ipcMain', () => ({
    ipcMain: {
        handle: (channel: string, handler: (...args: any[]) => any) => {
            ipcHandlers[channel] = handler;
        },
    },
}));

// A real server would bind 21335, so the receiver the module serves on is faked and its lifecycle
// observed through it.
const receiver = {
    start: jest.fn(() => Promise.resolve({ success: true, payload: { port: 21335 } })),
    stop: jest.fn(() => Promise.resolve()),
    getInfo: jest.fn(() => ({ url: 'http://127.0.0.1:21335' })),
    on: jest.fn(),
    server: {},
};

jest.mock('../libs/http-receiver', () => ({
    createHttpReceiver: jest.fn(() => receiver),
}));

jest.mock('../libs/connect-ws', () => ({
    exposeConnectWs: jest.fn(),
}));

jest.mock('../libs/connect-popup-messages', () => ({
    initConnectPopupResponseHandler: jest.fn(),
}));

jest.mock('@sentry/electron/main', () => ({
    captureMessage: jest.fn(),
}));

jest.mock('electron', () => ({
    app: { getVersion: () => '1.0.0', focus: jest.fn() },
}));

import { initBackground } from './http-receiver';
import type { MessageSystemGate } from './message-system';
import type { Dependencies } from './module';

const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// The gate is read by the module itself, so the fake is mutable and its subscribers are fired by
// the test, the way a later poll would.
const initHttpReceiver = (isKillswitchActive: boolean) => {
    let gate: MessageSystemGate = { isKillswitchActive, killswitchMessageId: undefined };
    const listeners: ((gate: MessageSystemGate) => void)[] = [];

    const module = initBackground({
        store: {
            getConnectSettings: () => ({ disableWs: true }),
        } as unknown as Dependencies['store'],
        mainWindowProxy: {
            getInstance: () => undefined,
        } as unknown as Dependencies['mainWindowProxy'],
        mainThreadEmitter: { emit: jest.fn() } as unknown as Dependencies['mainThreadEmitter'],
        messageSystem: {
            getGate: () => gate,
            subscribe: (listener: (gate: MessageSystemGate) => void) => {
                listeners.push(listener);

                return () => {};
            },
        } as unknown as Dependencies['messageSystem'],
        logger: logger as unknown as Dependencies['logger'],
    } as Dependencies);

    return {
        ...module,
        publishGate: async (nextIsKillswitchActive: boolean) => {
            gate = { isKillswitchActive: nextIsKillswitchActive, killswitchMessageId: undefined };
            listeners.forEach(listener => listener(gate));
            await new Promise(resolve => setImmediate(resolve));
        },
    };
};

describe('http-receiver module', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('does not start the server while the message system disabled the app, and starts it when a config drops the killswitch', async () => {
        const module = initHttpReceiver(true);

        await expect(module.onLoad()).resolves.toStrictEqual({ url: null });
        expect(receiver.start).not.toHaveBeenCalled();

        await module.publishGate(false);

        expect(receiver.start).toHaveBeenCalledTimes(1);
    });

    it('stops the server when the message system disables the app', async () => {
        const module = initHttpReceiver(false);
        await module.onLoad();
        expect(receiver.start).toHaveBeenCalledTimes(1);

        await module.publishGate(true);

        expect(receiver.stop).toHaveBeenCalledTimes(1);
    });
});
