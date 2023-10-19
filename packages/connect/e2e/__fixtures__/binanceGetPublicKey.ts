const legacyResults = [
    {
        // not supported below this version
        rules: ['<2.3.0', '1'],
        success: false,
    },
];

export default {
    method: 'binanceGetPublicKey',
    setup: {
        mnemonic:
            'offer caution gift cross surge pretty orange during eye soldier popular holiday mention east eight office fashion ill parrot vault rent devote earth cousin',
    },
    tests: [
        // https://github.com/trezor/trezor-firmware/blob/main/tests/device_tests/binance/test_get_public_key.py
        {
            description: 'binanceGetPublicKey',
            params: {
                path: "m/44'/714'/0'/0/0",
            },
            result: {
                publicKey: '029729a52e4e3c2b4a4e52aa74033eedaf8ba1df5ab6d1f518fd69e67bbd309b0e',
            },
            legacyResults,
        },
    ],
};
