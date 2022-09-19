const { ADDRESS_N, TX_CACHE } = global.TestUtils;

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Testnet (P2SH): 1 input, 2 outputs, no change',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/49'/1'/0'/1/0"),
                        amount: '123456789',
                        prev_hash:
                            '20912f98ea3ed849042efed0fdac8cb4fc301961c5988cba56902d8ffb61c337',
                        prev_index: 0,
                        script_type: 'SPENDP2SHWITNESS',
                    },
                ],
                outputs: [
                    {
                        address: 'mhRx1CeVfaayqRwq5zgRQmD7W5aWBfD5mC',
                        amount: '12300000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: '2N1LGaGg836mqSQqiuUBLfcyGBhyZbremDX',
                        amount: '111145789',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['20912f']),
            },
            result: {
                serializedTx:
                    '0100000000010137c361fb8f2d9056ba8c98c5611930fcb48cacfdd0fe2e0449d83eea982f91200000000017160014d16b8c0680c61fc6ed2e407455715055e41052f5ffffffff02e0aebb00000000001976a91414fdede0ddc3be652a0ce1afbc1b509a55b6b94888ac3df39f060000000017a91458b53ea7f832e8f096e896b8713a8c6df0e892ca8702483045022100ccd253bfdf8a5593cd7b6701370c531199f0f05a418cd547dfc7da3f21515f0f02203fa08a0753688871c220648f9edadbdb98af42e5d8269364a326572cf703895b012103e7bfe10708f715e8538c92d46ca50db6f657bbc455b7494e6a0303ccdb868b7900000000',
            },
        },
        {
            description: 'Testnet (P2SH): 1 input, 2 outputs, 1 change',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/49'/1'/0'/1/0"),
                        amount: '123456789',
                        prev_hash:
                            '20912f98ea3ed849042efed0fdac8cb4fc301961c5988cba56902d8ffb61c337',
                        prev_index: 0,
                        script_type: 'SPENDP2SHWITNESS',
                    },
                ],
                outputs: [
                    {
                        address: 'mhRx1CeVfaayqRwq5zgRQmD7W5aWBfD5mC',
                        amount: '12300000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/49'/1'/0'/1/0"),
                        amount: '111145789',
                        script_type: 'PAYTOP2SHWITNESS',
                    },
                ],
                refTxs: TX_CACHE(['20912f']),
            },
            result: {
                serializedTx:
                    '0100000000010137c361fb8f2d9056ba8c98c5611930fcb48cacfdd0fe2e0449d83eea982f91200000000017160014d16b8c0680c61fc6ed2e407455715055e41052f5ffffffff02e0aebb00000000001976a91414fdede0ddc3be652a0ce1afbc1b509a55b6b94888ac3df39f060000000017a91458b53ea7f832e8f096e896b8713a8c6df0e892ca8702483045022100ccd253bfdf8a5593cd7b6701370c531199f0f05a418cd547dfc7da3f21515f0f02203fa08a0753688871c220648f9edadbdb98af42e5d8269364a326572cf703895b012103e7bfe10708f715e8538c92d46ca50db6f657bbc455b7494e6a0303ccdb868b7900000000',
            },
        },
        {
            description: 'Testnet (P2SH): send multisig',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/49'/1'/1'/1/0"),
                        prev_hash:
                            '338e2d02e0eaf8848e38925904e51546cf22e58db5b1860c4a0e72b69c56afe5',
                        prev_index: 0,
                        amount: 100000,
                        script_type: 'SPENDP2SHWITNESS',
                        multisig: {
                            pubkeys: [
                                {
                                    node: 'tpubDCHRnuvE95Jrs9NkLaZwKNdoHBSoCRge6wKunXyxnspvLpx3aZbJcScTnTdsEqT6uFfWdMvBmLs3jhnkBiE7ob3xVQPV8ngDPYAMs93X9xv',
                                    address_n: [1, 0],
                                },
                                {
                                    node: 'tpubDCHRnuvE95JrupL7n5bPax7pdGSVzzWiJKAhCHp3E3GbK3PyxDEU33PjjhYLyEuYPYcydZY7gDkVjyFVEMM4BUNBx49chUnGRPfBm1jCBjT',
                                    address_n: [1, 0],
                                },
                                {
                                    node: 'tpubDCHRnuvE95JrxFT9wGFWSU73UN7LJ3b1RXirFrRgbhhA1yhPXrS2744tCwiWda9bHZ1uknsNdQd8iKoQB5hyH51bnUxVxxuB8FWR64RhUvs',
                                    address_n: [1, 0],
                                },
                            ],
                            signatures: ['', '', ''],
                            m: 2,
                        },
                    },
                ],
                outputs: [
                    {
                        address: 'mu85iAHLpF16VyijB2wn5fcZrjT2bvrhnL',
                        amount: 100000 - 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['338e2d']),
            },
            result: {
                serializedTx:
                    '01000000000101e5af569cb6720e4a0c86b1b58de522cf4615e5045992388e84f8eae0022d8e330000000023220020cf28684ff8a6dda1a7a9704dde113ddfcf236558da5ce35ad3f8477474dbdaf7ffffffff01905f0100000000001976a914953e62552a88c235c0691ec74b362a6803a7d93e88ac030047304402203aba48b0a98194a505420633eeca5acd8244061899e0a414f1b0d2de1d721b0f022001b32486e7c443e25cdfdfb14dc183ba31f5329d0078a25f7eb74f7209f347bb0169522103d54ab3c8b81cb7f8f8088df4c62c105e8acaa2fb53b180f6bc6f922faecf3fdc21036aa47994f3f18f0976d6073ca79997003c3fa29c4f93907998fefc1151b4529b2102a092580f2828272517c402da9461425c5032860ab40180e041fbbb88ea2a520453ae00000000',
            },
        },
    ],
};
