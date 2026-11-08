const HERE = '@trezor/connect-foreground-proxy';
const PEER = '@trezor/connect-service-worker-proxy';

const manifest = { appName: 'test', appUrl: 'https://example.com', email: 'test@example.com' };

const interrupted = {
    success: false,
    error: {
        code: 'Method_Interrupted',
        message: 'Popup closed',
    },
};

type Listener = (...args: any[]) => void;

const createListenerRegistry = () => {
    const listeners: Listener[] = [];

    return {
        listeners,
        addListener: (listener: Listener) => {
            listeners.push(listener);
        },
        removeListener: (listener: Listener) => {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        },
    };
};

type MockPort = {
    name: string;
    postMessage: jest.Mock;
    disconnect: jest.Mock;
    onMessage: ReturnType<typeof createListenerRegistry>;
    onDisconnect: ReturnType<typeof createListenerRegistry>;
};

const deliverFromPeer = (port: MockPort, message: Record<string, any>) =>
    [...port.onMessage.listeners].forEach(listener =>
        listener({ channel: { here: PEER, peer: HERE }, ...message }),
    );

/** whether the faked peer answers a channel-handshake-request, set before init() */
let peerConfirmsHandshake = true;

const createPort = (): MockPort => {
    const port: MockPort = {
        name: 'trezor-connect-proxy',
        postMessage: jest.fn((message: any) => {
            if (message.type === 'channel-handshake-request' && peerConfirmsHandshake) {
                // a real service worker answers asynchronously
                void Promise.resolve().then(() =>
                    deliverFromPeer(port, { type: 'channel-handshake-confirm' }),
                );
            }
        }),
        disconnect: jest.fn(),
        onMessage: createListenerRegistry(),
        onDisconnect: createListenerRegistry(),
    };

    return port;
};

let ports: MockPort[] = [];

const currentPort = () => {
    const port = ports.at(-1);
    if (!port) throw new Error('no port was opened');

    return port;
};

/** the service worker went away, which is what chrome.runtime signals via onDisconnect */
const disconnectPort = (port: MockPort) =>
    [...port.onDisconnect.listeners].forEach(listener => listener());

const flushMicrotasks = () => new Promise(resolve => setTimeout(resolve, 0));

const loadProxy = async () => (await import('./index')).default;

describe('connect-webextension proxy lifecycle', () => {
    beforeEach(() => {
        ports = [];
        peerConfirmsHandshake = true;
        (globalThis as any).chrome = {
            runtime: {
                connect: jest.fn(() => {
                    const port = createPort();
                    ports.push(port);

                    return port;
                }),
            },
        };
        jest.resetModules();
    });

    it('keeps a single reconnect listener when init() is called again', async () => {
        const TrezorConnect = await loadProxy();

        await TrezorConnect.init({ manifest });
        await TrezorConnect.init({ manifest });

        expect(ports).toHaveLength(1);
        expect(currentPort().onDisconnect.listeners).toHaveLength(1);
    });

    it('dispose() detaches the reconnect listener and settles calls in flight', async () => {
        const TrezorConnect = await loadProxy();
        await TrezorConnect.init({ manifest });
        const port = currentPort();

        const pending = TrezorConnect.call({ method: 'getFeatures' });
        await TrezorConnect.dispose();

        expect(port.onDisconnect.listeners).toHaveLength(0);
        expect(port.disconnect).toHaveBeenCalled();
        await expect(pending).resolves.toEqual(interrupted);
    });

    it('a port disconnect settles calls in flight and reconnects on a fresh port', async () => {
        const TrezorConnect = await loadProxy();
        await TrezorConnect.init({ manifest });
        const firstPort = currentPort();

        const pending = TrezorConnect.call({ method: 'getFeatures' });
        disconnectPort(firstPort);

        await expect(pending).resolves.toEqual(interrupted);
        await flushMicrotasks();

        expect(ports).toHaveLength(2);
        expect(currentPort()).not.toBe(firstPort);
        expect(currentPort().onDisconnect.listeners).toHaveLength(1);
    });
});
