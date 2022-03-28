const { ADDRESS_N, TX_CACHE } = global.TestUtils;

const legacyResults = [
    {
        // not allowed for lower versions
        rules: ['<1.10.1', '<2.4.0'],
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
            description: 'Decred Testnet: 1 input, 1 output, no change',
            params: {
                coin: 'tdcr',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        amount: '200000000',
                        prev_hash:
                            'e16248f0b39a0a0c0e53d6f2f84c2a944f0d50e017a82701e8e02e46e979d5ed',
                        prev_index: 1,
                        decred_tree: 0,
                    },
                ],
                outputs: [
                    {
                        address: 'TscqTv1he8MZrV321SfRghw7LFBCJDKB3oz',
                        amount: '190000000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['e16248'], true),
            },
            result: {
                signatures: [
                    '3044022009e394c7dec76ab6988270b467839b1462ad781556bce37383b76e026418ce6302204f7f6ef535d2986b095d7c96232a0990a0b9ce3004894b39c167bb18e5833ac3',
                ],
                serializedTx:
                    '0100000001edd579e9462ee0e80127a817e0500d4f942a4cf8f2d6530e0c0a9ab3f04862e10100000000ffffffff01802b530b0000000000001976a914819d291a2f7fbf770e784bfd78b5ce92c58e95ea88ac00000000000000000100c2eb0b0000000000000000ffffffff6a473044022009e394c7dec76ab6988270b467839b1462ad781556bce37383b76e026418ce6302204f7f6ef535d2986b095d7c96232a0990a0b9ce3004894b39c167bb18e5833ac30121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0',
            },
            legacyResults,
        },
        {
            description: 'Decred Testnet: 3 inputs, 1 output, 1 change',
            params: {
                coin: 'tdcr',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        amount: '190000000',
                        prev_hash:
                            '5e6e3500a333c53c02f523db5f1a9b17538a8850b4c2c24ecb9b7ba48059b970',
                        prev_index: 0,
                        decred_tree: 0,
                    },
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        amount: '200000000',
                        prev_hash:
                            'ccf95b0fd220ef59ae2e5b17005a81e222758122682d522eff8ae1fcbc93bc74',
                        prev_index: 1,
                        decred_tree: 0,
                    },
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/1"),
                        amount: '200000000',
                        prev_hash:
                            'f395ef3e72a831a766db15e7a38bc28025d4ee02234d68bdea2d8353b47a3113',
                        prev_index: 0,
                        decred_tree: 0,
                    },
                ],
                outputs: [
                    {
                        address: 'TsWjioPrP8E1TuTMmTrVMM2BA4iPrjQXBpR',
                        amount: '489975000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        // TsaSFRwfN9muW5F6ZX36iSksc9hruiC5F97
                        address_n: ADDRESS_N("m/44'/1'/0'/1/0"),
                        amount: '100000000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['5e6e35', 'ccf95b', 'f395ef'], true),
            },
            result: {
                signatures: [
                    '304402200e50a6d43c462045917792e7d03b4354900c3baccb7abef66f556a32b12f2ca6022031ae94fdf2a41dd6ed2e081faf0f8f1c64411a1b46eb26f7f35d94402b2bde11',
                    '304402204894c2f8e76c4645d2df600cdd01443aeb48807b72150c4bc10eebd126529532022054cd37462a3f0ddb85c75b4e874ab0c2aad7eebcff3e6c1ac20e1c16babe3672',
                    '30450221009f1ba584023da8aafd57374e83be68f1a097b906967ec9e50736f31bfc7989f102204a190fc2885e394572b5c2ced046657b1dd07abdb19144e21e78987968c7f176',
                ],
                serializedTx:
                    '010000000370b95980a47b9bcb4ec2c2b450888a53179b1a5fdb23f5023cc533a300356e5e0000000000ffffffff74bc93bcfce18aff2e522d6822817522e2815a00175b2eae59ef20d20f5bf9cc0100000000ffffffff13317ab453832deabd684d2302eed42580c28ba3e715db66a731a8723eef95f30000000000ffffffff02d86c341d0000000000001976a9143eb656115197956125365348c542e37b6d3d259988ac00e1f5050000000000001976a9143ee6f9d662e7be18373d80e5eb44627014c2bf6688ac000000000000000003802b530b0000000000000000ffffffff6a47304402200e50a6d43c462045917792e7d03b4354900c3baccb7abef66f556a32b12f2ca6022031ae94fdf2a41dd6ed2e081faf0f8f1c64411a1b46eb26f7f35d94402b2bde110121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd000c2eb0b0000000000000000ffffffff6a47304402204894c2f8e76c4645d2df600cdd01443aeb48807b72150c4bc10eebd126529532022054cd37462a3f0ddb85c75b4e874ab0c2aad7eebcff3e6c1ac20e1c16babe36720121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd000c2eb0b0000000000000000ffffffff6b4830450221009f1ba584023da8aafd57374e83be68f1a097b906967ec9e50736f31bfc7989f102204a190fc2885e394572b5c2ced046657b1dd07abdb19144e21e78987968c7f17601210294e3e5e77e22eea0e4c0d30d89beb4db7f69b4bf1ae709e411d6a06618b8f852',
            },
            legacyResults,
        },
        {
            description: 'Decred Testnet: purchase ticket',
            // todo: T1 error, tested with 1.10.6:
            // "error": "signing.c:1689:Not enough funds",
            skip: ['1'],
            params: {
                coin: 'tdcr',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        amount: '200000000',
                        prev_hash:
                            'e16248f0b39a0a0c0e53d6f2f84c2a944f0d50e017a82701e8e02e46e979d5ed',
                        prev_index: 1,
                        decred_tree: 0,
                    },
                ],
                outputs: [
                    {
                        address: 'TscqTv1he8MZrV321SfRghw7LFBCJDKB3oz',
                        amount: '199900000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        amount: '200000000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 'TsR28UZRprhgQQhzWns2M6cAwchrNVvbYq2',
                        amount: '0',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                decredStakingTicket: true,
                refTxs: TX_CACHE(['e16248'], true),
            },
            result: {
                signatures: [
                    '30450221008ced5411a6d92b761bdd8b9f7fbc5bfae3c31f9369050c218977f4540ab1ec9602206e89c821878ebfd959d1c4a63100eec5b1154c8d9508c039bb78e333498a73b4',
                ],
                serializedTx:
                    '0100000001edd579e9462ee0e80127a817e0500d4f942a4cf8f2d6530e0c0a9ab3f04862e10100000000ffffffff03603bea0b0000000000001aba76a914819d291a2f7fbf770e784bfd78b5ce92c58e95ea88ac00000000000000000000206a1edc1a98d791735eb9a8715a2a219c23680edcedad00c2eb0b000000000058000000000000000000001abd76a914000000000000000000000000000000000000000088ac00000000000000000100c2eb0b0000000000000000ffffffff6b4830450221008ced5411a6d92b761bdd8b9f7fbc5bfae3c31f9369050c218977f4540ab1ec9602206e89c821878ebfd959d1c4a63100eec5b1154c8d9508c039bb78e333498a73b40121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0',
            },
            legacyResults,
        },
        {
            description: 'Decred Testnet: spend from stake generation and revocation',
            // todo: T1 error, tested with 1.10.6:
            // "error": "signing.c:1689:Not enough funds",
            skip: ['1'],
            params: {
                coin: 'tdcr',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        amount: '200000000',
                        prev_hash:
                            '8b6890c10a3764fe6f378bc5b7e438148df176e9be1dde704ce866361149e254',
                        prev_index: 2,
                        decred_staking_spend: 0, // SSGen
                        decred_tree: 1,
                    },
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        amount: '200000000',
                        prev_hash:
                            '1f00fc54530d7c4877f5032e91b6c507f6a1531861dede2ab134e5c0b5dfe8c8',
                        prev_index: 0,
                        decred_staking_spend: 1, // SSRTX
                        decred_tree: 1,
                    },
                ],
                outputs: [
                    {
                        address: 'TscqTv1he8MZrV321SfRghw7LFBCJDKB3oz',
                        amount: '399900000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['8b6890', '1f00fc'], true),
            },
            result: {
                signatures: [
                    '3045022100bdcb877c97d72db74eca06fefa21a7f7b00afcd5d916fce2155ed7df1ca5546102201e1f9efd7d652b449474c2c70171bfc4535544927bed62021f7334447d1ea474',
                    '3044022030c5743c442bd696d19dcf73d54e95526e726de965c2e2b4b9fd70248eaae21d02201305a3bcc2bb0e33122277763990e3b48f317d61264a68d190fb8acfc004cc64',
                ],
                serializedTx:
                    '010000000254e249113666e84c70de1dbee976f18d1438e4b7c58b376ffe64370ac190688b0200000001ffffffffc8e8dfb5c0e534b12adede611853a1f607c5b6912e03f577487c0d5354fc001f0000000001ffffffff0160fdd5170000000000001976a914819d291a2f7fbf770e784bfd78b5ce92c58e95ea88ac00000000000000000200c2eb0b0000000000000000ffffffff6b483045022100bdcb877c97d72db74eca06fefa21a7f7b00afcd5d916fce2155ed7df1ca5546102201e1f9efd7d652b449474c2c70171bfc4535544927bed62021f7334447d1ea4740121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd000c2eb0b0000000000000000ffffffff6a473044022030c5743c442bd696d19dcf73d54e95526e726de965c2e2b4b9fd70248eaae21d02201305a3bcc2bb0e33122277763990e3b48f317d61264a68d190fb8acfc004cc640121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0',
            },
            legacyResults: [
                ...legacyResults,
                {
                    // different result,
                    rules: ['<1.10.6'],
                    payload: {
                        signatures: [
                            '304402202b7caed34aca59bfcf71a3eb6ad7bef59f61ca4df11e18b669cb78f1c77ecd320220735c06fd61a71a6f5ed487293139ef74332649002b0ccae77058f3431d21ef8f',
                            '3045022100e42c0e4fd00c462e81f470cb02f880f5d175b4020661fd1b46f4735be6c1796a022059f5e7cc7aa6027ec3e227eaff267f1ecf64c217f82c58a363f8738b5b101be9',
                        ],
                        serializedTx:
                            '010000000254e249113666e84c70de1dbee976f18d1438e4b7c58b376ffe64370ac190688b0200000001ffffffffc8e8dfb5c0e534b12adede611853a1f607c5b6912e03f577487c0d5354fc001f0000000001ffffffff0160fdd5170000000000001976a914819d291a2f7fbf770e784bfd78b5ce92c58e95ea88ac00000000000000000200c2eb0b0000000000000000ffffffff6a47304402202b7caed34aca59bfcf71a3eb6ad7bef59f61ca4df11e18b669cb78f1c77ecd320220735c06fd61a71a6f5ed487293139ef74332649002b0ccae77058f3431d21ef8f0121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd000c2eb0b0000000000000000ffffffff6b483045022100e42c0e4fd00c462e81f470cb02f880f5d175b4020661fd1b46f4735be6c1796a022059f5e7cc7aa6027ec3e227eaff267f1ecf64c217f82c58a363f8738b5b101be90121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0',
                    },
                },
            ],
        },
        // {
        //     description: 'Decred Testnet: multisig change',
        //     params: {
        //         coin: 'tdcr',
        //         inputs: [
        //             {
        //                 address_n: ADDRESS_N("m/48'/1'/0'/0'/0/0"),
        //                 script_type: 'SPENDMULTISIG',
        //                 amount: '200000000',
        //                 prev_hash:
        //                     '8b6890c10a3764fe6f378bc5b7e438148df176e9be1dde704ce866361149e254',
        //                 prev_index: 2,
        //                 decred_tree: 0,
        //                 multisig: {
        //                     pubkeys: [
        //                         {
        //                             node: 'tpubVr241nSfVWd4hRxtQ9WUkAmeV2xTUiXUN5LU96TajdpqsmjhLuqmK4TUc4ND2ohwDLvnSmPr1nXTicJMNva12gPwYZLrbt5nS7nCknCsXen',
        //                             address_n: [0, 0],
        //                         },
        //                         {
        //                             node: 'tpubVrSG8LDEEo6oB5EZMhjS86cbEQchdLDq4zdggKxNfAMCEQGvuVGycKGLteMfGYBD5B5dsTBX8cZ9rJbNziLdH6t81SUSE1NSPt7kCPem9sk',
        //                             address_n: [0, 0],
        //                         },
        //                         {
        //                             node: 'tpubVs18jeK6v74aaHWvQNfJoPrE3i8ZTLTXgdmEhDNhRUEbQ5hydoAWwjrhqt1rBHyU2Sd1Mjzvt6Xmmj7VUqpvn3DZ9bEdUoXKgCtDTuWzEkJ',
        //                             address_n: [0, 0],
        //                         },
        //                     ],
        //                     signatures: ['', '', ''],
        //                     m: 2,
        //                 },
        //             },
        //             {
        //                 address_n: ADDRESS_N("m/48'/1'/0'/0'/0/1"),
        //                 script_type: 'SPENDMULTISIG',
        //                 amount: '200000000',
        //                 prev_hash:
        //                     '1f00fc54530d7c4877f5032e91b6c507f6a1531861dede2ab134e5c0b5dfe8c8',
        //                 prev_index: 0,
        //                 decred_tree: 0,
        //                 multisig: {
        //                     pubkeys: [
        //                         {
        //                             node: 'tpubVr241nSfVWd4hRxtQ9WUkAmeV2xTUiXUN5LU96TajdpqsmjhLuqmK4TUc4ND2ohwDLvnSmPr1nXTicJMNva12gPwYZLrbt5nS7nCknCsXen',
        //                             address_n: [0, 1],
        //                         },
        //                         {
        //                             node: 'tpubVrSG8LDEEo6oB5EZMhjS86cbEQchdLDq4zdggKxNfAMCEQGvuVGycKGLteMfGYBD5B5dsTBX8cZ9rJbNziLdH6t81SUSE1NSPt7kCPem9sk',
        //                             address_n: [0, 1],
        //                         },
        //                         {
        //                             node: 'tpubVs18jeK6v74aaHWvQNfJoPrE3i8ZTLTXgdmEhDNhRUEbQ5hydoAWwjrhqt1rBHyU2Sd1Mjzvt6Xmmj7VUqpvn3DZ9bEdUoXKgCtDTuWzEkJ',
        //                             address_n: [0, 1],
        //                         },
        //                     ],
        //                     signatures: ['', '', ''],
        //                     m: 2,
        //                 },
        //             },
        //         ],
        //         outputs: [
        //             {
        //                 address_n: ADDRESS_N('m/1/0'),
        //                 amount: '99900000',
        //                 script_type: 'PAYTOADDRESS',
        //             },
        //             {
        //                 address: 'TsWjioPrP8E1TuTMmTrVMM2BA4iPrjQXBpR',
        //                 amount: '300000000',
        //                 script_type: 'PAYTOADDRESS',
        //             },
        //         ],
        //         refTxs: TX_CACHE(['8b6890', '1f00fc'], true),
        //     },
        //     result: {
        //         // signatures: [
        //         //     '3045022100bdcb877c97d72db74eca06fefa21a7f7b00afcd5d916fce2155ed7df1ca5546102201e1f9efd7d652b449474c2c70171bfc4535544927bed62021f7334447d1ea474',
        //         //     '3044022030c5743c442bd696d19dcf73d54e95526e726de965c2e2b4b9fd70248eaae21d02201305a3bcc2bb0e33122277763990e3b48f317d61264a68d190fb8acfc004cc64',
        //         // ],
        //         serializedTx:
        //             '01000000023f4c9e61b1cf469cad3785a03566ef23876217fe657561e78783d32155397c3f0100000000ffffffffa806ca135db5160eb91202506ce2645b215805149ce730a6850d74525018da160000000000ffffffff02605af40500000000000017a914d4ea4e064d969064ca56a4cede56f7bf6cf62f118700a3e1110000000000001976a9143eb656115197956125365348c542e37b6d3d259988ac00000000000000000200c2eb0b0000000000000000fffffffffc483045022100a35fd1ed579362ac65b583ba910a3d814c5e9b87da835993bf4166a6b3a8482b02204b3e167fad7d37dd62aa585c68d3c8e00c3c43bf7a25d74f6407870a4a7499e9014730440220720fd7b6dfd337056c5e6dad76e307b3758e702ccfd39471bf90e0db3a5f5eba02205bd062c78fcdd56057723a0e39d661a790f325e59e643b54c47b7218a5781684014c69522103defea6f243b97354449bb348446a97e38df2fbed33afc3a7185bfdd26757cfdb2103725d6c5253f2040a9a73af24bcc196bf302d6cc94374dd7197b138e10912670121038924e94fff15302a3fb45ad4fc0ed17178800f0f1c2bdacb1017f4db951aa9f153ae00c2eb0b0000000000000000fffffffffc4730440220625357288f0880be21d6a44275033fd84cf04bc23227eef810455ad711507e4402207d303548bb0476f98c52f223fe4430f82a78a73f757b186453948b0908f5af3101483045022100e140f586e370824b13576c77cf9f2855294fd415316f2a130126d8412a7cf08c0220308d1f5c83847458b271c93bfca5eba7fc1691b9c5d6e57955985affd1110e24014c695221021ef4b5d81f21593071b993bd4d8c564c569a6f84de0d4511135cbc66d8bf7bcd2103f1e53b6e0ff99adf7e8fa826a94bdac83163d8abbc1d19a8d6b88a4af91b9a67210390c8ea70e1f2f60e0052be65183c43bb01b2f02dfa4e448f74e359997f74e6ad53ae',
        //     },
        // },
    ],
};
