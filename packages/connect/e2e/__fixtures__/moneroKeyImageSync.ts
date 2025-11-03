export default {
    method: 'moneroKeyImageSync',
    setup: {
        mnemonic: 'all all all all all all all all all all all all',
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
                        iv: '8a8060dd6176067b4c9c669e',
                        key_image:
                            'b3ef74366f0d9d9fd2e5dd47055c6a88961138f4b6292e214de29357103e3193de75702dbe36ccc99fc9264ae59a8e0776450f79bd7f5f95508e0bd4f4aa8e8df200d3d43b7d786bd1327037f66c1f0a88bc0088a3d1ccc8bfadff5f241042a17368235a2ca52790d64e097e027d8c45',
                    },
                ],
            },
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
                        iv: '8a8060dd6176067b4c9c669e',
                        key_image:
                            'b3ef74366f0d9d9fd2e5dd47055c6a88961138f4b6292e214de29357103e3193de75702dbe36ccc99fc9264ae59a8e0776450f79bd7f5f95508e0bd4f4aa8e8df200d3d43b7d786bd1327037f66c1f0a88bc0088a3d1ccc8bfadff5f241042a17368235a2ca52790d64e097e027d8c45',
                    },
                    {
                        iv: '43f2a8ccc6f2149a6d2b901d',
                        key_image:
                            'a90cc3d60d58e538a6b8fda8d8da4cfac219675480fa81a71e292d631962f503bd92889da6316b094a56c8d0acd49f596dea3895da5665150f4edf20eca1815f8d11abbb65f333c9a9a1f079f0a1c6c94c00404956c97507195a09e270aad5af3b305157ffc71f29f41bb154ca207778',
                    },
                    {
                        iv: '90b227cfaf64a80242ca304c',
                        key_image:
                            'ab6007386b8e5817c1091441ecba5bc8a9e63b9c9801d3e60277d466360e84dc18d1eb122b3a9a155fb00b220e3bec4dd45f09ca669ea33717ae82de8abc132832111ac2fa319ae4fbc5c5d77599e45a3dd106513f884a1d076629ea012c60112b1fdd63e7ea700a3af72cf9deebcf43',
                    },
                ],
            },
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
                        iv: '8a8060dd6176067b4c9c669e',
                        key_image:
                            '332961c36b8dadeeb165bc8d9d9860d686aa2c6eae5eb408afa890d3b54c883bf2d4652c2446ed58ccd41cc50221d59e4600ea320686a32993234b38e0f6a88f529d642e4006e656e18071206fa5714ba2e279c563feee5c3e68021aa67265a06d6be66df2b5b6f3f71339189276bef2',
                    },
                ],
            },
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
                        iv: '8a8060dd6176067b4c9c669e',
                        key_image:
                            'b02a70f7632532de7175d417948d90d7fd6daffd3dbf733f8f8258aaf5bdda3d01da6eb300c9b619f4c25e16e6f7cf7fdf83479b9b33b0907b36779bd4c77487bf4d7812e9a962b633e9b991b828f1bcd09493606550cfe343cf0b6f923e5aa143d0e5550d73cacbd0c8f0c974280aac',
                    },
                ],
            },
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
        },
        {
            description: 'Invalid - empty tdis array',
            params: {
                path: "m/44'/128'/0'",
                tdis: [],
            },
            result: false,
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
        },
    ],
} satisfies TestCase;
