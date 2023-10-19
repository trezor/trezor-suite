const { ADDRESS_N, TX_CACHE } = global.TestUtils;

const legacyResults = [
    {
        rules: ['<1.8.1', '<2.1.1'], // Zcash support from coins.json
        success: false,
    },
];

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            // See https://zec1.trezor.io/tx/e5229ae8c02f74af5e0c2100371710424fa85902c29752498c39921de2246824
            description: 'Zcash: inputs v1, no change',
            skip: ['>1.8.3', '>2.1.8'], // test works only in FW range [1.8.1 - 1.8.3] and [2.1.1 - 2.1.8]
            params: {
                coin: 'Zcash',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/133'/0'/0/2"),
                        prev_hash:
                            '84533aa6244bcee68040d851dc4f502838ed3fd9ce838e2e48dbf440e7f4df2a',
                        prev_index: 0,
                    },
                    {
                        address_n: ADDRESS_N("m/44'/133'/0'/1/0"),
                        prev_hash:
                            '84533aa6244bcee68040d851dc4f502838ed3fd9ce838e2e48dbf440e7f4df2a',
                        prev_index: 1,
                    },
                ],
                outputs: [
                    {
                        address: 't1Xin4H451oBDwrKcQeY1VGgMWivLs2hhuR',
                        amount: '10212',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['84533a']),
            },
            result: {
                serializedTx:
                    '01000000022adff4e740f4db482e8e83ced93fed3828504fdc51d84080e6ce4b24a63a5384000000006a473044022066a25c3b0fe18b17327f6080d9e5a26a880cf6ae6c47ff9b7bf9f8a59ab36814022065e4abcdff6f84311ac120b689e5a69db80312446731ab8fe1b3026e29c11ede0121032fd3a554fc321693de4b7cf66649da7726c4d0d3849a7b947774e04d54e38f91ffffffff2adff4e740f4db482e8e83ced93fed3828504fdc51d84080e6ce4b24a63a5384010000006a473044022009fb8f5c4a3ad7960f64a573084b7dec2b73bbe7044328ff05cb6106153014ef022035ab922f75a7c0ff07acd7e99b2469551ce7ff5b830c102d38d175bf3fa8ab74012102a1eb5e72ebdf2a6650593167a4c8391d9a37c2df19e1034fd0e4dc5b525696e9ffffffff01e4270000000000001976a91497e66840d01e615bdcea4a39a1b3afd0a27e6b0188ac00000000',
            },
            legacyResults,
        },
        {
            // See https://zec1.trezor.io/tx/0f762a2da5252d684fb3510a3104bcfb556fab34583b3b0e1994d0f7409cc075
            description: 'Zcash: input v2, no change',
            skip: ['>1.8.3', '>2.1.8'], // test works only in FW range [1.8.1 - 1.8.3] and [2.1.1 - 2.1.8]
            params: {
                coin: 'Zcash',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/133'/0'/0/0"),
                        prev_hash:
                            '29d25589db4623d1a33c58745b8f95b131f49841c79dcd171847d0d7e9e2dc3a',
                        prev_index: 0,
                    },
                ],
                outputs: [
                    {
                        address: 't1N5zTV5PjJqRgSPmszHopk88Nc6mvMBSD7',
                        amount: '72200',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['29d255']),
            },
            result: {
                serializedTx:
                    '01000000013adce2e9d7d0471817cd9dc74198f431b1958f5b74583ca3d12346db8955d229000000006b483045022100f36da2fba65831c24bae2264892d914abdf65ee747ba9e8deeaeb13d1c72b03102200b8ecb59698dbe90f8cfe529a6d05c8b7fa2f31a2f5a7a1b993700a20d04d63a0121022f5c53b6d2e1b64c37d85716dbef318bd398ad7d2a03d94960af060402380658ffffffff01081a0100000000001976a9142e383c56fe3df202792e6f4460c8056b6a4d5b3488ac00000000',
            },
            legacyResults,
        },
        {
            // NOTE: this is not a valid transaction
            // Inputs from https://zec1.trezor.io/tx/e2802f0118d9f41f68b65f2b9f4a7c2efc876aee4e8c4b48c4a4deef6b7c0c28
            description: 'Zcash: unsupported inputs v3, with change',
            params: {
                coin: 'Zcash',
                version: 3,
                overwintered: true,
                versionGroupId: 0x03c48270,
                branchId: 0x5ba81b19,
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/133'/0'/0/2"),
                        prev_hash:
                            '6df53ccdc6fa17e1cd248f7ec57e86178d6f96f2736bdf978602992b5850ac79',
                        prev_index: 1,
                        amount: '5748208',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/133'/0'/1/0"),
                        prev_hash:
                            'e7e1d11992e8fcb88e051e59c2917d78dd9fcd857ee042e0263e995590f02ee3',
                        prev_index: 0,
                        amount: '4154801',
                    },
                ],
                outputs: [
                    {
                        address_n: ADDRESS_N("m/44'/133'/0'/2/0"),
                        amount: '9800000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 't1d8Fhq5vHntotNxPD5SYHaA1Api1zxrHsj',
                        amount: '100000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['6df53c', 'e7e1d1']),
            },
            result: false, // since 2.3.3 Failure_DataError Unsupported transaction version.
            legacyResults: [
                {
                    rules: ['<1.9.3', '<2.3.3'],
                    payload: {
                        serializedTx:
                            '030000807082c4030279ac50582b99028697df6b73f2966f8d17867ec57e8f24cde117fac6cd3cf56d010000006b483045022100f960b9c81d873f3dfafa828f8dbbe7ea88eec4fee41e1e7ccd42113e4b185838022050558c9398572d1c5003aac0b796acf1f177474879fa57c259659be1f9f07de70121032fd3a554fc321693de4b7cf66649da7726c4d0d3849a7b947774e04d54e38f91ffffffffe32ef09055993e26e042e07e85cd9fdd787d91c2591e058eb8fce89219d1e1e7000000006a47304402203a1662a30ae7a54b9b44206f1ee70ce7c5545003e932edcc2a60f01e3ecc90cb0220076e2e963518cee173c0f39b783a48f0fd418e99bb8175defd12993b93a83af1012102a1eb5e72ebdf2a6650593167a4c8391d9a37c2df19e1034fd0e4dc5b525696e9ffffffff0240899500000000001976a9142875b160968fae11ca7fdd0174825c812f24f05688aca0860100000000001976a914d32faea5595826da401c0e486418afd51ce7815488ac000000000000000000',
                    },
                },
                ...legacyResults,
            ],
        },
        {
            // NOTE: this is not a valid transaction
            // Inputs from https://zec1.trezor.io/tx/234b2cf6cb2a50be29f45efae27fe717e3bb31967a72927d122cac1f50988cab
            description: 'Zcash: input v4',
            skip: ['<1.9.0', '<2.2.0', '>1.11.0', '>2.5.0'],
            params: {
                coin: 'Zcash',
                version: 4,
                overwintered: true,
                versionGroupId: 0x892f2085,
                branchId: 0x76b809bb,
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/133'/0'/0/2"),
                        prev_hash:
                            '4264f5f339c9fd498976dabb6d7b8819e112d25a0c1770a0f3ee81de525de8f8',
                        prev_index: 0,
                        amount: '11854',
                    },
                ],
                outputs: [
                    {
                        address: 't1Xin4H451oBDwrKcQeY1VGgMWivLs2hhuR',
                        amount: '10854',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['4264f5']),
            },
            result: {
                serializedTx:
                    '0400008085202f8901f8e85d52de81eef3a070170c5ad212e119887b6dbbda768949fdc939f3f56442000000006b483045022100a9119b34149aa1a14832a4b354d5f36b48f2f149cac78c0c4860cfb2dde1b1f0022013fcdbecc7244d474862e555af159e939b349d757735fd67f477ec13fb13e8d50121032fd3a554fc321693de4b7cf66649da7726c4d0d3849a7b947774e04d54e38f91ffffffff01662a0000000000001976a91497e66840d01e615bdcea4a39a1b3afd0a27e6b0188ac00000000000000000000000000000000000000',
            },
        },
        {
            // https://tzec1.trezor.io/tx/b29b1f27763e8caf9fe51f33a6a7daf138438b5278efcd60941782244e35b19e
            // https://explorer.testnet.z.cash/api/tx/b29b1f27763e8caf9fe51f33a6a7daf138438b5278efcd60941782244e35b19e
            description: 'Zcash testnet: v4',
            skip: ['<1.9.0', '<2.2.0'],
            params: {
                coin: 'taz',
                version: 4,
                overwintered: true,
                versionGroupId: 0x892f2085,
                branchId: 0x76b809bb,
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/7"),
                        prev_hash:
                            '4b6cecb81c825180786ebe07b65bcc76078afc5be0f1c64e08d764005012380d',
                        prev_index: 0,
                        amount: 989680,
                    },
                ],
                outputs: [
                    {
                        address: 'tmBMyeJebzkP5naji8XUKqLyL1NDwNkgJFt',
                        amount: 989680 - 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['4b6cec'], true),
            },
            result: {
                serializedTx:
                    '0400008085202f89010d3812500064d7084ec6f1e05bfc8a0776cc5bb607be6e788051821cb8ec6c4b000000006a473044022067dbf2fddca8efc33da004f91d8e8ace286c4cd4763203a9aac220b011b97cda022005a40a99268ee55ece911d622f3ba0b25aabab9472366018d83712c1484ce8240121035169c4d6a36b6c4f3e210f46d329efa1cb7a67ffce7d62062d4a8a17c23756e1ffffffff01e0f20e00000000001976a9141215d421cb8cec1dea62cbd9e4e07c01520d873f88ac00000000000000000000000000000000000000',
            },
        },
        {
            // https://tzec1.trezor.io/tx/737eb78fc69f30ec9eff04359a1551969e026472ae5530e287a838047e237098
            description: 'Zcash testnet: blossom fork',
            skip: ['<1.9.0', '<2.2.0'],
            params: {
                coin: 'taz',
                version: 4,
                overwintered: true,
                versionGroupId: 0x892f2085,
                branchId: 0x2bb40e60,
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/4"),
                        prev_hash:
                            '86850826b043dd9826b4700c555c06bc8b5713938b4e47cb5ecd60679c6d81dc',
                        prev_index: 1,
                        amount: '50000000',
                    },
                ],
                outputs: [
                    {
                        address: 'tmPixaSEroFtgMRTiNcQj9uPdxSMWA3dz2j',
                        amount: '49998050',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['868508'], true),
            },
            result: {
                serializedTx:
                    '0400008085202f8901dc816d9c6760cd5ecb474e8b9313578bbc065c550c70b42698dd43b026088586010000006a47304402200e512b8da8fc2b76e9cafb3a1dd565ee45cc6f918ad6d47c945d0e07747be5f00220384032b3daec39082b1917438fc82bc9733c69ee9e6c43fbf3505c50508860dd01210313a443e806f25052ac7363adc689fcfa72893f2a51a35ab5e096ed5e6cd8517effffffff01e2e8fa02000000001976a91499af2ecbf5892079e0297c59b91981b067da36a988ac00000000000000000000000000000000000000',
            },
        },
        {
            description: 'Zcash testnet: spend v4 input in NU5 transaction',
            skip: ['<1.11.1', '<2.5.1'],
            params: {
                coin: 'taz',
                // enhancement for v5 is added automatically
                // version: 5,
                // overwintered: true,
                // versionGroupId: 0x26a7270a,
                // branchId: 0xc2d6d0b4,
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/7"),
                        prev_hash:
                            '4b6cecb81c825180786ebe07b65bcc76078afc5be0f1c64e08d764005012380d',
                        prev_index: 0,
                        amount: 989680,
                    },
                ],
                outputs: [
                    {
                        address: 'tmBMyeJebzkP5naji8XUKqLyL1NDwNkgJFt',
                        amount: 989680 - 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                // refTxs: TX_CACHE([]), // v5 doesnt require streaming previous transactions
            },
            result: {
                serializedTx:
                    '050000800a27a726b4d0d6c20000000000000000010d3812500064d7084ec6f1e05bfc8a0776cc5bb607be6e788051821cb8ec6c4b000000006b483045022100cc6efc5678eefec9dd95a890e5961be3e8fc64ea6654959873316fcd2d523d36022036036e2e23071812319d170484926bc641d54028613acaa28b1fd2530013a3400121035169c4d6a36b6c4f3e210f46d329efa1cb7a67ffce7d62062d4a8a17c23756e1ffffffff01e0f20e00000000001976a9141215d421cb8cec1dea62cbd9e4e07c01520d873f88ac000000',
            },
        },
        {
            description: 'Zcash testnet: spend NU5 input',
            skip: ['<1.11.1', '<2.5.1'],
            params: {
                coin: 'taz',
                // enhancement for v5 is added automatically
                // version: 5,
                // overwintered: true,
                // versionGroupId: 0x26a7270a,
                // branchId: 0xc2d6d0b4,
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/9"),
                        prev_hash:
                            'f9231f2d6cdcd86b4892c95a5d2045bacd81f4060e8127073456fbb7b7b51568',
                        prev_index: 0,
                        amount: 4154120,
                    },
                ],
                outputs: [
                    {
                        address: 'tmQoJ3PTXgQLaRRZZYT6xk8XtjRbr2kCqwu',
                        amount: 4154120 - 19400,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                // refTxs: TX_CACHE([]), // v5 doesnt require streaming previous transactions
            },
            result: {
                serializedTx:
                    '050000800a27a726b4d0d6c20000000000000000016815b5b7b7fb56340727810e06f481cdba45205d5ac992486bd8dc6c2d1f23f9000000006a47304402201fc2effdaa338d4fd42a018debed2c8a170c57c7763faabf9596ea408961cc5b02200dd35764d2797723c73f2984c5ea49522d4558ca3c5143e95235f522f65c84b5012102b3397d76b093624981b3c3a279c79496d16820f821528b9e403bdfc162b34c3cffffffff0140173f00000000001976a914a579388225827d9f2fe9014add644487808c695d88ac000000',
            },
        },
        {
            description: 'Zcash testnet: NU5 1 input, 1 ouput, 1 change',
            skip: ['<1.11.1', '<2.5.1'],
            params: {
                coin: 'taz',
                // enhancement for v5 is added automatically
                // version: 5,
                // overwintered: true,
                // versionGroupId: 0x26a7270a,
                // branchId: 0xc2d6d0b4,
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        prev_hash:
                            'c5309bd6a18f6bf374918b1c96e872af02e80d678c53d37547de03048ace79bf',
                        prev_index: 0,
                        amount: 4134720,
                    },
                ],
                outputs: [
                    {
                        address: 'tmCYEhUmZGpzyFrhUdKqwt64DrPqkFNChxx',
                        amount: 1000000,
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        amount: 4134720 - 1000000 - 2000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                // refTxs: TX_CACHE([]), // v5 doesnt require streaming previous transactions
            },
            result: {
                serializedTx:
                    '050000800a27a726b4d0d6c2000000000000000001bf79ce8a0403de4775d3538c670de802af72e8961c8b9174f36b8fa1d69b30c5000000006b483045022100be78eccf801dda4dd33f9d4e04c2aae01022869d1d506d51669204ec269d71a90220394a51838faf40176058cf45fe7032be9c5c942e21aff35d7dbe4b96ab5e0a500121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0ffffffff0240420f00000000001976a9141efeae5c937bfc7f095a06aabdb5476a5d6d19db88ac30cd2f00000000001976a914a579388225827d9f2fe9014add644487808c695d88ac000000',
            },
        },
        {
            description: 'Zcash testnet: NU5 external presigned input',
            skip: ['1', '<2.5.1'], // T1B1 external inputs are not supported in T1B1
            params: {
                coin: 'taz',
                // enhancement for v5 is added automatically
                // version: 5,
                // overwintered: true,
                // versionGroupId: 0x26a7270a,
                // branchId: 0xc2d6d0b4,
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        prev_hash:
                            'e3820602226974b1dd87b7113cc8aea8c63e5ae29293991e7bfa80c126930368',
                        prev_index: 0,
                        amount: 300000000,
                    },
                    {
                        prev_hash:
                            'aaf51e4606c264e47e5c42c958fe4cf1539c5172684721e38e69f4ef634d75dc',
                        prev_index: 1,
                        amount: 300000000,
                        script_type: 'EXTERNAL',
                        script_pubkey: '76a914a579388225827d9f2fe9014add644487808c695d88ac',
                        script_sig:
                            '47304402207635614c690bfe8701ebe822a7322273feaa8d664a82780901628fd4c907879e022011541c320b9d994b16ee7251b41a76e5edb5842cf2fa77db2c9381f32f921b0f0121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0',
                    },
                ],
                outputs: [
                    {
                        address: 'tmJ1xYxP8XNTtCoDgvdmQPSrxh5qZJgy65Z',
                        amount: 300000000 + 300000000 - 1940,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                // refTxs: TX_CACHE([]), // v5 doesnt require streaming previous transactions
            },
            result: {
                serializedTx:
                    '050000800a27a726b4d0d6c200000000000000000268039326c180fa7b1e999392e25a3ec6a8aec83c11b787ddb1746922020682e3000000006b48304502210083493f0a49e80b95469ea933e369500b69e73871d3e6d6c404f4bc8fc98701a80220326f5159a3fa17abc001cc6126ba5268ec78f34cccd559821fb7b57cbe0697080121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0ffffffffdc754d63eff4698ee321476872519c53f14cfe58c9425c7ee464c206461ef5aa010000006a47304402207635614c690bfe8701ebe822a7322273feaa8d664a82780901628fd4c907879e022011541c320b9d994b16ee7251b41a76e5edb5842cf2fa77db2c9381f32f921b0f0121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0ffffffff016c3ec323000000001976a9145b157a678a10021243307e4bb58f36375aa80e1088ac000000',
            },
        },
        {
            description: 'Zcash testnet: NU5 spend multisig',
            skip: ['<1.11.1', '<2.5.1'], // T1B1 external inputs not supported
            params: {
                coin: 'taz',
                // enhancement for v5 is added automatically
                // version: 5,
                // overwintered: true,
                // versionGroupId: 0x26a7270a,
                // branchId: 0xc2d6d0b4,
                inputs: [
                    {
                        address_n: ADDRESS_N("m/48'/1'/1'/0'/0/0"),
                        prev_hash:
                            '431b68c170799a1ba9a936f9bde4ba1fb5606b0ab0a770012875a23d23ba72a3',
                        prev_index: 0,
                        amount: 980600,
                        script_type: 'SPENDMULTISIG',
                        multisig: {
                            pubkeys: [
                                {
                                    node: 'tpubDF4tYm8PaDydbLMZZRqcquYZ6AvxFmyTv6RhSokPh6YxccaCxP1gF2VABKV9wsinAdUbsbdLx1vcXdJH8qRcQMM9VYd926rWM685CepPUdN',
                                    address_n: [0, 0],
                                },
                                {
                                    node: 'tpubDEhpbishBroZWzT7sQf9YuXiyCUSdkK6Cur95UkDdTRcyrJUhLtn69GhC8mJwrxmXRLSUitWAgsXcQ3Cb16EaqFyMob4LHPqzohSzyMMmP5',
                                    address_n: [0, 0],
                                },
                                {
                                    node: 'tpubDFLKt47Wb4BomPVBFW675DKNuhbd9hkx7s1wr2C8GMgQM5Sa5susNc78xKWsjkrkkCQsMT4o7m5RD8ZJqTgh9cjwEQg8pjCxr9Ar77C2wiv',
                                    address_n: [0, 0],
                                },
                            ],
                            signatures: ['', '', ''],
                            m: 2,
                        },
                    },
                ],
                outputs: [
                    {
                        address: 'tmHRQfcNVCZnjY8g6X7Yp6Tcpx8M5gy4Joj',
                        amount: 980600 - 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                // refTxs: TX_CACHE([]), // v5 doesnt require streaming previous transactions
            },
            result: {
                signatures: [
                    '3045022100d1f91921391ca4a985cbe080ce8be71f1b8ceba6049151bffe7dc6cc27a4a4d80220082fb171f7536779cd216f0508e0205039b2f20988d05455dac9bc22bc713005',
                ],
            },
        },
    ],
};
