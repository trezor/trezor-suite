// https://github.com/trezor/trezor-firmware/blob/master/tests/device_tests/eos/test_get_public_key.py

const legacyResults = [
    {
        // EOS not supported below this version
        rules: ['<2.1.1', '1'],
        success: false,
    },
];

export default {
    method: 'eosGetPublicKey',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: "m/44'/194'/0'/0/0",
            params: {
                path: "m/44'/194'/0'/0/0",
            },
            result: {
                wifPublicKey: 'EOS4u6Sfnzj4Sh2pEQnkXyZQJqH3PkKjGByDCbsqqmyq6PttM9KyB',
                rawPublicKey: '02015fabe197c955036bab25f4e7c16558f9f672f9f625314ab1ec8f64f7b1198e',
            },
        },
        {
            description: '[2147483692, 2147483842, 2147483648, 0, 1]',
            params: {
                path: [2147483692, 2147483842, 2147483648, 0, 1],
            },
            result: {
                wifPublicKey: 'EOS5d1VP15RKxT4dSakWu2TFuEgnmaGC2ckfSvQwND7pZC1tXkfLP',
                rawPublicKey: '02608bc2c431521dee0b9d5f2fe34053e15fc3b20d2895e0abda857b9ed8e77a78',
            },
        },
        {
            description: 'Bundle',
            params: {
                bundle: [{ path: "m/44'/194'/0'/0/0" }, { path: "m/44'/194'/0'/0/1" }],
            },
            result: [
                {
                    wifPublicKey: 'EOS4u6Sfnzj4Sh2pEQnkXyZQJqH3PkKjGByDCbsqqmyq6PttM9KyB',
                    rawPublicKey:
                        '02015fabe197c955036bab25f4e7c16558f9f672f9f625314ab1ec8f64f7b1198e',
                },
                {
                    wifPublicKey: 'EOS5d1VP15RKxT4dSakWu2TFuEgnmaGC2ckfSvQwND7pZC1tXkfLP',
                    rawPublicKey:
                        '02608bc2c431521dee0b9d5f2fe34053e15fc3b20d2895e0abda857b9ed8e77a78',
                },
            ],
        },
        // invalid
        {
            description: "m/44'/194'",
            params: {
                path: "m/44'/194'",
            },
        },
        {
            description: '[-1]',
            params: {
                path: [-1],
            },
        },
    ].map(fixture => ({ ...fixture, legacyResults })),
};
