import type { TrezorConnectPrivilegedAPI as TrezorConnect } from '../../index';

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
    const settings = await api.updateConnectSettings({ transports: [] });
    if (settings.success) {
        settings.payload.message.toLowerCase();
    } else {
        settings.error.message.toLowerCase();
    }
    // @ts-expect-error - the proxy is a setting of TrezorBlockchain
    api.updateConnectSettings({ proxy: { uri: 'socks://localhost:9050' } });

    // transports settings — strings are no longer accepted; only pre-built
    // Transport instances (pure DI). An empty array is still valid.
    api.updateConnectSettings({ transports: [] });
    // @ts-expect-error - string transport names are no longer valid
    api.updateConnectSettings({ transports: ['BridgeTransport'] });
    // @ts-expect-error - string transport names are no longer valid
    api.updateConnectSettings({ transports: ['BridgeTransport', 'WebUsbTransport'] });

    // empty object is valid (no-op)
    api.updateConnectSettings({});

    // @ts-expect-error - params are required
    api.updateConnectSettings();
};
