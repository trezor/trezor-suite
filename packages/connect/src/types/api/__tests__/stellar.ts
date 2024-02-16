import { TrezorConnect } from '../../..';

export const stellarGetAddress = async (api: TrezorConnect) => {
    // regular
    const singleAddress = await api.stellarGetAddress({ path: 'm/44' });
    if (singleAddress.success) {
        const { payload } = singleAddress;
        payload.address.toLowerCase();
        payload.path.map(a => a);
        payload.serializedPath.toLowerCase();
        // @ts-expect-error, payload is not a bundle
        payload.map(a => a);
    }

    // bundle
    const bundleAddress = await api.stellarGetAddress({ bundle: [{ path: 'm/44' }] });
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
    api.stellarGetAddress({
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
    api.stellarGetAddress();
    // @ts-expect-error
    api.stellarGetAddress({ coin: 'btc' });
    // @ts-expect-error
    api.stellarGetAddress({ path: 1 });
    // @ts-expect-error
    api.stellarGetAddress({ bundle: 1 });
};

export const stellarSignTransaction = async (api: TrezorConnect) => {
    const sign = await api.stellarSignTransaction({
        path: 'm/44',
        networkPassphrase: 'Test SDF Network ; September 2015',
        transaction: {
            source: 'GAK5MSF74TJW6GLM7NLTL76YZJKM2S4CGP3UH4REJHPHZ4YBZW2GSBPW',
            fee: 100,
            sequence: '4294967296',
            memo: {
                type: 0,
            },
            operations: [
                {
                    type: 'createAccount',
                    destination: 'GBOVKZBEM2YYLOCDCUXJ4IMRKHN4LCJAE7WEAEA2KF562XFAGDBOB64V',
                    startingBalance: '1000333000',
                },
                {
                    type: 'accountMerge',
                    destination: 'GBOVKZBEM2YYLOCDCUXJ4IMRKHN4LCJAE7WEAEA2KF562XFAGDBOB64V',
                },
                {
                    type: 'payment',
                    destination: 'GBOVKZBEM2YYLOCDCUXJ4IMRKHN4LCJAE7WEAEA2KF562XFAGDBOB64V',
                    asset: {
                        type: 0,
                        code: 'XLM',
                    },
                    amount: '500111000',
                },
                {
                    type: 'payment',
                    destination: 'GBOVKZBEM2YYLOCDCUXJ4IMRKHN4LCJAE7WEAEA2KF562XFAGDBOB64V',
                    amount: '500111000',
                    asset: {
                        type: 1,
                        code: 'X',
                        issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                    },
                },
                {
                    type: 'payment',
                    destination: 'GBOVKZBEM2YYLOCDCUXJ4IMRKHN4LCJAE7WEAEA2KF562XFAGDBOB64V',
                    amount: '500111000',
                    asset: {
                        type: 2,
                        code: 'ABCDEFGHIJKL',
                        issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                    },
                },
                {
                    type: 'bumpSequence',
                    bumpTo: '9223372036854775807',
                },
                {
                    type: 'setOptions',
                    inflationDest: 'GAFXTC5OV5XQD66T7WGOB2HUVUC3ZVJDJMBDPTVQYV3G3K7TUHC6CLBR',
                },
                {
                    type: 'setOptions',
                    signer: {
                        type: 0,
                        key: '72187adb879c414346d77c71af8cce7b6eaa57b528e999fd91feae6b6418628e',
                        weight: 2,
                    },
                },
                {
                    type: 'setOptions',
                    medThreshold: 0,
                },
                {
                    type: 'setOptions',
                    clearFlags: 0,
                    lowThreshold: 0,
                    highThreshold: 3,
                },
                {
                    type: 'setOptions',
                    setFlags: 3,
                    masterWeight: 4,
                    homeDomain: 'hello',
                },
                {
                    type: 'setOptions',
                },
                {
                    type: 'setOptions',
                    homeDomain: '',
                },
                {
                    type: 'manageData',
                    name: 'data',
                    value: '616263', // Buffer.from('abc').toString('hex')
                },
                {
                    type: 'manageData',
                    name: 'data',
                    value: undefined,
                },
                {
                    type: 'pathPaymentStrictReceive',
                    sendAsset: {
                        type: 1,
                        code: 'X',
                        issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                    },
                    sendMax: '500111000',
                    destination: 'GBOVKZBEM2YYLOCDCUXJ4IMRKHN4LCJAE7WEAEA2KF562XFAGDBOB64V',
                    destAsset: {
                        type: 1,
                        code: 'X',
                        issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                    },
                    destAmount: '500111000',
                },
                {
                    type: 'pathPaymentStrictReceive',
                    sendAsset: {
                        type: 2,
                        code: 'ABCDEFGHIJKL',
                        issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                    },
                    sendMax: '500111000',
                    destination: 'GBOVKZBEM2YYLOCDCUXJ4IMRKHN4LCJAE7WEAEA2KF562XFAGDBOB64V',
                    destAsset: {
                        type: 2,
                        code: 'ABCDEFGHIJKL',
                        issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                    },
                    destAmount: '500111000',
                    path: [
                        {
                            type: 1,
                            code: 'X',
                            issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                        },
                        {
                            type: 2,
                            code: 'ABCDEFGHIJKL',
                            issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                        },
                    ],
                },
                {
                    type: 'pathPaymentStrictSend',
                    sendAsset: {
                        type: 1,
                        code: 'X',
                        issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                    },
                    sendAmount: '500111000',
                    destination: 'GBOVKZBEM2YYLOCDCUXJ4IMRKHN4LCJAE7WEAEA2KF562XFAGDBOB64V',
                    destAsset: {
                        type: 1,
                        code: 'X',
                        issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                    },
                    destMin: '500111000',
                },
                {
                    type: 'pathPaymentStrictSend',
                    sendAsset: {
                        type: 2,
                        code: 'ABCDEFGHIJKL',
                        issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                    },
                    sendAmount: '500111000',
                    destination: 'GBOVKZBEM2YYLOCDCUXJ4IMRKHN4LCJAE7WEAEA2KF562XFAGDBOB64V',
                    destAsset: {
                        type: 2,
                        code: 'ABCDEFGHIJKL',
                        issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                    },
                    destMin: '500111000',
                    path: [
                        {
                            type: 1,
                            code: 'X',
                            issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                        },
                        {
                            type: 2,
                            code: 'ABCDEFGHIJKL',
                            issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                        },
                    ],
                },
                {
                    type: 'createPassiveSellOffer',
                    selling: {
                        type: 0,
                        code: 'XLM',
                    },
                    buying: {
                        type: 0,
                        code: 'XLM',
                    },
                    amount: '500111000',
                    price: {
                        n: 500111,
                        d: 10000,
                    },
                },
                {
                    type: 'createPassiveSellOffer',
                    selling: {
                        type: 1,
                        code: 'X',
                        issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                    },
                    buying: {
                        type: 1,
                        code: 'X',
                        issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                    },
                    amount: '500111000',
                    price: {
                        n: 500111,
                        d: 10000,
                    },
                },
                {
                    type: 'manageSellOffer',
                    selling: {
                        type: 0,
                        code: 'XLM',
                    },
                    buying: {
                        type: 0,
                        code: 'XLM',
                    },
                    amount: '500111000',
                    price: {
                        n: 500111,
                        d: 10000,
                    },
                    offerId: '101',
                },
                {
                    type: 'manageBuyOffer',
                    selling: {
                        type: 0,
                        code: 'XLM',
                    },
                    buying: {
                        type: 0,
                        code: 'XLM',
                    },
                    amount: '500111000',
                    price: {
                        n: 500111,
                        d: 10000,
                    },
                    offerId: '101',
                },
                {
                    type: 'changeTrust',
                    line: {
                        type: 1,
                        code: 'X',
                        issuer: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                    },
                    limit: '9223372036854775807',
                },
                {
                    type: 'allowTrust',
                    trustor: 'GAUYJFQCYIHFQNS7CI6BFWD2DSSFKDIQZUQ3BLQODDKE4PSW7VVBKENC',
                    assetType: 1,
                    assetCode: 'XLM',
                    authorize: true,
                },
                {
                    type: 'claimClaimableBalance',
                    balanceId:
                        '00000000178826fbfe339e1f5c53417c6fedfe2c05e8bec14303143ec46b38981b09c3f9',
                },
            ],
        },
    });

    if (sign.success) {
        const { payload } = sign;
        payload.publicKey.toLowerCase();
        payload.signature.toLowerCase();
    }
};
