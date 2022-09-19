export default {
    method: 'getAddress',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'Bitcoin bech32 first address',
            params: {
                path: "m/84'/0'/0'/0/0",
                coin: 'btc',
            },
            result: {
                address: 'bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa',
            },
        },
        {
            description: 'Bitcoin p2sh first address',
            params: {
                path: "m/49'/0'/0'/0/0",
                coin: 'btc',
            },
            result: {
                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
            },
        },
        {
            description: 'Bitcoin p2sh first address (path as array)',
            params: {
                path: [2147483697, 2147483648, 2147483648, 0, 0],
                coin: 'Bitcoin',
            },
            result: {
                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
            },
        },
        {
            description: 'Bitcoin p2sh first change address',
            params: {
                path: "m/49'/0'/0'/1/0",
                coin: 'btc',
            },
            result: {
                address: '3DDuECA7AomS7GSf5G2NAF6djKEqF2qma5',
            },
        },
        {
            description: 'Bitcoin p2pkh first address',
            params: {
                path: "m/44'/0'/0'/0/0",
                coin: 'btc',
            },
            result: {
                address: '1FH6ehAd5ZFXCM1cLGzHxK1s4dGdq1JusM',
            },
        },
        {
            description: 'Litecoin p2sh first address',
            params: {
                path: "m/49'/2'/0'/0/0",
                coin: 'ltc',
            },
            result: {
                address: 'MFoQRU1KQq365Sy3cXhix3ygycEU4YWB1V',
            },
        },
        {
            description: 'Testnet p2sh first address',
            params: {
                path: "m/49'/1'/0'/0/0",
                coin: 'tbtc',
            },
            result: {
                address: '2N4dH9yn4eYnnjHTYpN9xDmuMRS2k1AHWd8',
            },
        },
        {
            description: 'Bitcoin Cash first address',
            params: {
                path: "m/44'/145'/0'/0/0",
                coin: 'bcash',
            },
            result: {
                address: 'bitcoincash:qzqxk2q6rhy3j9fnnc00m08g4n5dm827xv2dmtjzzp',
            },
        },
        {
            description: 'Decred first address',
            params: {
                path: "m/44'/42'/0'/0/0",
                coin: 'dcr',
            },
            result: {
                address: 'DsbjnfJrnL1orxJBCN8Kf39NjMwEktdfdWy',
            },
        },
        {
            description: 'Decred Testnet first address',
            params: {
                path: "m/44'/1'/0'/0/0",
                coin: 'tdcr',
            },
            result: {
                address: 'TsRQTRqf5TdEfqsnJ1gcQEDvPP363cEjr4B',
            },
        },
        {
            description: 'Regtest P2PKH first address',
            params: {
                path: "m/44'/1'/0'/0/0",
                coin: 'regtest',
            },
            result: {
                address: 'mkqRFzxmkCGX9jxgpqqFHcxRUmLJcLDBer',
            },
        },
        {
            description: 'Regtest P2SH first address',
            params: {
                path: "m/49'/1'/0'/0/0",
                coin: 'regtest',
            },
            result: {
                address: '2N4dH9yn4eYnnjHTYpN9xDmuMRS2k1AHWd8',
            },
        },
        {
            description: 'Regtest P2WPHK first address',
            params: {
                path: "m/84'/1'/0'/0/0",
                coin: 'regtest',
            },
            result: {
                address: 'bcrt1qnspxpr2xj9s2jt6qlhuvdnxw6q55jvyg6q7g5r',
            },
        },
        {
            description: 'Regtest P2TR first address',
            params: {
                path: "m/86'/1'/0'/0/0",
                coin: 'regtest',
            },
            result: {
                address: 'bcrt1p0wxg3r4ddwhdsze3ket8egal8caf4u5rflnlnun9tm2ekafgzc7se7tuts',
            },
            legacyResults: [
                {
                    // taproot supported since 2.4.3
                    rules: ['<2.4.3'],
                    success: false,
                },
            ],
        },
    ],
};
