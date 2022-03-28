export default {
    method: 'nemGetAddress',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: "mainnet m/44'/1'/0'/0'/0'",
            params: {
                path: "m/44'/1'/0'/0'/0'",
                network: 104,
            },
            result: {
                address: 'NB3JCHVARQNGDS3UVGAJPTFE22UQFGMCQGHUBWQN',
            },
        },
        {
            description: "testnet m/44'/1'/0'/0'/0'",
            params: {
                path: "m/44'/1'/0'/0'/0'",
                network: 152,
            },
            result: {
                address: 'TB3JCHVARQNGDS3UVGAJPTFE22UQFGMCQHSBNBMF',
            },
        },
    ],
};
