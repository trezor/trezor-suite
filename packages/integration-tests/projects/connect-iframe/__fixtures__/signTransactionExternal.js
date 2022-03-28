// fixures: https://github.com/trezor/trezor-firmware/blob/master/tests/device_tests/bitcoin/test_signtx_external.py

const { ADDRESS_N, TX_CACHE } = global.TestUtils;

const legacyResults = [
    {
        // pretaproot firmwares - EXTERNAL and PAYTOTAPROOT script types not supported
        rules: ['<2.4.3', '<1.10.5'],
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
            description: 'Testnet (P2PKH): presigned',
            // todo: T1 error, tested with 1.10.6:
            // "code": "Failure_DataError",
            // "error": "signing.c:1021:Unsupported script type.",
            skip: ['1'],
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        amount: '31000000',
                        prev_hash:
                            'e5040e1bc1ae7667ffb9e5248e90b2fb93cd9150234151ce90e14ab2f5933bcd',
                        prev_index: 0,
                        script_type: 'EXTERNAL',
                        script_pubkey: '76a914a579388225827d9f2fe9014add644487808c695d88ac',
                        script_sig:
                            '473044022054fa66bfe1de1c850d59840f165143a66075bae78be3a6bc2809d1ac09431d380220019ecb086e16384f18cbae09b02bd2dce18763cd06454d33d93630561250965e0121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/1"),
                        amount: '600000000',
                        prev_hash:
                            'd830b877c3d9237a0a68be88825a296da01ac282a2efd2f671d8f17f15117b74',
                        prev_index: 1,
                    },
                    // same set of inputs, but reversed external type. produces same result
                    // {
                    //     address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                    //     amount: '31000000',
                    //     prev_hash:
                    //         'e5040e1bc1ae7667ffb9e5248e90b2fb93cd9150234151ce90e14ab2f5933bcd',
                    //     prev_index: 0,
                    // },
                    // {
                    //     amount: '600000000',
                    //     prev_hash:
                    //         'd830b877c3d9237a0a68be88825a296da01ac282a2efd2f671d8f17f15117b74',
                    //     prev_index: 1,
                    //     script_type: 'EXTERNAL',
                    //     script_pubkey: '76a9145b157a678a10021243307e4bb58f36375aa80e1088ac',
                    //     script_sig:
                    //         '463043021f3a0a7fdf27b340358ddf8b4e6e3e6cc0be728d6f1d9d3413ae59741f57599002204809d59a9432a2c7fcb10639c5efa82935d8c3cc21b185ff5e44f0e1a80e635401210294e3e5e77e22eea0e4c0d30d89beb4db7f69b4bf1ae709e411d6a06618b8f852',
                    // },
                ],
                outputs: [
                    {
                        address: 'tb1qnspxpr2xj9s2jt6qlhuvdnxw6q55jvygcf89r2',
                        amount: '620000000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/1/0"),
                        amount: '10990000', // 31000000 + 600000000 - 620000000 - 10000
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['e5040e', 'd830b8']),
            },
            result: {
                serializedTx:
                    '0100000002cd3b93f5b24ae190ce5141235091cd93fbb2908e24e5b9ff6776aec11b0e04e5000000006a473044022054fa66bfe1de1c850d59840f165143a66075bae78be3a6bc2809d1ac09431d380220019ecb086e16384f18cbae09b02bd2dce18763cd06454d33d93630561250965e0121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0ffffffff747b11157ff1d871f6d2efa282c21aa06d295a8288be680a7a23d9c377b830d80100000069463043021f3a0a7fdf27b340358ddf8b4e6e3e6cc0be728d6f1d9d3413ae59741f57599002204809d59a9432a2c7fcb10639c5efa82935d8c3cc21b185ff5e44f0e1a80e635401210294e3e5e77e22eea0e4c0d30d89beb4db7f69b4bf1ae709e411d6a06618b8f852ffffffff020073f424000000001600149c02608d469160a92f40fdf8c6ccced029493088b0b1a700000000001976a9143d3cca567e00a04819742b21a696a67da796498b88ac00000000',
            },
            legacyResults,
        },
        {
            description: 'Testnet (P2SH): presigned',
            // todo: T1 error, tested with 1.10.6:
            // "code": "Failure_DataError",
            // "error": "signing.c:1021:Unsupported script type.",
            skip: ['1'],
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        amount: '111145789',
                        prev_hash:
                            '09144602765ce3dd8f4329445b20e3684e948709c5cdcaf12da3bb079c99448a',
                        prev_index: 1,
                        script_type: 'EXTERNAL',
                        script_pubkey: 'a91458b53ea7f832e8f096e896b8713a8c6df0e892ca87',
                        script_sig: '160014d16b8c0680c61fc6ed2e407455715055e41052f5',
                        witness:
                            '02483045022100ead79ee134f25bb585b48aee6284a4bb14e07f03cc130253e83450d095515e5202201e161e9402c8b26b666f2b67e5b668a404ef7e57858ae9a6a68c3837e65fdc69012103e7bfe10708f715e8538c92d46ca50db6f657bbc455b7494e6a0303ccdb868b79',
                    },
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/1/0"),
                        amount: '7289000',
                        prev_hash:
                            '65b811d3eca0fe6915d9f2d77c86c5a7f19bf66b1b1253c2c51cb4ae5f0c017b',
                        prev_index: 1,
                        script_type: 'SPENDWITNESS',
                    },
                ],
                outputs: [
                    {
                        address: 'tb1q54un3q39sf7e7tlfq99d6ezys7qgc62a6rxllc',
                        amount: '12300000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: '2N6UeBoqYEEnybg4cReFYDammpsyDw8R2Mc',
                        amount: '45600000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q',
                        amount: '60523789', // 111145789 + 7289000 - 11000 - 12300000 - 45600000
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['091446', '65b811']),
            },
            result: {
                serializedTx:
                    '010000000001028a44999c07bba32df1cacdc50987944e68e3205b4429438fdde35c76024614090100000017160014d16b8c0680c61fc6ed2e407455715055e41052f5ffffffff7b010c5faeb41cc5c253121b6bf69bf1a7c5867cd7f2d91569fea0ecd311b8650100000000ffffffff03e0aebb0000000000160014a579388225827d9f2fe9014add644487808c695d00cdb7020000000017a91491233e24a9bf8dbb19c1187ad876a9380c12e787870d859b03000000001976a914a579388225827d9f2fe9014add644487808c695d88ac02483045022100ead79ee134f25bb585b48aee6284a4bb14e07f03cc130253e83450d095515e5202201e161e9402c8b26b666f2b67e5b668a404ef7e57858ae9a6a68c3837e65fdc69012103e7bfe10708f715e8538c92d46ca50db6f657bbc455b7494e6a0303ccdb868b7902463043021f585c54a84dc7326fa60e22729accd41153c7dd4725bd4c8f751aa3a8cd8d6a0220631bfd83fc312cc6d5d129572a25178696d81eaf50c8c3f16c6121be4f4c029d012103505647c017ff2156eb6da20fae72173d3b681a1d0a629f95f49e884db300689f00000000',
            },
            legacyResults,
        },
        {
            description: 'Testnet (P2WPKH): presigned',
            // todo: T1 error, tested with 1.10.6:
            // "code": "Failure_DataError",
            // "error": "signing.c:1021:Unsupported script type.",
            skip: ['1'],
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/0/0"),
                        amount: '100000',
                        prev_hash:
                            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                        prev_index: 0,
                        script_type: 'SPENDWITNESS',
                    },
                    {
                        amount: '10000',
                        prev_hash:
                            '65b768dacccfb209eebd95a1fb80a04f1dd6a3abc6d7b41d5e9d9f91605b37d9',
                        prev_index: 0,
                        script_type: 'EXTERNAL',
                        script_pubkey: '0014fb7e49f4017dc951615dea221b66626189aa43b9',
                        script_sig: '',
                        witness:
                            '024730440220432ac60461de52713ad543cbb1484f7eca1a72c615d539b3f42f5668da4501d2022063786a6d6940a5c1ed9c2d2fd02cef90b6c01ddd84829c946561e15be6c0aae1012103dcf3bc936ecb2ec57b8f468050abce8c8756e75fd74273c9977744b1a0be7d03',
                    },
                ],
                outputs: [
                    {
                        address: 'tb1qnspxpr2xj9s2jt6qlhuvdnxw6q55jvygcf89r2',
                        amount: '50000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/1/0"),
                        amount: '59000', // 100000 + 10000 - 50000 - 1000
                        script_type: 'PAYTOWITNESS',
                    },
                ],
                refTxs: TX_CACHE(['70f987', '65b768']),
            },
            result: {
                serializedTx:
                    '010000000001029e506939e23ad82a559f2c5e812d13788644e1e0017afd5c40383ab01e87f9700000000000ffffffffd9375b60919f9d5e1db4d7c6aba3d61d4fa080fba195bdee09b2cfccda68b7650000000000ffffffff0250c30000000000001600149c02608d469160a92f40fdf8c6ccced02949308878e6000000000000160014cc8067093f6f843d6d3e22004a4290cd0c0f336b0247304402207be75627767e59046da2699328ca1c27b60cfb34bb257a9d90442e496b5f936202201f43e2b55e1b2acf5677d3e29b9c5a78e2a4ae03a01be5c50a17cf4b88a3b278012103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f862024730440220432ac60461de52713ad543cbb1484f7eca1a72c615d539b3f42f5668da4501d2022063786a6d6940a5c1ed9c2d2fd02cef90b6c01ddd84829c946561e15be6c0aae1012103dcf3bc936ecb2ec57b8f468050abce8c8756e75fd74273c9977744b1a0be7d0300000000',
            },
            legacyResults,
        },
        {
            description: 'Testnet (P2WSH): presigned',
            // todo: T1 error, tested with 1.10.6:
            // "code": "Failure_DataError",
            // "error": "messages.c:231:bytes overflow",
            skip: ['1'],
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/0/0"),
                        amount: '12300000',
                        prev_hash:
                            '09144602765ce3dd8f4329445b20e3684e948709c5cdcaf12da3bb079c99448a',
                        prev_index: 0,
                        script_type: 'SPENDWITNESS',
                    },
                    {
                        amount: '100',
                        prev_hash:
                            'a345b85759b385c6446055e4c3baa77e8161a65009dc009489b48aa6587ce348',
                        prev_index: 0,
                        script_type: 'EXTERNAL',
                        script_pubkey:
                            '002008b681071cd896cd879102bce735080758ad48ad45a05505939e55f115391991',
                        witness:
                            '030047304402206b570b99c22c841548a35a9b9c673fa3b87a9563ed64ad7d979aa3e01b2e303802201d0bebf58b7243e09798e734fc32892936c4d0c4984bec755dc951ef646e4a9a0147512103505f0d82bbdd251511591b34f36ad5eea37d3220c2b81a1189084431ddb3aa3d2103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f86252ae',
                    },
                ],
                outputs: [
                    {
                        address: '2N4Q5FhU2497BryFfUgbqkAJE87aKHUhXMp',
                        amount: '12290100', // 12300000 + 100 - 10000
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['091446', 'a345b8']),
            },
            result: {
                serializedTx:
                    '010000000001028a44999c07bba32df1cacdc50987944e68e3205b4429438fdde35c76024614090000000000ffffffff48e37c58a68ab4899400dc0950a661817ea7bac3e4556044c685b35957b845a30000000000ffffffff013488bb000000000017a9147a55d61848e77ca266e79a39bfc85c580a6426c9870247304402204270cf602ec151e72b99c5048755379c368c6c7cd722e4234ad4bb7b1b87d09d02207fa59b1c2926ea6b4f0094ab77c08e50b089a199a5bc8419e1ee6674809c4fb4012103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f862030047304402206b570b99c22c841548a35a9b9c673fa3b87a9563ed64ad7d979aa3e01b2e303802201d0bebf58b7243e09798e734fc32892936c4d0c4984bec755dc951ef646e4a9a0147512103505f0d82bbdd251511591b34f36ad5eea37d3220c2b81a1189084431ddb3aa3d2103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f86252ae00000000',
            },
            legacyResults,
        },
        {
            description: 'Testnet (P2TR): external presigned',
            // todo: T1 error, tested with 1.10.6:
            // "code": "Failure_DataError",
            // "error": "signing.c:1021:Unsupported script type.",
            skip: ['1'],
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/86'/1'/0'/0/0"),
                        amount: '6800',
                        prev_hash:
                            'df862e31da31ff84addd392f6aa89af18978a398ea258e4901ae72894b66679f',
                        prev_index: 0,
                        script_type: 'SPENDTAPROOT',
                    },
                    {
                        amount: '13000',
                        prev_hash:
                            '3ac32e90831d79385eee49d6030a2123cd9d009fe8ffc3d470af9a6a777a119b',
                        prev_index: 1,
                        script_type: 'EXTERNAL',
                        script_pubkey:
                            '51203ad9b641978673e88ee4d9f4e5d63400c1b2a8304c09726bb19d10ead2829cc2',
                        witness:
                            '01409956e47403278bf76eecbbbc3af0c2731d8347763825248a2e0f39aca5a684a7d5054e7222a1033fb5864a886180f1a8c64adab12433c78298d1f83e4c8f46e1',
                    },
                ],
                outputs: [
                    {
                        address: 'tb1q7r9yvcdgcl6wmtta58yxf29a8kc96jkyxl7y88',
                        amount: '15000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/86'/1'/0'/1/0"),
                        amount: '4600', // 6800 + 13000 - 200 - 15000
                        script_type: 'PAYTOTAPROOT',
                    },
                ],
                refTxs: TX_CACHE(['df862e', '3ac32e']),
            },
            result: {
                serializedTx:
                    '010000000001029f67664b8972ae01498e25ea98a37889f19aa86a2f39ddad84ff31da312e86df0000000000ffffffff9b117a776a9aaf70d4c3ffe89f009dcd23210a03d649ee5e38791d83902ec33a0100000000ffffffff02983a000000000000160014f0ca4661a8c7f4edad7da1c864a8bd3db05d4ac4f8110000000000002251209a9af24b396f593b34e23fefba6b417a55c5ee3f430c3837379fcb5246ab36d70140b51992353d2f99b7b620c0882cb06694996f1b6c7e62a3c1d3036e0f896fbf0b92f3d9aeab94f2454809a501715667345f702c8214693f469225de5f6636b86b01409956e47403278bf76eecbbbc3af0c2731d8347763825248a2e0f39aca5a684a7d5054e7222a1033fb5864a886180f1a8c64adab12433c78298d1f83e4c8f46e100000000',
            },
            legacyResults,
        },
        {
            description: 'Testnet (P2WPKH): with proof',
            // todo: T1 error, tested with 1.10.6:
            // "code": "Failure_DataError",
            // "error": "signing.c:1021:Unsupported script type.",
            skip: ['1'],
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        amount: '100000',
                        prev_hash:
                            'e5b7e21b5ba720e81efd6bfa9f854ababdcddc75a43bfa60bf0fe069cfd1bb8a',
                        prev_index: 0,
                        script_type: 'EXTERNAL',
                        script_pubkey: '00149c02608d469160a92f40fdf8c6ccced029493088',
                        ownership_proof:
                            '534c001900016b2055d8190244b2ed2d46513c40658a574d3bc2deb6969c0535bb818b44d2c4000247304402201b0a2cd9398f5f3b63e624bb960436a45bdacbd5174b29a47ed3f659b2d4137b022007f8981f476216e012a04956ce77a483cdbff2905227b103a48a15e61379c43d012103505f0d82bbdd251511591b34f36ad5eea37d3220c2b81a1189084431ddb3aa3d',
                    },
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/1/0"),
                        amount: '7289000',
                        prev_hash:
                            '65b811d3eca0fe6915d9f2d77c86c5a7f19bf66b1b1253c2c51cb4ae5f0c017b',
                        prev_index: 1,
                        script_type: 'SPENDWITNESS',
                    },
                ],
                outputs: [
                    {
                        address: 'tb1q54un3q39sf7e7tlfq99d6ezys7qgc62a6rxllc',
                        amount: '1230000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q',
                        amount: '6148000', // 100000 + 7289000 - 11000 - 1230000
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['e5b7e2', '65b811']),
            },
            result: {
                serializedTx:
                    '010000000001028abbd1cf69e00fbf60fa3ba475dccdbdba4a859ffa6bfd1ee820a75b1be2b7e50000000000ffffffff7b010c5faeb41cc5c253121b6bf69bf1a7c5867cd7f2d91569fea0ecd311b8650100000000ffffffff02b0c4120000000000160014a579388225827d9f2fe9014add644487808c695da0cf5d00000000001976a914a579388225827d9f2fe9014add644487808c695d88ac0002483045022100b17fe0eb21da96bdf9640bbe94f6198ff2ced183765753ee3d5119e661977cb20220121dfdc7a121afdcc08fae1389c7147a10bc58b2daea46799c6e6547c648ba1d012103505647c017ff2156eb6da20fae72173d3b681a1d0a629f95f49e884db300689f00000000',
            },
            legacyResults: [
                {
                    // bug in prev implementation https://github.com/trezor/trezor-firmware/pull/2034
                    rules: ['<2.4.4', '1.10.5'],
                    success: false,
                },
            ],
        },
        {
            // todo: T1 error, tested with 1.10.6:
            // "code": "Failure_DataError",
            // "error": "signing.c:1021:Unsupported script type.",
            description: 'Testnet (P2TR): with proof',
            skip: ['1'],
            setup: {
                mnemonic: 'mnemonic_abandon', // <- important, external input is from all-all (previous case)
            },
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        amount: '100892',
                        prev_hash:
                            'afde2d41702948e922150825742cda3294d80d43b8e508865c1e2d648f6d4dae',
                        prev_index: 2,
                        script_type: 'EXTERNAL',
                        script_pubkey:
                            '5120272393e4c1de4919d3771f755c17f711cfaa0d2bdf72d777cd6b4c3fd97c66b9',
                        ownership_proof:
                            '534c001900015f6c298a141152b5aef9ef31badea5ceaf9f628a968bed0a14d5ad660761cf1c00014022269a1567cb4f892d0702e6be1175de8b892eda26ffde896d2d240814a747e0b574819431c9c8c95c364f15f447019fe3d4dcc6229110d0598f0265af2b5945',
                    },
                    {
                        address_n: ADDRESS_N("m/86'/1'/0'/0/0"),
                        amount: '6456',
                        prev_hash:
                            '4012d9abb675243758b8f2cfd0042ce9a6c1459aaf5327dcac16c80f9eff1cbf',
                        prev_index: 0,
                        script_type: 'SPENDTAPROOT',
                    },
                ],
                outputs: [
                    {
                        address: 'tb1puyst6yj0x3w5z253k5xt0crk2zjy36g0fzhascd4wknxfwv9h9lszyhefk',
                        amount: '107048', // 100892 + 6456 - 300
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['afde2d', '4012d9']),
            },
            result: {
                serializedTx:
                    '01000000000102ae4d6d8f642d1e5c8608e5b8430dd89432da2c7425081522e9482970412ddeaf0200000000ffffffffbf1cff9e0fc816acdc2753af9a45c1a6e92c04d0cff2b858372475b6abd912400000000000ffffffff0128a2010000000000225120e120bd124f345d412a91b50cb7e07650a448e90f48afd861b575a664b985b97f000140af196d0b64cfe8b5e7a2074b43ec1f11bfdea1df3ecb3b9d6c17e7542d7ca43b698237b5b9788cb49fa758f787311bc79bcbfa4e6046271c682927d7a9c2480900000000',
            },
            legacyResults: [
                {
                    // bug in prev implementation https://github.com/trezor/trezor-firmware/pull/2034
                    rules: ['<2.4.4', '1.10.5'],
                    success: false,
                },
            ],
        },
    ],
};
