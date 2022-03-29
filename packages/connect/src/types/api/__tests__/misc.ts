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
        bundleKV.payload.error.toLowerCase();
    }
};

export const customMessage = async (api: TrezorConnect) => {
    const custom = await api.customMessage<{ message: string }>({
        messages: {},
        message: 'MyCustomSignTx',
        params: {
            inputs: { index: 1, hash: '0' },
        },
        callback: (request: any) => {
            if (request.type === 'MyCustomTxReq') {
                return Promise.resolve({
                    message: 'MyCustomTxAck',
                    params: {
                        index: 1,
                    },
                });
            }
            return Promise.resolve({ message: 'MyCustomSigned' });
        },
    });
    if (custom.success) {
        custom.payload.message.toLowerCase();
    }
};

// Method with mixed params
export const requestLogin = async (api: TrezorConnect) => {
    // async call
    const a = await api.requestLogin({
        callback: () => ({
            challengeHidden: 'a',
            challengeVisual: 'b',
        }),
    });

    if (a.success) {
        a.payload.address.toLowerCase();
        a.payload.publicKey.toLowerCase();
        a.payload.signature.toLowerCase();
        // @ts-expect-error
        a.payload.error.toLowerCase();
    } else {
        a.payload.error.toLowerCase();
        // @ts-expect-error
        a.payload.address.toLowerCase();
    }
    // sync call
    api.requestLogin({
        challengeHidden: 'a',
        challengeVisual: 'b',
    });

    // @ts-expect-error
    api.requestLogin();
    // @ts-expect-error
    api.requestLogin({ callback: 'string' });
    // @ts-expect-error
    api.requestLogin({ challengeHidden: 'a' });
    // @ts-expect-error
    api.requestLogin({ challengeVisual: 1 });
};

export const setProxy = async (api: TrezorConnect) => {
    const proxy = await api.setProxy({ proxy: 'socks://localhost:9050' });
    if (proxy.success) {
        proxy.payload.message.toLowerCase();
    } else {
        proxy.payload.error.toLowerCase();
    }
    api.setProxy({
        proxy: {
            type: 5,
            host: 'localhost',
            port: 9050,
            username: 'johndoe',
            timeout: 100000,
        },
        useOnionLinks: true,
    });
    api.setProxy({ proxy: 'socks://localhost:9050', useOnionLinks: true });
    api.setProxy({ proxy: undefined });

    // @ts-expect-error
    api.setProxy();
    // @ts-expect-error
    api.setProxy({});
    // @ts-expect-error
    api.setProxy();
};
