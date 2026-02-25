import { TrezorConnect } from '../../..';

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
    const proxy = await api.updateConnectSettings({ proxy: 'socks://localhost:9050' });
    if (proxy.success) {
        proxy.payload.message.toLowerCase();
    } else {
        proxy.error.message.toLowerCase();
    }
    api.updateConnectSettings({
        proxy: {
            type: 5,
            host: 'localhost',
            port: 9050,
            username: 'johndoe',
            timeout: 100000,
        },
    });
    api.updateConnectSettings({ proxy: 'socks://localhost:9050' });
    api.updateConnectSettings({ proxy: undefined });

    // transports settings
    api.updateConnectSettings({ transports: ['BridgeTransport'] });
    api.updateConnectSettings({ transports: ['BridgeTransport', 'WebUsbTransport'] });
    api.updateConnectSettings({ transports: [] });
    // @ts-expect-error - invalid transport name
    api.updateConnectSettings({ transports: ['InvalidTransport'] });

    // both proxy and transports together
    api.updateConnectSettings({ proxy: 'socks://localhost:9050', transports: ['BridgeTransport'] });

    // empty object is valid (no-op)
    api.updateConnectSettings({});

    // @ts-expect-error - params are required
    api.updateConnectSettings();
};
