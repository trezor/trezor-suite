const { ADDRESS_N, TX_CACHE } = global.TestUtils;

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_12',
        settings: {
            safety_checks: 2,
        },
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
                signatures: [
                    '304402207e8c682de6cdcdcd8883f012c909398b9853c60687dc708f435c519cc9b2c8ae02207b312b94a0d9bf24dcfc565d541f07e2029ee0ec1e7a6c73f3fc250d33f6df7a',
                ],
                serializedTx:
                    '0100000000010137c361fb8f2d9056ba8c98c5611930fcb48cacfdd0fe2e0449d83eea982f91200000000017160014831ad96fe5919bbc843626034b7eeef99fc5df7affffffff02e0aebb00000000001976a91414fdede0ddc3be652a0ce1afbc1b509a55b6b94888ac3df39f060000000017a91458b53ea7f832e8f096e896b8713a8c6df0e892ca870247304402207e8c682de6cdcdcd8883f012c909398b9853c60687dc708f435c519cc9b2c8ae02207b312b94a0d9bf24dcfc565d541f07e2029ee0ec1e7a6c73f3fc250d33f6df7a012102e7232ddd135b988b1e4e19370097426fd66a1e6b00d19c44bb4c8b2557b74de400000000',
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
                signatures: [
                    '3045022100c0b0cd7a0ba2fa82b73a203891c45871928f054c2cd8eb4d50543e54ab981136022003721ee8511e614abd862f21edec75d6fa4bbeb476bdd435461e5595e2235c5f',
                ],
                serializedTx:
                    '0100000000010137c361fb8f2d9056ba8c98c5611930fcb48cacfdd0fe2e0449d83eea982f91200000000017160014831ad96fe5919bbc843626034b7eeef99fc5df7affffffff02e0aebb00000000001976a91414fdede0ddc3be652a0ce1afbc1b509a55b6b94888ac3df39f060000000017a914ca03da1d2aa3db6feec01d02867181d459d65a808702483045022100c0b0cd7a0ba2fa82b73a203891c45871928f054c2cd8eb4d50543e54ab981136022003721ee8511e614abd862f21edec75d6fa4bbeb476bdd435461e5595e2235c5f012102e7232ddd135b988b1e4e19370097426fd66a1e6b00d19c44bb4c8b2557b74de400000000',
            },
        },
        {
            description: 'Testnet (P2SH): send multisig',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/999'/1'/2147483651/2/0"),
                        amount: '1610436',
                        prev_hash:
                            '9c31922be756c06d02167656465c8dc83bb553bf386a3f478ae65b5c021002be',
                        prev_index: 1,
                        script_type: 'SPENDP2SHWITNESS',
                        multisig: {
                            pubkeys: [
                                {
                                    node: 'tpubDCKNmygUHqKJZjbtPqaKyFms6BjMvNHrwe3ePSdEruYfLb1EQDXRN63t7cDEhc79xjqYTpbnvp6XHR9cXb5iF4jTqJaHfwm5Dv2CRwyyAwq',
                                    address_n: [2, 0],
                                },
                                {
                                    node: 'tpubDCKNmygUHqKJbHoeVPzzjkAjgHfmqoWaG4dBp4kyE5rCmhujjWLC7SkcQw9g6q6ZDp4QgN24REZmoHJTik1a6sqqCH5txzrCdhsTnZh9bSA',
                                    address_n: [2, 0],
                                },
                                {
                                    node: 'tpubDCKNmygUHqKJft96NiaH9vQF78U71ShySniMobimCi3ZHF6fwsG2SFDRLzoWZQZwJvvMMKABCvu6BTPzxgZAFWfere6aRZ6ZeC6dfvoNuHr',
                                    address_n: [2, 0],
                                },
                            ],
                            signatures: [
                                '3045022100f79ce22f119d279f68b480224404346160b96f1e814dace24e880330e280d8250220390567133c9c292114afa753ee8144a44f73fe7fcd503f0a07ac5fdd23c72f3c',
                                '',
                                '',
                            ],
                            m: 2,
                        },
                    },
                ],
                outputs: [
                    {
                        address: 'mhRx1CeVfaayqRwq5zgRQmD7W5aWBfD5mC',
                        amount: '1605000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['9c3192']),
            },
            result: {
                signatures: [
                    '3045022100af67a90d34bb71944b50b8209347f3764a371440808eba040ebda80816a0bc0602201ab3f38eb40552b8f6d5509b2199305d0a65b84e09c04e26f4a30b700f11784b',
                ],
                serializedTx:
                    '01000000000101be0210025c5be68a473f6a38bf53b53bc88d5c46567616026dc056e72b92319c0100000023220020949ea1343a263ca9db30033322917725e37a955e17df902ca68e3fe5210190dfffffffff01887d1800000000001976a91414fdede0ddc3be652a0ce1afbc1b509a55b6b94888ac0400483045022100f79ce22f119d279f68b480224404346160b96f1e814dace24e880330e280d8250220390567133c9c292114afa753ee8144a44f73fe7fcd503f0a07ac5fdd23c72f3c01483045022100af67a90d34bb71944b50b8209347f3764a371440808eba040ebda80816a0bc0602201ab3f38eb40552b8f6d5509b2199305d0a65b84e09c04e26f4a30b700f11784b0169522102b9f95f18f40f57d0044fc1414dd4b344a28289b6848744dd797c8b1e8eb972c42102a98fed2ba9d0d360bc2d61910ce3b3bad000e488a501a21d3dc9bde84b969ad22103e38bac0a0c76efd6017f729715d5e8f5751d3d5f5fdb3d10d47cfb544143f02b53ae00000000',
            },
        },
    ],
};
