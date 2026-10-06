const legacyResults = [
    {
        rules: ['<2.5.3', '1'],
        success: false,
    },
];

const moneroKeyImageSync: TestCase = {
    method: 'moneroKeyImageSync',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Single transfer detail - account 0',
            params: {
                path: "m/44'/128'/0'",
                tdis: [
                    {
                        out_key: '7dec0733b4075ec403f0671f1e15e4f3d5c1be34b371bacf9db69355d0bf2ded',
                        tx_pub_key:
                            'e3c8b1f31e695a57ed073bf7cb09d85c82870766887673974ea154dfbb55e565',
                        internal_output_index: 1,
                        sub_addr_major: 0,
                        sub_addr_minor: 0,
                    },
                ],
            },
            result: {
                key_images: [
                    {
                        iv: expect.any(String),
                        key_image: expect.any(String),
                    },
                ],
            },
            legacyResults,
        },
        {
            description: 'Multiple transfer details - account 0',
            params: {
                path: "m/44'/128'/0'",
                tdis: [
                    {
                        out_key: '7dec0733b4075ec403f0671f1e15e4f3d5c1be34b371bacf9db69355d0bf2ded',
                        tx_pub_key:
                            'e3c8b1f31e695a57ed073bf7cb09d85c82870766887673974ea154dfbb55e565',
                        internal_output_index: 1,
                        sub_addr_major: 0,
                        sub_addr_minor: 0,
                    },
                    {
                        out_key: 'be00696b12dad7bc6084e657d499b1a48ffb05ca522254bfaec63fb93ecfa3f4',
                        tx_pub_key:
                            'db16dd65fe460c70cf763ef36321dd19170291f6f72877d1496c1a799a4bf258',
                        additional_tx_pub_keys: [
                            'cd7290f50f1272927b092414efb3817b892083e9ee1890d81f594c35666a8204',
                            '1701f765ba536872d8a2fb39b4edae19ed8f63537a99e148fff63fedee190d8a',
                            '51af6b9613cb891ef3b3e3f898a049553e997a7b15a006121e4c2145c3808f41',
                        ],
                        internal_output_index: 2,
                        sub_addr_major: 0,
                        sub_addr_minor: 0,
                    },
                    {
                        out_key: 'ad52fed72a6636000ae99173fae6d60687cd67c4323f48ce86ebea787b9a8318',
                        tx_pub_key:
                            '57b32a7470bca3e4d7afc07973fa32209d9022e72ea3a700fbb19bf8458866cb',
                        additional_tx_pub_keys: [
                            'ba810534c1b0a6b706807572ca08e2247234d29a01eff012287fb649653e8c48',
                            'cb00d934af540a23f2366270e6528d70cd0febc519d4f4984d05d3974528ce74',
                            'b6053bbf7a92d65241e99af32ac2d8b99f70ee8ebf833801f95ed52f68a2e198',
                        ],
                        internal_output_index: 2,
                        sub_addr_major: 0,
                        sub_addr_minor: 0,
                    },
                ],
            },
            result: {
                key_images: [
                    {
                        iv: expect.any(String),
                        key_image: expect.any(String),
                    },
                    {
                        iv: expect.any(String),
                        key_image: expect.any(String),
                    },
                    {
                        iv: expect.any(String),
                        key_image: expect.any(String),
                    },
                ],
            },
            legacyResults,
        },
        {
            description: 'With subaddress indices - subaddr 1',
            params: {
                path: "m/44'/128'/0'",
                tdis: [
                    {
                        out_key: 'bb20e1f5bb0eaa2d3d41e14abc332045eac8668a90f3bade80aac351fc0ac957',
                        tx_pub_key:
                            '20d05f96031bcb263d0a9a751184fe9b3fa2f8814138611ef68dd3f6f0fb1bcf',
                        internal_output_index: 1,
                        sub_addr_major: 0,
                        sub_addr_minor: 1,
                    },
                ],
            },
            result: {
                key_images: [
                    {
                        iv: expect.any(String),
                        key_image: expect.any(String),
                    },
                ],
            },
            legacyResults,
        },
        {
            description: 'With subaddress indices - subaddr 2',
            params: {
                path: "m/44'/128'/0'",
                tdis: [
                    {
                        out_key: '2fdb6203032347e04ff62df1ac3cc5b6f46c160f1f1adebb27fe596d181ba60b',
                        tx_pub_key:
                            'd44db1d925680631efd178760c1c40f63de18116f98d8b1b1a9c52754e8cc28d',
                        internal_output_index: 0,
                        sub_addr_major: 0,
                        sub_addr_minor: 2,
                    },
                ],
            },
            result: {
                key_images: [
                    {
                        iv: expect.any(String),
                        key_image: expect.any(String),
                    },
                ],
            },
            legacyResults,
        },
        {
            description: 'Invalid path - not hardened',
            params: {
                path: "m/44'/128'/0",
                tdis: [
                    {
                        out_key: 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
                        tx_pub_key:
                            '1122334455667788990011223344556677889900112233445566778899001122',
                        internal_output_index: 0,
                    },
                ],
            },
            result: false,
            legacyResults,
        },
        {
            description: 'Invalid - empty tdis array',
            params: {
                path: "m/44'/128'/0'",
                tdis: [],
            },
            result: false,
            legacyResults,
        },
        {
            description: 'Invalid - invalid out_key length',
            params: {
                path: "m/44'/128'/0'",
                tdis: [
                    {
                        out_key: 'aabbccdd',
                        tx_pub_key:
                            '1122334455667788990011223344556677889900112233445566778899001122',
                        internal_output_index: 0,
                    },
                ],
            },
            result: false,
            legacyResults,
        },
        {
            description: 'Invalid - invalid tx_pub_key length',
            params: {
                path: "m/44'/128'/0'",
                tdis: [
                    {
                        out_key: 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
                        tx_pub_key: '1122',
                        internal_output_index: 0,
                    },
                ],
            },
            result: false,
            legacyResults,
        },
    ],
};

export default moneroKeyImageSync;
