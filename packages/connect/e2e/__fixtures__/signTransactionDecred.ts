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
                            '4d8acde26d5efc7f5df1b3cdada6b11027616520c883e09c919b88f0f0cb6410',
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
                refTxs: TX_CACHE(['4d8acd'], true), // Fake tx
            },
            result: {
                serializedTx:
                    '01000000011064cbf0f0889b919ce083c82065612710b1a6adcdb3f15d7ffc5e6de2cd8a4d0100000000ffffffff01802b530b0000000000001976a914819d291a2f7fbf770e784bfd78b5ce92c58e95ea88ac00000000000000000100c2eb0b0000000000000000ffffffff6a47304402202f77445fd8b2d47f6d28fa6087d4bc3ac6986904bf9009c41e527245905d21870220227f463d1dbfba492514e1ee78e32060bfdb4ca9251c4e0557c232e740515eb70121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0',
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
                        amount: '200000000',
                        prev_hash:
                            '4d8acde26d5efc7f5df1b3cdada6b11027616520c883e09c919b88f0f0cb6410',
                        prev_index: 1,
                        decred_tree: 0,
                    },
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        amount: '200000000',
                        prev_hash:
                            'f341fde6a78c2e150619d1c5ecbd90fabeb9e278024cc38ea4190d0b4a6d61d8',
                        prev_index: 1,
                        decred_tree: 0,
                    },
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/1"),
                        amount: '200000000',
                        prev_hash:
                            '5f3a7d29623eba20788e967439c1ccf122688589dfc07cddcedd1b27dc14b568',
                        prev_index: 0,
                        decred_tree: 0,
                    },
                ],
                outputs: [
                    {
                        address: 'TsWjioPrP8E1TuTMmTrVMM2BA4iPrjQXBpR',
                        amount: '499975000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        // TsaSFRwfN9muW5F6ZX36iSksc9hruiC5F97
                        address_n: ADDRESS_N("m/44'/1'/0'/1/0"),
                        amount: '100000000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['4d8acd', 'f341fd', '5f3a7d'], true),
            },
            result: {
                serializedTx:
                    '01000000031064cbf0f0889b919ce083c82065612710b1a6adcdb3f15d7ffc5e6de2cd8a4d0100000000ffffffffd8616d4a0b0d19a48ec34c0278e2b9befa90bdecc5d11906152e8ca7e6fd41f30100000000ffffffff68b514dc271bddcedd7cc0df89856822f1ccc13974968e7820ba3e62297d3a5f0000000000ffffffff025803cd1d0000000000001976a9143eb656115197956125365348c542e37b6d3d259988ac00e1f5050000000000001976a9143ee6f9d662e7be18373d80e5eb44627014c2bf6688ac00000000000000000300c2eb0b0000000000000000ffffffff6a47304402205eec688bd8d52908dae5fa29d121637b6d5c7df0246235a0dbab8170e3d0309e0220774560da627134cb1942a8cafd3926e67317af70287f0c8422468821ea4f78560121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd000c2eb0b0000000000000000ffffffff6a4730440220171d7840fee536f2c41e80bdcd9d2248eadfe32f51e0404582aa9ce8d7c31f5f022075c6fbb39394dd34a6271ada25a9e68dc26ddb46fa84962c40a11fafadf9e2fd0121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd000c2eb0b0000000000000000ffffffff6a47304402207121e3da42ec635e3ba9d5c4e7f4921c6acab87c60d58956f60d89eab69defa60220649c2d9a987407e259088e5ebebae289e4b8a82bc77850004978021561299fcc01210294e3e5e77e22eea0e4c0d30d89beb4db7f69b4bf1ae709e411d6a06618b8f852',
            },
            legacyResults,
        },
        {
            description: 'Decred Testnet: purchase ticket',
            // todo: T1B1 error, tested with 1.10.6:
            // "error": "signing.c:1689:Not enough funds",
            skip: ['1'],
            params: {
                coin: 'tdcr',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        amount: '200000000',
                        prev_hash:
                            '4d8acde26d5efc7f5df1b3cdada6b11027616520c883e09c919b88f0f0cb6410',
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
                refTxs: TX_CACHE(['4d8acd'], true), // Fake tx
            },
            result: {
                serializedTx:
                    '01000000011064cbf0f0889b919ce083c82065612710b1a6adcdb3f15d7ffc5e6de2cd8a4d0100000000ffffffff03603bea0b0000000000001aba76a914819d291a2f7fbf770e784bfd78b5ce92c58e95ea88ac00000000000000000000206a1edc1a98d791735eb9a8715a2a219c23680edcedad00c2eb0b000000000058000000000000000000001abd76a914000000000000000000000000000000000000000088ac00000000000000000100c2eb0b0000000000000000ffffffff6b483045022100b3a11ff4befcc035623de7665aaa76dacc9252e53aabf2a5d61238151e696532022004cbcc537c1d539e04c823140bac4524bdba09f528f5c4b76f3f1022b7dc0ad40121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0',
            },
            legacyResults,
        },
        {
            description: 'Decred Testnet: spend from stake generation and revocation',
            // todo: T1B1 error, tested with 1.10.6:
            // "error": "signing.c:1689:Not enough funds",
            skip: ['1'],
            params: {
                coin: 'tdcr',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        amount: '200000000',
                        prev_hash:
                            'f8e2f2b4eab772f6e3743cba92db341f64b84d9c16ae375c7690fbf0bf02fc7b',
                        prev_index: 2,
                        decred_staking_spend: 0, // SSGen
                        decred_tree: 1,
                    },
                    {
                        address_n: ADDRESS_N("m/44'/1'/0'/0/0"),
                        amount: '200000000',
                        prev_hash:
                            '51bc9c71f10a81eef3caedb5333062eb4b1f70998adf02916fe98fdc04c572e8',
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
                refTxs: TX_CACHE(['f8e2f2', '51bc9c'], true),
            },
            result: {
                serializedTx:
                    '01000000027bfc02bff0fb90765c37ae169c4db8641f34db92ba3c74e3f672b7eab4f2e2f80200000001ffffffffe872c504dc8fe96f9102df8a99701f4beb623033b5edcaf3ee810af1719cbc510000000001ffffffff0160fdd5170000000000001976a914819d291a2f7fbf770e784bfd78b5ce92c58e95ea88ac00000000000000000200c2eb0b0000000000000000ffffffff6b483045022100f74f652a073bdaf2197ede47b4df0d90609bbfd0dc8a94199d36ebb1429de09b022040366292a8812135ec7572a94eb6e969fa1fa97a52c03f08a337f20bc4fb71de0121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd000c2eb0b0000000000000000ffffffff6b483045022100ca385c05a008239c038e107989bbc30eec1ecd5a66e4973265eb21df034c77a9022070c3dceb24b39cb6e9f8c973572b955b37a4754e9caa704cdd37113c46e2b2970121030e669acac1f280d1ddf441cd2ba5e97417bf2689e4bbec86df4f831bf9f7ffd0',
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
