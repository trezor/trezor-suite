import { TrezorConnect } from '../../..';

export const tezosGetAddress = async (api: TrezorConnect) => {
    // regular
    const singleAddress = await api.tezosGetAddress({ path: 'm/44' });
    if (singleAddress.success) {
        const { payload } = singleAddress;
        payload.address.toLowerCase();
        payload.path.map(a => a);
        payload.serializedPath.toLowerCase();
        // @ts-expect-error, payload is not a bundle
        payload.map(a => a);
    }

    // bundle
    const bundleAddress = await api.tezosGetAddress({ bundle: [{ path: 'm/44' }] });
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
    api.tezosGetAddress({
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
    api.tezosGetAddress();
    // @ts-expect-error
    api.tezosGetAddress({ coin: 'btc' });
    // @ts-expect-error
    api.tezosGetAddress({ path: 1 });
    // @ts-expect-error
    api.tezosGetAddress({ bundle: 1 });
};

export const tezosGetPublicKey = async (api: TrezorConnect) => {
    // regular
    const singlePK = await api.tezosGetPublicKey({ path: 'm/44' });
    if (singlePK.success) {
        const { payload } = singlePK;
        payload.path.map(a => a);
        payload.serializedPath.toLowerCase();
        payload.publicKey.toLowerCase();
        // @ts-expect-error, payload is not a bundle
        payload.map(a => a);
    }

    // bundle
    const bundlePK = await api.tezosGetPublicKey({ bundle: [{ path: 'm/44' }] });
    if (bundlePK.success) {
        bundlePK.payload.forEach(item => {
            item.path.map(a => a);
            item.serializedPath.toLowerCase();
            item.publicKey.toLowerCase();
        });
        // @ts-expect-error, payload is an array
        bundlePK.payload.path.toLowerCase();
    } else {
        bundlePK.payload.error.toLowerCase();
    }
};

export const tezosSignTransaction = async (api: TrezorConnect) => {
    const sign = await api.tezosSignTransaction({
        path: "m/44'/1729'/10'",
        branch: 'BLGUkzwvguFu8ei8eLW3KgCbdtrMmv1UCqMvUpHHTGq1UPxypHS',
        operation: {
            transaction: {
                source: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
                destination: 'tz1Kef7BSg6fo75jk37WkKRYSnJDs69KVqt9',
                counter: 297,
                amount: 200000,
                fee: 10000,
                gas_limit: 44825,
                storage_limit: 0,
                parameters_manager: {
                    set_delegate: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
                    cancel_delegate: true,
                    transfer: {
                        amount: 200,
                        destination: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
                    },
                },
            },
            reveal: {
                source: 'tz1ekQapZCX4AXxTJhJZhroDKDYLHDHegvm1',
                counter: 575424,
                fee: 10000,
                gas_limit: 20000,
                storage_limit: 0,
                public_key: 'edpkuTPqWjcApwyD3VdJhviKM5C13zGk8c4m87crgFarQboF3Mp56f',
            },
            origination: {
                source: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
                balance: 100000,
                fee: 20000,
                counter: 298,
                gas_limit: 20000,
                storage_limit: 10000,
                script: '0000001c02000000170500036805010368050202000000080316053d036d03420000000a010000000568656c6c6f',
            },
            delegation: {
                source: 'tz1Kef7BSg6fo75jk37WkKRYSnJDs69KVqt9',
                delegate: 'tz1UKmZhi8dhUX5a5QTfCrsH9pK4dt1dVfJo',
                fee: 20000,
                counter: 564565,
                gas_limit: 20000,
                storage_limit: 0,
            },
        },
    });

    if (sign.success) {
        const { payload } = sign;
        payload.sig_op_contents.toLowerCase();
        payload.signature.toLowerCase();
        payload.operation_hash.toLowerCase();
    }
};
