// https://github.com/trezor/trezor-firmware/blob/main/tests/device_tests/bitcoin/test_getownershipproof.py

const legacyResults = [
    {
        // getOwnershipId not supported on T1B1 and T2T1 below 2.5.3
        rules: ['1', '<2.5.3'],
        success: false,
    },
];

export default {
    method: 'getOwnershipId',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Bitcoin (Bech32/P2WPKH): ownership id',
            params: {
                path: "m/84'/0'/0'/1/0",
                coin: 'btc',
            },
            result: {
                ownership_id: 'a122407efc198211c81af4450f40b235d54775efd934d16b9e31c6ce9bad5707',
            },
            legacyResults,
        },
        {
            description: 'Bitcoin (Taproot/P2TR): ownership id',
            params: {
                path: "m/86'/0'/0'/1/0",
                coin: 'btc',
            },
            result: {
                ownership_id: 'dc18066224b9e30e306303436dc18ab881c7266c13790350a3fe415e438135ec',
            },
            legacyResults,
        },
        {
            description: 'Bundle of ownership ids',
            params: {
                bundle: [
                    { path: "m/84'/0'/0'/1/0", coin: 'btc' },
                    { path: "m/86'/0'/0'/1/0", coin: 'btc' },
                    { path: "m/49'/1'/0'/1/0", coin: 'testnet' },
                    { path: "m/44'/1'/0'/1/0", coin: 'testnet' },
                ],
            },
            result: [
                {
                    ownership_id:
                        'a122407efc198211c81af4450f40b235d54775efd934d16b9e31c6ce9bad5707',
                },
                {
                    ownership_id:
                        'dc18066224b9e30e306303436dc18ab881c7266c13790350a3fe415e438135ec',
                },
                {
                    ownership_id:
                        '6220e5fc12129a680b8fb6a55cc169583c670d2ece1955dd9df2f386d3dc304c',
                },
                {
                    ownership_id:
                        'afc1428604b7a1a547508c0446f3a0888c2fc6ace6e61da50c6278a246ab62a6',
                },
            ],
            legacyResults,
        },
    ],
};
