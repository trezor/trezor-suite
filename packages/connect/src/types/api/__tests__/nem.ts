import { TrezorConnect, NEM } from '../../..';

export const nemGetAddress = async (api: TrezorConnect) => {
    // regular
    const singleAddress = await api.nemGetAddress({ path: 'm/44', network: 1 });

    if (singleAddress.success) {
        const { payload } = singleAddress;
        payload.address.toLowerCase();
        payload.path.map(a => a);
        payload.serializedPath.toLowerCase();
        // @ts-expect-error, payload is not a bundle
        payload.map(a => a);
    }

    // bundle
    const bundleAddress = await api.nemGetAddress({
        bundle: [{ path: 'm/44', network: 1 }],
    });

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
    api.nemGetAddress({
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
        network: 1,
        address: 'a',
        showOnTrezor: true,
    });

    // with invalid params
    // @ts-expect-error
    api.nemGetAddress();
    // @ts-expect-error
    api.nemGetAddress({ coin: 'btc' });
    // @ts-expect-error
    api.nemGetAddress({ path: 1 });
    // @ts-expect-error
    api.nemGetAddress({ bundle: 1 });
};

export const nemSignTransaction = async (api: TrezorConnect) => {
    const common = {
        version: NEM.TxVersion.testnet,
        timeStamp: 74649215,
        fee: 2000000,
        deadline: 74735615,
        signer: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
    };
    const sign = await api.nemSignTransaction({
        path: 'm/44',
        transaction: {
            ...common,
            type: NEM.TxType.TRANSFER,
            recipient: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
            amount: 2000000,
            message: {
                payload: '746573745f6e656d5f7472616e73616374696f6e5f7472616e73666572',
                type: 1,
            },
        },
    });

    if (sign.success) {
        const { payload } = sign;
        payload.data.toLowerCase();
        payload.signature.toLowerCase();
    }

    api.nemSignTransaction({
        path: 'm/44',
        transaction: {
            ...common,
            type: NEM.TxType.AGGREGATE_MODIFICATION,
            modifications: [
                {
                    modificationType: 1,
                    cosignatoryAccount:
                        'c5f54ba980fcbb657dbaaa42700539b207873e134d2375efeab5f1ab52f87844',
                },
            ],
            minCosignatories: {
                relativeChange: 3,
            },
        },
    });

    api.nemSignTransaction({
        path: 'm/44',
        transaction: {
            ...common,
            type: NEM.TxType.SUPPLY_CHANGE,
            mosaicId: {
                namespaceId: 'hellom',
                name: 'Hello mosaic',
            },
            supplyType: 1,
            delta: 1,
        },
    });

    api.nemSignTransaction({
        path: 'm/44',
        transaction: {
            ...common,
            type: NEM.TxType.SUPPLY_CHANGE,
            mosaicId: {
                namespaceId: 'hellom',
                name: 'Hello mosaic',
            },
            supplyType: 1,
            delta: 1,
        },
    });

    api.nemSignTransaction({
        path: 'm/44',
        transaction: {
            ...common,
            type: NEM.TxType.MULTISIG,
            otherTrans: {
                timeStamp: 2,
                amount: 2000000,
                deadline: 67890,
                fee: 15000,
                recipient: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
                type: NEM.TxType.TRANSFER,
                message: {
                    payload: '746573745f6e656d5f7472616e73616374696f6e5f7472616e73666572',
                    type: 1,
                },
                version: NEM.TxVersion.testnet,
                signer: 'c5f54ba980fcbb657dbaaa42700539b207873e134d2375efeab5f1ab52f87844',
            },
        },
    });

    api.nemSignTransaction({
        path: 'm/44',
        transaction: {
            ...common,
            type: NEM.TxType.COSIGNING,
            otherTrans: {
                timeStamp: 2,
                amount: 2000000,
                deadline: 67890,
                fee: 15000,
                recipient: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
                type: NEM.TxType.TRANSFER,
                message: {
                    payload: '746573745f6e656d5f7472616e73616374696f6e5f7472616e73666572',
                    type: 1,
                },
                version: NEM.TxVersion.testnet,
                signer: 'c5f54ba980fcbb657dbaaa42700539b207873e134d2375efeab5f1ab52f87844',
            },
        },
    });

    api.nemSignTransaction({
        path: 'm/44',
        transaction: {
            ...common,
            type: NEM.TxType.IMPORTANCE_TRANSFER,
            importanceTransfer: {
                mode: 1,
                publicKey: 'c5f54ba980fcbb657dbaaa42700539b207873e134d2375efeab5f1ab52f87844',
            },
        },
    });

    api.nemSignTransaction({
        path: 'm/44',
        transaction: {
            ...common,
            type: NEM.TxType.PROVISION_NAMESPACE,
            newPart: 'ABCDE',
            rentalFeeSink: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
            parent: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
            rentalFee: 1500,
        },
    });

    api.nemSignTransaction({
        path: 'm/44',
        transaction: {
            ...common,
            type: NEM.TxType.MOSAIC_CREATION,
            mosaicDefinition: {
                id: {
                    namespaceId: 'hellom',
                    name: 'Hello mosaic',
                },
                levy: {
                    type: 1,
                    fee: 1,
                    recipient: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
                    mosaicId: {
                        namespaceId: 'hellom',
                        name: 'Hello mosaic',
                    },
                },
                description: 'lorem',
                properties: [
                    {
                        name: 'divisibility',
                        value: 'string',
                    },
                    {
                        name: 'initialSupply',
                        value: 'string',
                    },
                    {
                        name: 'supplyMutable',
                        value: 'string',
                    },
                    {
                        name: 'transferable',
                        value: 'string',
                    },
                ],
            },
            creationFeeSink: 'TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J',
            creationFee: 1500,
        },
    });
};
