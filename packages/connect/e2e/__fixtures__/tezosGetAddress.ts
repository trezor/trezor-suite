const legacyResults = [
    {
        // Tezos not supported below this version
        rules: ['<2.0.8', '1'],
        success: false,
    },
];

export default {
    method: 'tezosGetAddress',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: "m/44'/1729'/0'",
            params: {
                path: "m/44'/1729'/0'",
                showOnTrezor: false,
            },
            result: {
                address: 'tz1ckrgqGGGBt4jGDmwFhtXc1LNpZJUnA9F2',
            },
        },
        {
            description: "m/44'/1729'/1'",
            params: {
                path: "m/44'/1729'/1'",
                showOnTrezor: false,
            },
            result: {
                address: 'tz1cTfmc5uuBr2DmHDgkXTAoEcufvXLwq5TP',
            },
        },
        {
            description: "m/44'/1729'",
            params: {
                path: "m/44'/1729'",
                showOnTrezor: false,
            },
            result: false,
        },
        {
            description: "m/44'/1729'/0",
            params: {
                path: "m/44'/1729'/0",
                showOnTrezor: false,
            },
            result: false,
        },
    ].map(fixture => ({ ...fixture, legacyResults })),
};
