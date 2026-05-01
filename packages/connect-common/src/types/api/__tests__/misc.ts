import type { Transport } from '@trezor/transport';

import type { TrezorConnect } from '../../..';

export const cipherKeyValue = async (api: TrezorConnect) => {
    const kv = await api.cipherKeyValue({
        path: 'm/44',
        key: 'key',
        value: 'hash',
        askOnEncrypt: true,
        askOnDecrypt: false,
        iv: 'advanced',
    });
    if (kv.success) {
        kv.payload.value.toLowerCase();
    }

    // bundle
    const bundleKV = await api.cipherKeyValue({
        bundle: [{ path: 'm/44', key: 'key', value: 'hash' }],
    });

    if (bundleKV.success) {
        bundleKV.payload.forEach(item => {
            item.value.toLowerCase();
        });
        // @ts-expect-error
        bundleKV.payload.xpub.toLowerCase();
    } else {
        bundleKV.error.message.toLowerCase();
    }
};

export const updateConnectSettings = async (api: TrezorConnect) => {
    // proxy settings
    const proxy = await api.updateConnectSettings({ proxy: { uri: 'socks://localhost:9050' } });
    if (proxy.success) {
        proxy.payload.message.toLowerCase();
    } else {
        proxy.error.message.toLowerCase();
    }

    const type = 5;
    const host = 'localhost';
    const port = 9050;
    const username = 'johndoe';
    api.updateConnectSettings({
        proxy: {
            uri: `socks${type}://${username}@${host}:${port}`,
            opts: { timeout: 100000 },
        },
    });
    api.updateConnectSettings({ proxy: { uri: 'socks://localhost:9050' } });
    api.updateConnectSettings({ proxy: undefined });

    // transports settings — instances or constructors of Transport
    const fakeTransport = {} as Transport;
    const FakeTransportCtor = class {} as unknown as new (...args: unknown[]) => Transport;
    api.updateConnectSettings({ transports: [fakeTransport] });
    api.updateConnectSettings({ transports: [fakeTransport, FakeTransportCtor] });
    api.updateConnectSettings({ transports: [] });
    // @ts-expect-error - plain string is not a Transport
    api.updateConnectSettings({ transports: ['InvalidTransport'] });

    // serializable id form (for IPC boundaries)
    api.updateConnectSettings({ transportIds: ['BridgeTransport'] });
    api.updateConnectSettings({ transportIds: [] });

    // both proxy and transports together
    api.updateConnectSettings({
        proxy: { uri: 'socks://localhost:9050' },
        transports: [fakeTransport],
    });

    // empty object is valid (no-op)
    api.updateConnectSettings({});

    // @ts-expect-error - params are required
    api.updateConnectSettings();
};
