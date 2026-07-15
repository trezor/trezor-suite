import type { TrezorConnectPrivilegedAPI as TrezorConnect } from '../../..';

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

    // transports settings — strings are no longer accepted; only pre-built
    // Transport instances (pure DI). An empty array is still valid.
    api.updateConnectSettings({ transports: [] });
    // @ts-expect-error - string transport names are no longer valid
    api.updateConnectSettings({ transports: ['BridgeTransport'] });
    // @ts-expect-error - string transport names are no longer valid
    api.updateConnectSettings({ transports: ['BridgeTransport', 'WebUsbTransport'] });

    // both proxy and transports together
    api.updateConnectSettings({
        proxy: { uri: 'socks://localhost:9050' },
        transports: [],
    });

    // empty object is valid (no-op)
    api.updateConnectSettings({});

    // @ts-expect-error - params are required
    api.updateConnectSettings();
};
