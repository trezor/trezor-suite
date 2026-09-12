import type { Transport } from '@trezor/transport-common';

const core = { handleMessage: jest.fn() };
const getOrInit = jest.fn(() => Promise.resolve(core));
const disposeCore = jest.fn();
let isCoreInitialized = false;

jest.mock('@trezor/connect-core/src/core', () => ({
    initCoreState: () => ({
        get: () => (isCoreInitialized ? core : undefined),
        getPending: () => undefined,
        getOrInit: (...args: unknown[]) => {
            isCoreInitialized = true;

            return getOrInit(...(args as []));
        },
        dispose: () => disposeCore(),
    }),
}));

jest.mock('@trezor/connect-core/src/backend/BlockchainLink', () => ({
    updateProxy: jest.fn(() => Promise.resolve()),
}));

jest.mock('usb', () => ({ WebUSB: class {} }));

import TrezorConnect, { TRANSPORT } from './index';

const manifest = { email: 'info@trezor.io', appUrl: 'https://trezor.io', appName: 'Test App' };

const initTransports = () =>
    (getOrInit.mock.calls[0] as unknown as [{ transports: Transport[] }])[0].transports;

const transportNames = (transports: Transport[]) => transports.map(transport => transport.name);

const createFakeTransport = () => ({ name: 'FakeTransport' }) as unknown as Transport;

describe('@trezor/connect node entry point', () => {
    beforeEach(() => {
        isCoreInitialized = false;
        jest.clearAllMocks();
        TrezorConnect.dispose();
    });

    it('exposes the privileged api', () => {
        expect(typeof TrezorConnect.init).toBe('function');
        expect(typeof TrezorConnect.call).toBe('function');
        expect(typeof TrezorConnect.uiResponse).toBe('function');
        expect(typeof TrezorConnect.cancel).toBe('function');
        expect(typeof TrezorConnect.dispose).toBe('function');
        expect(typeof TrezorConnect.updateConnectSettings).toBe('function');
        expect(typeof TrezorConnect.getFeatures).toBe('function');
        expect(typeof TrezorConnect.signTransaction).toBe('function');
        expect(TRANSPORT.SET_TRANSPORTS).toBeTruthy();
    });

    it('supplies the node defaults when no transports are passed', async () => {
        await TrezorConnect.init({ manifest });

        expect(transportNames(initTransports())).toEqual(['BridgeTransport', 'NodeUsbTransport']);
    });

    it('supplies the node defaults for an empty transport list', async () => {
        await TrezorConnect.init({ manifest, transports: [] });

        expect(transportNames(initTransports())).toEqual(['BridgeTransport', 'NodeUsbTransport']);
    });

    it('keeps an explicit transport list untouched', async () => {
        const transport = createFakeTransport();
        await TrezorConnect.init({ manifest, transports: [transport] });

        expect(initTransports()).toEqual([transport]);
    });

    it('passes the manifest-derived id and the injected logger to the defaults', async () => {
        const logger = { debug: jest.fn(), log: jest.fn(), warn: jest.fn(), error: jest.fn() };
        const createLogger = jest.fn(() => logger as never);
        await TrezorConnect.init({ manifest, createLogger });

        expect(createLogger).toHaveBeenCalledWith('@trezor/transport');
        // `id` is protected on AbstractTransport; it is the bridge session owner shown to the user.
        expect(
            initTransports().map(transport => (transport as unknown as { id: string }).id),
        ).toEqual(['Test App', 'Test App']);
    });

    it('works without a logger factory', async () => {
        await expect(TrezorConnect.init({ manifest })).resolves.toBeUndefined();
    });

    it('restores the node defaults when reconfigured with an empty list', async () => {
        await TrezorConnect.init({ manifest, transports: [createFakeTransport()] });
        await TrezorConnect.updateConnectSettings({ transports: [] });

        const [{ type, payload }] = core.handleMessage.mock.calls.at(-1) as [
            { type: string; payload: { transports: Transport[] } },
        ];
        expect(type).toBe(TRANSPORT.SET_TRANSPORTS);
        expect(transportNames(payload.transports)).toEqual(['BridgeTransport', 'NodeUsbTransport']);
    });

    it('leaves transports untouched when an update omits them', async () => {
        await TrezorConnect.init({ manifest });
        await TrezorConnect.updateConnectSettings({ enabledNetworks: [{ coin: 'btc' }] });

        expect(core.handleMessage).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: TRANSPORT.SET_TRANSPORTS }),
        );
    });

    it('disposes the core only once it is initialized', async () => {
        TrezorConnect.dispose();
        expect(disposeCore).not.toHaveBeenCalled();

        await TrezorConnect.init({ manifest });
        TrezorConnect.dispose();
        expect(disposeCore).toHaveBeenCalledTimes(1);
    });
});
