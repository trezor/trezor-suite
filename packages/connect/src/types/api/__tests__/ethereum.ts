import { TrezorConnect } from '../../..';

export const ethereumGetAddress = async (api: TrezorConnect) => {
    // regular
    const singleAddress = await api.ethereumGetAddress({ path: 'm/44' });

    if (singleAddress.success) {
        const { payload } = singleAddress;
        payload.address.toLowerCase();
        payload.path.map(a => a);
        payload.serializedPath.toLowerCase();
        // @ts-expect-error, payload is not a bundle
        payload.map(a => a);
    }

    // bundle
    const bundleAddress = await api.ethereumGetAddress({ bundle: [{ path: 'm/44' }] });
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
    api.ethereumGetAddress({
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
        address: '0x',
        showOnTrezor: true,
    });

    // with invalid params
    // @ts-expect-error
    api.ethereumGetAddress();
    // @ts-expect-error
    api.ethereumGetAddress({ coin: 'btc' });
    // @ts-expect-error
    api.ethereumGetAddress({ path: 1 });
    // @ts-expect-error
    api.ethereumGetAddress({ bundle: 1 });
};

export const ethereumGetPublicKey = async (api: TrezorConnect) => {
    // regular
    const singlePK = await api.ethereumGetPublicKey({ path: 'm/44' });

    if (singlePK.success) {
        const { payload } = singlePK;
        payload.path.map(a => a);
        payload.serializedPath.toLowerCase();
        payload.xpub.toLowerCase();
        payload.chainCode.toLowerCase();
        payload.childNum.toFixed();
        payload.publicKey.toLowerCase();
        payload.fingerprint.toFixed();
        payload.depth.toFixed();
        // @ts-expect-error, payload is not a bundle
        payload.map(a => a);
    }

    // bundle
    const bundlePK = await api.ethereumGetPublicKey({ bundle: [{ path: 'm/44' }] });
    if (bundlePK.success) {
        bundlePK.payload.forEach(item => {
            item.path.map(a => a);
            item.serializedPath.toLowerCase();
            item.xpub.toLowerCase();
            item.chainCode.toLowerCase();
            item.childNum.toFixed();
            item.publicKey.toLowerCase();
            item.fingerprint.toFixed();
            item.depth.toFixed();
        });
        // @ts-expect-error, payload is an array
        bundlePK.payload.address.toLowerCase();
    } else {
        bundlePK.payload.error.toLowerCase();
    }
};

export const ethereumSignTransaction = async (api: TrezorConnect) => {
    const sign = await api.ethereumSignTransaction({
        path: 'm/44',
        transaction: {
            nonce: '0x0',
            gasPrice: '0x14',
            gasLimit: '0x14',
            to: '0xd0d6d6c5fe4a677d343cc433536bb717bae167dd',
            chainId: 1,
            value: '0x0',
            data: '0xa',
        },
    });

    if (sign.success) {
        const { payload } = sign;
        payload.r.toLowerCase();
        payload.s.toLowerCase();
        payload.v.toLowerCase();
    }

    // eip1559 transaction
    api.ethereumSignTransaction({
        path: 'm/44',
        transaction: {
            nonce: '0x0',
            maxFeePerGas: '0x14',
            maxPriorityFeePerGas: '0x0',
            gasLimit: '0x14',
            to: '0xd0d6d6c5fe4a677d343cc433536bb717bae167dd',
            chainId: 1,
            value: '0x0',
            data: '0xa',
            accessList: [{ address: '0', storageKeys: [] }],
        },
    });

    api.ethereumSignTransaction({
        path: 'm/44',
        // @ts-expect-error: combined gasPrice + maxFeePerGas
        transaction: {
            nonce: '0x0',
            maxFeePerGas: '0x14',
            maxPriorityFeePerGas: '0x0',
            gasPrice: '0x0',
            gasLimit: '0x14',
            to: '0xd0d6d6c5fe4a677d343cc433536bb717bae167dd',
            chainId: 1,
            value: '0x0',
            data: '0xa',
            accessList: [{ address: '0', storageKeys: [] }],
        },
    });
};

export const signVerifyMessage = async (api: TrezorConnect) => {
    const sign = await api.ethereumSignMessage({
        path: 'm/44',
        message: 'foo',
        hex: false,
    });
    if (sign.success) {
        const { payload } = sign;
        payload.address.toLowerCase();
        payload.signature.toLowerCase();
    }
    const verify = await api.ethereumVerifyMessage({
        address: 'a',
        signature: 'a',
        message: 'foo',
        hex: false,
    });
    if (verify.success) {
        const { payload } = verify;
        payload.message.toLowerCase();
    }
};

export const signTypedData = async (api: TrezorConnect) => {
    const sign = await api.ethereumSignTypedData({
        path: 'm/44',
        data: {
            types: {
                EIP712Domain: [
                    {
                        name: 'name',
                        type: 'string',
                    },
                    {
                        name: 'version',
                        type: 'string',
                    },
                    {
                        name: 'chainId',
                        type: 'uint256',
                    },
                    {
                        name: 'verifyingContract',
                        type: 'address',
                    },
                    {
                        name: 'salt',
                        type: 'bytes32',
                    },
                ],
                Message: [
                    {
                        name: 'Test Field',
                        type: 'string',
                    },
                ],
            },
            primaryType: 'Message',
            domain: {
                name: 'example.metamask.io',
                version: '1',
                chainId: 1,
                verifyingContract: '0x0000000000000000000000000000000000000000',
                salt: new Int32Array([1, 2, 3]).buffer,
            },
            message: {
                'Test Field': 'Hello World',
            },
        },
        metamask_v4_compat: true,
    });

    if (sign.success) {
        const { payload } = sign;
        payload.address.toLowerCase();
        payload.signature.toLowerCase();
    }

    await api.ethereumSignTypedData({
        path: 'm/44',
        metamask_v4_compat: true,
        data: {
            types: { EIP712Domain: [] },
            primaryType: 'EIP712Domain',
            domain: {},
            message: {},
        },
        message_hash: '0x',
        domain_separator_hash: '0x',
    });

    await api.ethereumSignTypedData({
        path: 'm/44',
        metamask_v4_compat: true,
        data: {
            types: { EIP712Domain: [] },
            // @ts-expect-error: primaryType not in `types`
            primaryType: 'UnknownType',
            domain: {},
            message: {},
        },
        // @ts-expect-error: incorrect type for message_hash
        message_hash: 12345,
        domain_separator_hash: '0x',
    });
};
