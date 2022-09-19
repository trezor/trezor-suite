const legacyResults = [
    {
        // binanceSignTransaction not supported below this version
        rules: ['<2.3.0', '1'],
        success: false,
    },
];

export default {
    method: 'binanceSignTransaction',
    setup: {
        mnemonic:
            'offer caution gift cross surge pretty orange during eye soldier popular holiday mention east eight office fashion ill parrot vault rent devote earth cousin',
    },
    tests: [
        {
            description: 'transfer',
            params: {
                path: "m/44'/714'/0'/0/0",
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
                },
            },
            result: {
                public_key: '029729a52e4e3c2b4a4e52aa74033eedaf8ba1df5ab6d1f518fd69e67bbd309b0e',
                signature:
                    'faf5b908d6c4ec0c7e2e7d8f7e1b9ca56ac8b1a22b01655813c62ce89bf84a4c7b14f58ce51e85d64c13f47e67d6a9187b8f79f09e0a9b82019f47ae190a4db3',
            },
            legacyResults,
        },
        {
            description: 'placeOrder',
            params: {
                path: "m/44'/714'/0'/0/0",
                transaction: {
                    chain_id: 'Binance-Chain-Nile',
                    account_number: 34,
                    memo: '',
                    sequence: 32,
                    source: 1,
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
                },
            },
            result: {
                public_key: '029729a52e4e3c2b4a4e52aa74033eedaf8ba1df5ab6d1f518fd69e67bbd309b0e',
                signature:
                    '851fc9542342321af63ecbba7d3ece545f2a42bad01ba32cff5535b18e54b6d3106e10b6a4525993d185a1443d9a125186960e028eabfdd8d76cf70a3a7e3100',
            },
            legacyResults,
        },
        {
            description: 'cancelOrder',
            params: {
                path: "m/44'/714'/0'/0/0",
                transaction: {
                    chain_id: 'Binance-Chain-Nile',
                    account_number: 34,
                    memo: '',
                    sequence: 33,
                    source: 1,
                    cancelOrder: {
                        refid: 'BA36F0FAD74D8F41045463E4774F328F4AF779E5-29',
                        sender: 'tbnb1hgm0p7khfk85zpz5v0j8wnej3a90w709zzlffd',
                        symbol: 'BCHSV.B-10F_BNB',
                    },
                },
            },
            result: {
                public_key: '029729a52e4e3c2b4a4e52aa74033eedaf8ba1df5ab6d1f518fd69e67bbd309b0e',
                signature:
                    'd93fb0402b2b30e7ea08e123bb139ad68bf0a1577f38592eb22d11e127f09bbd3380f29b4bf15bdfa973454c5c8ed444f2e256e956fe98cfd21e886a946e21e5',
            },
            legacyResults,
        },
    ],
};
