import { TrezorConnect } from '../../..';

export const binanceGetAddress = async (api: TrezorConnect) => {
    // regular
    const singleAddress = await api.binanceGetAddress({ path: 'm/44' });
    if (singleAddress.success) {
        const { payload } = singleAddress;
        payload.address.toLowerCase();
        payload.path.map(a => a);
        payload.serializedPath.toLowerCase();
        // @ts-expect-error, payload is not a bundle
        payload.map(a => a);
    }

    // bundle
    const bundleAddress = await api.binanceGetAddress({ bundle: [{ path: 'm/44' }] });
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
    api.binanceGetAddress({
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
    api.binanceGetAddress();
    // @ts-expect-error
    api.binanceGetAddress({ useEmptyPassphrase: true });
    // @ts-expect-error
    api.binanceGetAddress({ path: 1 });
    // @ts-expect-error
    api.binanceGetAddress({ bundle: 1 });
};

export const binanceGetPublicKey = async (api: TrezorConnect) => {
    // regular
    const singlePK = await api.binanceGetPublicKey({ path: 'm/44' });
    if (singlePK.success) {
        const { payload } = singlePK;
        payload.path.filter(a => a);
        payload.serializedPath.toLowerCase();
        payload.publicKey.toLowerCase();
        // @ts-expect-error, payload is not a bundle
        payload.filter(a => a);
    }

    // bundle
    const bundlePK = await api.binanceGetPublicKey({ bundle: [{ path: 'm/44' }] });
    if (bundlePK.success) {
        bundlePK.payload.forEach(item => {
            item.path.filter(a => a);
            item.serializedPath.toLowerCase();
            item.publicKey.toLowerCase();
        });
        // @ts-expect-error, payload is an array
        bundlePK.payload.publicKey.toLowerCase();
    } else {
        bundlePK.payload.error.toLowerCase();
    }
};

export const binanceSignTransaction = async (api: TrezorConnect) => {
    const sign = await api.binanceSignTransaction({
        path: 'm/44',
        transaction: {
            chain_id: 'Binance-Chain-Nile',
            account_number: 34,
            memo: 'test',
            sequence: 31,
            source: 1,
            transfer: {
                inputs: [
                    {
                        address: 'tbnb1hgm0p7khfk85zpz5v0j8wnej3a90w709zzlffd',
                        coins: [{ amount: 1000000000, denom: 'BNB' }],
                    },
                ],
                outputs: [
                    {
                        address: 'tbnb1ss57e8sa7xnwq030k2ctr775uac9gjzglqhvpy',
                        coins: [{ amount: 1000000000, denom: 'BNB' }],
                    },
                ],
            },
            placeOrder: {
                id: 'BA36F0FAD74D8F41045463E4774F328F4AF779E5-33',
                ordertype: 2,
                price: 100000000,
                quantity: 100000000,
                sender: 'tbnb1hgm0p7khfk85zpz5v0j8wnej3a90w709zzlffd',
                side: 1,
                symbol: 'ADA.B-B63_BNB',
                timeinforce: 1,
            },
            cancelOrder: {
                refid: 'BA36F0FAD74D8F41045463E4774F328F4AF779E5-29',
                sender: 'tbnb1hgm0p7khfk85zpz5v0j8wnej3a90w709zzlffd',
                symbol: 'BCHSV.B-10F_BNB',
            },
        },
    });

    if (sign.success) {
        const { payload } = sign;
        payload.public_key.toLowerCase();
        payload.signature.toLowerCase();
    }
};
