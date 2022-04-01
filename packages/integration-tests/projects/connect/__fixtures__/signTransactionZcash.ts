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
            skip: ['<1.9.0', '<2.2.0'],
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
            // https://tzec1.trezor.io/tx/0cef132c1d6d67f11cfa48f7fca3209da29cf872ac782354bedb686e61a17a78
            // https://explorer.testnet.z.cash/api/tx/0cef132c1d6d67f11cfa48f7fca3209da29cf872ac782354bedb686e61a17a78
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
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        prev_hash:
                            'e3820602226974b1dd87b7113cc8aea8c63e5ae29293991e7bfa80c126930368',
                        prev_index: 0,
                        amount: '300000000',
                    },
                ],
                outputs: [
                    {
                        address: 'tmJ1xYxP8XNTtCoDgvdmQPSrxh5qZJgy65Z',
                        amount: '299998060',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['e38206'], true),
            },
            result: {
                serializedTx:
                    '0400008085202f890168039326c180fa7b1e999392e25a3ec6a8aec83c11b787ddb1746922020682e3000000006b483045022100f28298891f48706697a6f898ac18e39ce2c7cebe547b585d51cc22d80b1b21a602201a807b8a18544832d95d1e3ada82c0617bc6d97d3f24d1fb4801ac396647aa880121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0ffffffff016c9be111000000001976a9145b157a678a10021243307e4bb58f36375aa80e1088ac00000000000000000000000000000000000000',
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
        // todo: heartwood test
    ],
};
