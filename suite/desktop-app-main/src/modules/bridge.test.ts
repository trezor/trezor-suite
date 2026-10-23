// Store IPC handlers registered by the module
const ipcHandlers: Record<string, (...args: any[]) => any> = {};

jest.mock('../ipcMain', () => ({
    ipcMain: {
        handle: (channel: string, handler: (...args: any[]) => any) => {
            ipcHandlers[channel] = handler;
        },
    },
}));

// A utility process cannot be forked in a test, so the proxy the bridge runs behind is faked and
// its lifecycle observed through it.
const proxy = {
    running: false,
    run: jest.fn(() => {
        proxy.running = true;

        return Promise.resolve(true);
    }),
    watch: jest.fn(),
    request: jest.fn(() => Promise.resolve()),
    dispose: jest.fn(() => {
        proxy.running = false;
    }),
};

jest.mock('../libs/thread-proxy', () => ({
    ThreadProxy: jest.fn(() => proxy),
}));

import { init, initBackground } from './bridge';
import type { MessageSystemGate } from './message-system';
import type { Dependencies } from './module';

const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Lets the promise chains of the module settle; `setImmediate` is left unfaked for it, so that
// only the watcher interval is under the control of the fake timers.
const flushPromises = () => new Promise(resolve => setImmediate(resolve));

const initBridge = (isKillswitchActive: boolean) =>
    init({
        store: {} as Dependencies['store'],
        mainWindowProxy: {
            getInstance: () => undefined,
        } as unknown as Dependencies['mainWindowProxy'],
        mainThreadEmitter: { emit: jest.fn() } as unknown as Dependencies['mainThreadEmitter'],
        messageSystem: {
            getGate: () => ({ isKillswitchActive, killswitchMessageId: undefined }),
        } as unknown as Dependencies['messageSystem'],
        logger: logger as unknown as Dependencies['logger'],
    } as Dependencies);

// The gate is read by the module itself, so the fake is mutable and its subscribers are fired by
// the test, the way a later poll would.
const initBackgroundBridge = (isKillswitchActive: boolean) => {
    let gate: MessageSystemGate = { isKillswitchActive, killswitchMessageId: undefined };
    const listeners: ((gate: MessageSystemGate) => void)[] = [];

    const module = initBackground({
        store: {
            getBridgeSettings: () => ({}),
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
    });

    return {
        ...module,
        publishGate: async (nextIsKillswitchActive: boolean) => {
            gate = { isKillswitchActive: nextIsKillswitchActive, killswitchMessageId: undefined };
            listeners.forEach(listener => listener(gate));
            await flushPromises();
        },
    };
};

describe('bridge module', () => {
    it('does not toggle the bridge while the message system disabled it', async () => {
        initBridge(true);
        const toggle = ipcHandlers['bridge/toggle'];

        await expect(toggle?.()).resolves.toStrictEqual({
            success: false,
            error: 'DISABLED_BY_MESSAGE_SYSTEM',
        });
    });

    describe('background', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            proxy.running = false;
            jest.useFakeTimers({ doNotFake: ['setImmediate'] });
            // No external bridge: `status()` asks the one on 21328 over `fetch`.
            global.fetch = jest.fn(() => Promise.reject(new Error('Connection refused')));
        });

        afterEach(() => {
            jest.clearAllTimers();
            jest.useRealTimers();
        });

        it('starts neither the bridge nor its watcher while the message system disabled it, and starts both when a config drops the killswitch', async () => {
            const module = initBackgroundBridge(true);

            await module.onLoad();
            await flushPromises();

            expect(proxy.run).not.toHaveBeenCalled();
            expect(jest.getTimerCount()).toBe(0);

            await module.publishGate(false);

            expect(proxy.run).toHaveBeenCalledTimes(1);
            // The 30 s watcher, which only runs while the bridge may run at all.
            expect(jest.getTimerCount()).toBe(1);
        });

        it('stops the bridge and its watcher when the message system disables the app', async () => {
            const module = initBackgroundBridge(false);

            await module.onLoad();
            await flushPromises();
            expect(proxy.run).toHaveBeenCalledTimes(1);
            expect(jest.getTimerCount()).toBe(1);

            await module.publishGate(true);

            expect(proxy.dispose).toHaveBeenCalledTimes(1);
            // Nothing is left that could bring the bridge back up behind a closed gate.
            expect(jest.getTimerCount()).toBe(0);
        });
    });
});
