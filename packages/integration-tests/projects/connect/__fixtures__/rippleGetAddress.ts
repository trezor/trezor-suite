const legacyResults = [
    {
        // rippleGetAddress not supported below this version
        rules: ['<2.1.0', '1'],
        success: false,
    },
];

export default {
    method: 'rippleGetAddress',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'first account',
            params: {
                path: "m/44'/144'/0'/0/0",
            },
            result: {
                address: 'rh5ZnEVySAy7oGd3nebT3wrohGDrsNS83E',
            },
        },
        {
            description: 'second account',
            params: {
                path: "m/44'/144'/1'/0/0",
            },
            result: {
                address: 'rEpwmtmvx8gkMhX5NLdU3vutQt7dor4MZm',
            },
        },
        // since 2.3.2 this test will return success, see common.setup emulator-allow-unsafe-paths
        // {
        //     description: 'Forbidden key path',
        //     params: {
        //         path: "m/44'/0'/1'",
        //     },
        //     result: false,
        // },
        {
            description: "m/44'/144'/0'/0/1",
            params: {
                path: "m/44'/144'/0'/0/1",
            },
            result: {
                address: 'rwrZ3agNYYJw4yi6v1r7Ui9AwX9KsWzghr',
            },
        },
    ].map(fixture => ({ ...fixture, legacyResults })),
};
