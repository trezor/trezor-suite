const { ADDRESS_N } = global.TestUtils;

// vectors from https://github.com/trezor/trezor-firmware/blob/master/tests/device_tests/test_msg_signmessage.py

const legacyResults = [
    // SignMessage.no_script_type
    {
        rules: ['<2.4.3'],
        success: false,
    },
];

export default {
    method: 'signMessage',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'BTC: p2pkh',
            params: {
                coin: 'Bitcoin',
                path: ADDRESS_N("m/44'/0'/0'/0/0"),
                message: 'This is an example of a signed message.',
            },
            result: {
                address: '1JAd7XCBzGudGpJQSDSfpmJhiygtLQWaGL',
                signature: Buffer.from(
                    '20fd8f2f7db5238fcdd077d5204c3e6949c261d700269cefc1d9d2dcef6b95023630ee617f6c8acf9eb40c8edd704c9ca74ea4afc393f43f35b4e8958324cbdd1c',
                    'hex',
                ).toString('base64'),
            },
        },
        {
            description: 'BTC: p2sh (segwit)',
            params: {
                coin: 'Bitcoin',
                path: ADDRESS_N("m/49'/0'/0'/0/0"),
                message: 'This is an example of a signed message.',
            },
            result: {
                address: '3L6TyTisPBmrDAj6RoKmDzNnj4eQi54gD2',
                signature: Buffer.from(
                    '23744de4516fac5c140808015664516a32fead94de89775cec7e24dbc24fe133075ac09301c4cc8e197bea4b6481661d5b8e9bf19d8b7b8a382ecdb53c2ee0750d',
                    'hex',
                ).toString('base64'),
            },
        },
        {
            description: 'BTC: bech32 (segwit-native)',
            params: {
                coin: 'Bitcoin',
                path: ADDRESS_N("m/84'/0'/0'/0/0"),
                message: 'This is an example of a signed message.',
            },
            result: {
                address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
                signature: Buffer.from(
                    '28b55d7600d9e9a7e2a49155ddf3cfdb8e796c207faab833010fa41fb7828889bc47cf62348a7aaa0923c0832a589fab541e8f12eb54fb711c90e2307f0f66b194',
                    'hex',
                ).toString('base64'),
            },
        },
        {
            description: 'BTC: long message',
            params: {
                coin: 'Bitcoin',
                path: ADDRESS_N("m/44'/0'/0'/0/0"),
                message: 'VeryLongMessage!'.repeat(64),
            },
            result: {
                address: '1JAd7XCBzGudGpJQSDSfpmJhiygtLQWaGL',
                signature: Buffer.from(
                    '200a46476ceb84d06ef5784828026f922c8815f57aac837b8c013007ca8a8460db63ef917dbebaebd108b1c814bbeea6db1f2b2241a958e53fe715cc86b199d9c3',
                    'hex',
                ).toString('base64'),
            },
        },
        {
            description: 'BTC: p2sh long message',
            params: {
                coin: 'Bitcoin',
                path: ADDRESS_N("m/49'/0'/0'/0/0"),
                message: 'VeryLongMessage!'.repeat(64),
            },
            result: {
                address: '3L6TyTisPBmrDAj6RoKmDzNnj4eQi54gD2',
                signature: Buffer.from(
                    '236eadee380684f70749c52141c8aa7c3b6afd84d0e5f38cfa71823f3b1105a5f34e23834a5bb6f239ff28ad87f409f44e4ce6269754adc00388b19507a5d9386f',
                    'hex',
                ).toString('base64'),
            },
        },
        {
            description: 'BTC: bech32 long message',
            params: {
                coin: 'Bitcoin',
                path: ADDRESS_N("m/84'/0'/0'/0/0"),
                message: 'VeryLongMessage!'.repeat(64),
            },
            result: {
                address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
                signature: Buffer.from(
                    '28c6f86e255eaa768c447d635d91da01631ac54af223c2c182d4fa3676cfecae4a199ad33a74fe04fb46c39432acb8d83de74da90f5f01123b3b7d8bc252bc7f71',
                    'hex',
                ).toString('base64'),
            },
        },
        // {
        //     description: 'NFKD message',
        //     params: {
        //         coin: 'Bitcoin',
        //         path: ADDRESS_N("m/44'/0'/0'/0/1"),
        //         // message: 'Pr\u030ci\u0301s\u030cerne\u030c z\u030clut\u030couc\u030cky\u0301 ku\u030an\u030c u\u0301pe\u030cl d\u030ca\u0301belske\u0301 o\u0301dy za\u0301ker\u030cny\u0301 uc\u030cen\u030c be\u030cz\u030ci\u0301 pode\u0301l zo\u0301ny u\u0301lu\u030a',
        //         message: 'Příšerně žluťoučký kůň úpěl ďábelské ódy zákeřný učeň běží podél zóny úlů',
        //     },
        //     result: {
        //         address: '1GWFxtwWmNVqotUPXLcKVL2mUKpshuJYo',
        //         signature: Buffer.from('2046a0b46e81492f82e0412c73701b9740e6462c603575ee2d36c7d7b4c20f0f33763ca8cb3027ea8e1ce5e83fda8b6746fea8f5c82655d78fd419e7c766a5e17a', 'hex').toString('base64'),
        //     },
        // },
        {
            description: 'NFC message',
            params: {
                coin: 'Bitcoin',
                path: ADDRESS_N("m/44'/0'/0'/0/1"),
                message:
                    'P\u0159\xed\u0161ern\u011b \u017elu\u0165ou\u010dk\xfd k\u016f\u0148 \xfap\u011bl \u010f\xe1belsk\xe9 \xf3dy z\xe1ke\u0159n\xfd u\u010de\u0148 b\u011b\u017e\xed pod\xe9l z\xf3ny \xfal\u016f',
            },
            result: {
                address: '1GWFxtwWmNVqotUPXLcKVL2mUKpshuJYo',
                signature: Buffer.from(
                    '2046a0b46e81492f82e0412c73701b9740e6462c603575ee2d36c7d7b4c20f0f33763ca8cb3027ea8e1ce5e83fda8b6746fea8f5c82655d78fd419e7c766a5e17a',
                    'hex',
                ).toString('base64'),
            },
        },
        {
            description: 'TESTNET: p2pkh',
            params: {
                coin: 'Testnet',
                path: ADDRESS_N("m/44'/1'/0'/0/0"),
                message: 'This is an example of a signed message.',
            },
            result: {
                address: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q',
                signature: Buffer.from(
                    '2030cd7f116c0481d1936cfef48137fd23ee56aaf00787bfa08a94837466ec9909390c3efacfc56bae5782f1db4cf49ae05f242b5f62a47f871ec46bf1a3253e7f',
                    'hex',
                ).toString('base64'),
            },
        },
        {
            description: 'TESTNET: p2sh',
            params: {
                coin: 'Testnet',
                path: ADDRESS_N("m/49'/1'/0'/0/0"),
                message: 'This is an example of a signed message.',
            },
            result: {
                address: '2N4Q5FhU2497BryFfUgbqkAJE87aKHUhXMp',
                signature: Buffer.from(
                    '23ef39fd388c3425d6aaa04274dcd5c7dd4c283a411b616443474fbcde5dd966050d91bc7c57e9578f28efdd84c9a9bcba415f93c5727b5d3f2bf3de46d7084896',
                    'hex',
                ).toString('base64'),
            },
        },
        {
            description: 'TESTNET: bech32',
            params: {
                coin: 'Testnet',
                path: ADDRESS_N("m/84'/1'/0'/0/0"),
                message: 'This is an example of a signed message.',
            },
            result: {
                address: 'tb1qkvwu9g3k2pdxewfqr7syz89r3gj557l3uuf9r9',
                signature: Buffer.from(
                    '27758b3393396ad9fe48f6ce81f63410145e7b2b69a5dfc1d48b5e6e623e91e08e3afb60bda1546f9c6f9fb5bd0a41887b784c266036dd4b4015a0abc1137daa1d',
                    'hex',
                ).toString('base64'),
            },
        },
        {
            description: 'BCH',
            params: {
                coin: 'Bcash',
                path: ADDRESS_N("m/44'/145'/0'/0/0"),
                message: 'This is an example of a signed message.',
            },
            result: {
                address: 'bitcoincash:qr08q88p9etk89wgv05nwlrkm4l0urz4cyl36hh9sv',
                signature: Buffer.from(
                    '1fda7733e666a4ab8ba86f3cfc3728d318ecf824a3bf99597570297aa131607c10316959136b2c500b2b478a73c563ba314c0b7b2a22065b6d9596118f246d360e',
                    'hex',
                ).toString('base64'),
            },
        },
        {
            description: 'BTC no_script_type p2pkh',
            params: {
                coin: 'Bitcoin',
                path: ADDRESS_N("m/44'/0'/0'/0/0"),
                message: 'This is an example of a signed message.',
                no_script_type: true,
            },
            result: {
                address: '1JAd7XCBzGudGpJQSDSfpmJhiygtLQWaGL',
                signature: Buffer.from(
                    '20fd8f2f7db5238fcdd077d5204c3e6949c261d700269cefc1d9d2dcef6b95023630ee617f6c8acf9eb40c8edd704c9ca74ea4afc393f43f35b4e8958324cbdd1c',
                    'hex',
                ).toString('base64'),
            },
            legacyResults,
        },
        {
            description: 'BTC no_script_type p2sh',
            params: {
                coin: 'Bitcoin',
                path: ADDRESS_N("m/49'/0'/0'/0/0"),
                message: 'This is an example of a signed message.',
                no_script_type: true,
            },
            result: {
                address: '3L6TyTisPBmrDAj6RoKmDzNnj4eQi54gD2',
                signature: Buffer.from(
                    '1f744de4516fac5c140808015664516a32fead94de89775cec7e24dbc24fe133075ac09301c4cc8e197bea4b6481661d5b8e9bf19d8b7b8a382ecdb53c2ee0750d',
                    'hex',
                ).toString('base64'),
            },
            legacyResults,
        },
        {
            description: 'BTC no_script_type p2wpkh',
            params: {
                coin: 'Bitcoin',
                path: ADDRESS_N("m/84'/0'/0'/0/0"),
                message: 'This is an example of a signed message.',
                no_script_type: true,
            },
            result: {
                address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
                signature: Buffer.from(
                    '20b55d7600d9e9a7e2a49155ddf3cfdb8e796c207faab833010fa41fb7828889bc47cf62348a7aaa0923c0832a589fab541e8f12eb54fb711c90e2307f0f66b194',
                    'hex',
                ).toString('base64'),
            },
            legacyResults,
        },
    ],
};
