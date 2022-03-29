import { TrezorConnect } from '../../..';

export const rippleGetAddress = async (api: TrezorConnect) => {
    // regular
    const singleAddress = await api.rippleGetAddress({ path: 'm/44' });

    if (singleAddress.success) {
        const { payload } = singleAddress;
        payload.address.toLowerCase();
        payload.path.map(a => a);
        payload.serializedPath.toLowerCase();
        // @ts-expect-error, payload is not a bundle
        payload.map(a => a);
    }

    // bundle
    const bundleAddress = await api.rippleGetAddress({ bundle: [{ path: 'm/44' }] });

    if (bundleAddress.success) {
        bundleAddress.payload.forEach(item => {
            item.address.toLowerCase();
            item.path.map(a => a);
            item.serializedPath.toLowerCase();
        });
        // @ts-expect-error, payload is an array
        bundleAddress.payload.address.toLowerCase();
    } else {
        bundleAddress.payload.error.toLowerCase();
    }

    // with all possible params
    api.rippleGetAddress({
        device: {
            path: '1',
            instance: 1,
            state: 'state@device-id:1',
        },
        useEmptyPassphrase: true,
        allowSeedlessDevice: false,
        keepSession: false,
        skipFinalReload: false,
        path: 'm/44',
        address: 'a',
        showOnTrezor: true,
    });

    // with invalid params
    // @ts-expect-error
    api.rippleGetAddress();
    // @ts-expect-error
    api.rippleGetAddress({ coin: 'btc' });
    // @ts-expect-error
    api.rippleGetAddress({ path: 1 });
    // @ts-expect-error
    api.rippleGetAddress({ bundle: 1 });
};

export const rippleSignTransaction = async (api: TrezorConnect) => {
    const sign = await api.rippleSignTransaction({
        path: 'm/44',
        transaction: {
            payment: {
                amount: '100',
                destination: '1',
                destinationTag: 1,
            },
            fee: '1',
            flags: 1,
            sequence: 1,
            maxLedgerVersion: 1,
        },
    });

    if (sign.success) {
        const { payload } = sign;
        payload.serializedTx.toLowerCase();
        payload.signature.toLowerCase();
    }
};
