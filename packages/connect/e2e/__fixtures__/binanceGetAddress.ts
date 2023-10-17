const legacyResults = [
    {
        // not supported below this version
        rules: ['<2.3.0', '1'],
        success: false,
    },
];

export default {
    method: 'binanceGetAddress',
    setup: {
        mnemonic:
            'offer caution gift cross surge pretty orange during eye soldier popular holiday mention east eight office fashion ill parrot vault rent devote earth cousin',
    },
    tests: [
        // https://github.com/trezor/trezor-firmware/blob/main/tests/device_tests/binance/test_get_address.py
        {
            description: 'binanceGetAddress m/44h/714h/0h/0/0 ',
            params: {
                path: "m/44'/714'/0'/0/0",
            },
            result: {
                address: 'bnb1hgm0p7khfk85zpz5v0j8wnej3a90w709vhkdfu',
            },
            legacyResults,
        },
        // https://github.com/trezor/trezor-firmware/blob/main/tests/device_tests/binance/test_get_address.py
        {
            description: 'binanceGetAddress m/44h/714h/0h/0/1',
            params: {
                path: "m/44'/714'/0'/0/1",
            },
            result: {
                address: 'bnb1egswqkszzfc2uq78zjslc6u2uky4pw46x4rstd',
            },
            legacyResults,
        },
    ],
};
