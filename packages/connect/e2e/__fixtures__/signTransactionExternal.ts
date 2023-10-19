// fixures: https://github.com/trezor/trezor-firmware/blob/main/tests/device_tests/bitcoin/test_signtx_external.py

const { ADDRESS_N, TX_CACHE } = global.TestUtils;

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Testnet (P2PKH): presigned',
            // todo: T1B1 error, tested with 1.10.6:
            // "code": "Failure_DataError",
            // "error": "signing.c:1021:Unsupported script type.",
            skip: ['1', '<2.3.2'],
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
        },
        {
            description: 'Testnet (P2SH): presigned',
            // todo: T1B1 error, tested with 1.10.6:
            // "code": "Failure_DataError",
            // "error": "signing.c:1021:Unsupported script type.",
            skip: ['1', '<2.3.2'],
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        amount: '123456789',
                        prev_hash:
                            '20912f98ea3ed849042efed0fdac8cb4fc301961c5988cba56902d8ffb61c337',
                        prev_index: 0,
                        script_type: 'EXTERNAL',
                        script_pubkey: 'a91458b53ea7f832e8f096e896b8713a8c6df0e892ca87',
                        script_sig: '160014d16b8c0680c61fc6ed2e407455715055e41052f5',
                        witness:
                            '024830450221009962940c7524c8dee6807d76e0ce1ba4a943604db0bce61357dabe5a4ce2d93a022014fa33769e33eb7e6051d9db28f06cff7ead6c7013839cc26c43f887736a9af1012103e7bfe10708f715e8538c92d46ca50db6f657bbc455b7494e6a0303ccdb868b79',
                    },
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/0/0"),
                        amount: '10000',
                        prev_hash:
                            'ec16dc5a539c5d60001a7471c37dbb0b5294c289c77df8bd07870b30d73e2231',
                        prev_index: 0,
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
                        amount: 123456789 + 10000 - 11000 - 12300000 - 45600000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['20912f', 'ec16dc']),
            },
            result: {
                serializedTx:
                    '0100000000010237c361fb8f2d9056ba8c98c5611930fcb48cacfdd0fe2e0449d83eea982f91200000000017160014d16b8c0680c61fc6ed2e407455715055e41052f5ffffffff31223ed7300b8707bdf87dc789c294520bbb7dc371741a00605d9c535adc16ec0000000000ffffffff03e0aebb0000000000160014a579388225827d9f2fe9014add644487808c695d00cdb7020000000017a91491233e24a9bf8dbb19c1187ad876a9380c12e787874d4de803000000001976a914a579388225827d9f2fe9014add644487808c695d88ac024830450221009962940c7524c8dee6807d76e0ce1ba4a943604db0bce61357dabe5a4ce2d93a022014fa33769e33eb7e6051d9db28f06cff7ead6c7013839cc26c43f887736a9af1012103e7bfe10708f715e8538c92d46ca50db6f657bbc455b7494e6a0303ccdb868b7902473044022009b2654cd576227c781b14b775df4749d0bcc5661cc39a08b5c42b8ffbc33c5d02203893cc57c46811ec2fb2d27764f3a3b3406040a24d1373cc7f38f79d80dfef1f012103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f86200000000',
                witnesses: [
                    '024830450221009962940c7524c8dee6807d76e0ce1ba4a943604db0bce61357dabe5a4ce2d93a022014fa33769e33eb7e6051d9db28f06cff7ead6c7013839cc26c43f887736a9af1012103e7bfe10708f715e8538c92d46ca50db6f657bbc455b7494e6a0303ccdb868b79',
                    '02473044022009b2654cd576227c781b14b775df4749d0bcc5661cc39a08b5c42b8ffbc33c5d02203893cc57c46811ec2fb2d27764f3a3b3406040a24d1373cc7f38f79d80dfef1f012103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f862',
                ],
            },
        },
        {
            description: 'Testnet (P2WPKH): presigned',
            // todo: T1B1 error, tested with 1.10.6:
            // "code": "Failure_DataError",
            // "error": "signing.c:1021:Unsupported script type.",
            skip: ['1', '<2.3.2'],
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
                witnesses: [
                    '0247304402207be75627767e59046da2699328ca1c27b60cfb34bb257a9d90442e496b5f936202201f43e2b55e1b2acf5677d3e29b9c5a78e2a4ae03a01be5c50a17cf4b88a3b278012103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f862',
                    '024730440220432ac60461de52713ad543cbb1484f7eca1a72c615d539b3f42f5668da4501d2022063786a6d6940a5c1ed9c2d2fd02cef90b6c01ddd84829c946561e15be6c0aae1012103dcf3bc936ecb2ec57b8f468050abce8c8756e75fd74273c9977744b1a0be7d03',
                ],
            },
        },
        {
            description: 'Testnet (P2WSH): presigned',
            // todo: T1B1 error, tested with 1.10.6:
            // "code": "Failure_DataError",
            // "error": "messages.c:231:bytes overflow",
            skip: ['1', '<2.3.2'],
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/0/0"),
                        amount: '10000',
                        prev_hash:
                            'ec16dc5a539c5d60001a7471c37dbb0b5294c289c77df8bd07870b30d73e2231',
                        prev_index: 0,
                        script_type: 'SPENDWITNESS',
                    },
                    {
                        amount: '100000',
                        prev_hash:
                            '1c022d9da3aa8bc8cf2a617c42c8f2c343e810af76b3ab9770c5ab6ca54ddab5',
                        prev_index: 2,
                        script_type: 'EXTERNAL',
                        script_pubkey:
                            '002008b681071cd896cd879102bce735080758ad48ad45a05505939e55f115391991',
                        witness:
                            '03004830450221009c74f5b89440665857f2c775f7c63eb208456aeda12ef9f4ba2c739474f3436202205a069c3bcb31a9fe751818920ae94db4087d432ebd2762741922281d205ac3620147512103505f0d82bbdd251511591b34f36ad5eea37d3220c2b81a1189084431ddb3aa3d2103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f86252ae',
                    },
                ],
                outputs: [
                    {
                        address: '2N4Q5FhU2497BryFfUgbqkAJE87aKHUhXMp',
                        amount: 10000 + 100000 - 1000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['ec16dc', '1c022d']),
            },
            result: {
                serializedTx:
                    '0100000000010231223ed7300b8707bdf87dc789c294520bbb7dc371741a00605d9c535adc16ec0000000000ffffffffb5da4da56cabc57097abb376af10e843c3f2c8427c612acfc88baaa39d2d021c0200000000ffffffff01c8a901000000000017a9147a55d61848e77ca266e79a39bfc85c580a6426c9870247304402207ec2960e148af81ac1bf570e59a9e17566c9db539826fe6edec622e4378da203022051e4c877ef6ef67700cc9038b9969355f104b608f7b4ed4ee573f3608cc40b69012103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f86203004830450221009c74f5b89440665857f2c775f7c63eb208456aeda12ef9f4ba2c739474f3436202205a069c3bcb31a9fe751818920ae94db4087d432ebd2762741922281d205ac3620147512103505f0d82bbdd251511591b34f36ad5eea37d3220c2b81a1189084431ddb3aa3d2103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f86252ae00000000',
                witnesses: [
                    '0247304402207ec2960e148af81ac1bf570e59a9e17566c9db539826fe6edec622e4378da203022051e4c877ef6ef67700cc9038b9969355f104b608f7b4ed4ee573f3608cc40b69012103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f862',
                    '03004830450221009c74f5b89440665857f2c775f7c63eb208456aeda12ef9f4ba2c739474f3436202205a069c3bcb31a9fe751818920ae94db4087d432ebd2762741922281d205ac3620147512103505f0d82bbdd251511591b34f36ad5eea37d3220c2b81a1189084431ddb3aa3d2103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f86252ae',
                ],
            },
        },
        {
            description: 'Testnet (P2TR): external presigned',
            // todo: T1B1 error, tested with 1.10.6:
            // "code": "Failure_DataError",
            // "error": "signing.c:1021:Unsupported script type.",
            skip: ['1', '<2.4.3'],
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/86'/1'/0'/0/1"),
                        amount: 13000,
                        prev_hash:
                            '1010b25957a30110377a33bd3b0bd39045b3cc488d0e534d1ea5ec238812c0fc',
                        prev_index: 1,
                        script_type: 'SPENDTAPROOT',
                    },
                    {
                        amount: 6800,
                        prev_hash:
                            '1010b25957a30110377a33bd3b0bd39045b3cc488d0e534d1ea5ec238812c0fc',
                        prev_index: 0,
                        script_type: 'EXTERNAL',

                        script_pubkey:
                            '512083860592dcc9c672acbca8c23941e85d402b353ce0e099b01dec52a203eff0b6',
                        witness:
                            '0140e241b85650814f35a6a8fe277d8cd784e897b7f032b73cc2f5326dac5991e8f43d54861d624cc119f5409c7d0def65a613691dc17a3700bbc8639a1c8a3184f0',
                    },
                ],
                outputs: [
                    {
                        address: 'tb1qq0rurzt04d76hk7pjxhqggk7ad4zj7c9u369kt',
                        amount: 15000,
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/86'/1'/0'/1/0"),
                        amount: 4600,
                        script_type: 'PAYTOTAPROOT',
                    },
                ],
                // refTxs: TX_CACHE([]), // Taproot inputs doesnt require streaming previous transactions
            },
            result: {
                serializedTx:
                    '01000000000102fcc0128823eca51e4d530e8d48ccb34590d30b3bbd337a371001a35759b210100100000000fffffffffcc0128823eca51e4d530e8d48ccb34590d30b3bbd337a371001a35759b210100000000000ffffffff02983a00000000000016001403c7c1896fab7dabdbc191ae0422deeb6a297b05f8110000000000002251209a9af24b396f593b34e23fefba6b417a55c5ee3f430c3837379fcb5246ab36d701405c014bd3cdc94fb1a2d4ead3509fbed1ad3065ad931ea1e998ed29f73212a2506f2ac39a526c237bbf22af75afec64bb9b484b040c72016e30b1337a6274a9ae0140e241b85650814f35a6a8fe277d8cd784e897b7f032b73cc2f5326dac5991e8f43d54861d624cc119f5409c7d0def65a613691dc17a3700bbc8639a1c8a3184f000000000',
                witnesses: [
                    '01405c014bd3cdc94fb1a2d4ead3509fbed1ad3065ad931ea1e998ed29f73212a2506f2ac39a526c237bbf22af75afec64bb9b484b040c72016e30b1337a6274a9ae',
                    '0140e241b85650814f35a6a8fe277d8cd784e897b7f032b73cc2f5326dac5991e8f43d54861d624cc119f5409c7d0def65a613691dc17a3700bbc8639a1c8a3184f0',
                ],
            },
            legacyResults: [
                {
                    // bug in prev implementation https://github.com/trezor/trezor-firmware/pull/2034
                    rules: ['<2.4.4'],
                    success: true,
                    payload: {
                        serializedTx:
                            '01000000000102fcc0128823eca51e4d530e8d48ccb34590d30b3bbd337a371001a35759b210100100000000fffffffffcc0128823eca51e4d530e8d48ccb34590d30b3bbd337a371001a35759b210100000000000ffffffff02983a00000000000016001403c7c1896fab7dabdbc191ae0422deeb6a297b05f8110000000000002251209a9af24b396f593b34e23fefba6b417a55c5ee3f430c3837379fcb5246ab36d70140ff5f52196789bc8b8d1940a71d18eee3587eaa5f654e40d899aadb6245e1d462827dc3d7ee92d481e69f91932fe851cff702ab0d6d1582cd19b0358cff76559e0140e241b85650814f35a6a8fe277d8cd784e897b7f032b73cc2f5326dac5991e8f43d54861d624cc119f5409c7d0def65a613691dc17a3700bbc8639a1c8a3184f000000000',
                    },
                },
            ],
        },
        {
            description: 'Testnet (P2WPKH): with proof',
            // todo: T1B1 error, tested with 1.10.6:
            // "code": "Failure_DataError",
            // "error": "signing.c:1021:Unsupported script type.",
            skip: ['1', '<2.4.4'], // bug in prev implementation https://github.com/trezor/trezor-firmware/pull/2034
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
                        address_n: ADDRESS_N("m/84'/1'/0'/0/0"),
                        amount: '10000',
                        prev_hash:
                            'ec16dc5a539c5d60001a7471c37dbb0b5294c289c77df8bd07870b30d73e2231',
                        prev_index: 0,
                        script_type: 'SPENDWITNESS',
                    },
                ],
                outputs: [
                    {
                        address: 'tb1q54un3q39sf7e7tlfq99d6ezys7qgc62a6rxllc',
                        amount: '55555',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q',
                        amount: 100000 + 10000 - 11000 - 55555,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['e5b7e2', 'ec16dc']),
            },
            result: {
                serializedTx:
                    '010000000001028abbd1cf69e00fbf60fa3ba475dccdbdba4a859ffa6bfd1ee820a75b1be2b7e50000000000ffffffff31223ed7300b8707bdf87dc789c294520bbb7dc371741a00605d9c535adc16ec0000000000ffffffff0203d9000000000000160014a579388225827d9f2fe9014add644487808c695db5a90000000000001976a914a579388225827d9f2fe9014add644487808c695d88ac000247304402204ab2dfe9eb1268c1cea7d997ae10070c67a26d1c52eb8af06d2e8a4f8befeee30220445294f1568782879c84bf216c80c0f01dc332569c2afd1be5381b0d5a8d6d69012103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f86200000000',
                witnesses: [
                    undefined,
                    '0247304402204ab2dfe9eb1268c1cea7d997ae10070c67a26d1c52eb8af06d2e8a4f8befeee30220445294f1568782879c84bf216c80c0f01dc332569c2afd1be5381b0d5a8d6d69012103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f862',
                ],
            },
        },
        {
            // todo: T1B1 error, tested with 1.10.6:
            // "code": "Failure_DataError",
            // "error": "signing.c:1021:Unsupported script type.",
            description: 'Testnet (P2TR): with proof',
            skip: ['1', '<2.4.4'], // bug in prev implementation https://github.com/trezor/trezor-firmware/pull/2034
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
                // refTxs: TX_CACHE([]), // Taproot inputs doesnt require streaming previous transactions
            },
            result: {
                serializedTx:
                    '01000000000102ae4d6d8f642d1e5c8608e5b8430dd89432da2c7425081522e9482970412ddeaf0200000000ffffffffbf1cff9e0fc816acdc2753af9a45c1a6e92c04d0cff2b858372475b6abd912400000000000ffffffff0128a2010000000000225120e120bd124f345d412a91b50cb7e07650a448e90f48afd861b575a664b985b97f000140b524eaf406d413e19d7d32f7133273728f35b28509ac58dfd817f6dfbbac9901db21cd1ba4c2323c64bede38a7512647369d4767c645a915482bcf5167dcd77100000000',
                witnesses: [
                    undefined,
                    '0140b524eaf406d413e19d7d32f7133273728f35b28509ac58dfd817f6dfbbac9901db21cd1ba4c2323c64bede38a7512647369d4767c645a915482bcf5167dcd771',
                ],
            },
        },
    ],
};
