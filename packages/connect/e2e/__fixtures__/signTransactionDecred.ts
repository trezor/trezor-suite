const { TX_CACHE } = global.TestUtils;

const legacyResults = [
    {
        // not allowed for lower versions
        // not allowed for newer devices
        rules: ['<1.10.1', '<2.4.0', '!T2B1', '!T3B1', '!T3T1'],
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
                        address_n: "m/44'/1'/0'/0/0",
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
                        address_n: "m/44'/1'/0'/0/0",
                        amount: '200000000',
                        prev_hash:
                            '4d8acde26d5efc7f5df1b3cdada6b11027616520c883e09c919b88f0f0cb6410',
                        prev_index: 1,
                        decred_tree: 0,
                    },
                    {
                        address_n: "m/44'/1'/0'/0/0",
                        amount: '200000000',
                        prev_hash:
                            'f341fde6a78c2e150619d1c5ecbd90fabeb9e278024cc38ea4190d0b4a6d61d8',
                        prev_index: 1,
                        decred_tree: 0,
                    },
                    {
                        address_n: "m/44'/1'/0'/0/1",
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
                        address_n: "m/44'/1'/0'/1/0",
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
                        address_n: "m/44'/1'/0'/0/0",
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
                        address_n: "m/44'/1'/0'/0/0",
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
                        address_n: "m/44'/1'/0'/0/0",
                        amount: '200000000',
                        prev_hash:
                            '8b6890c10a3764fe6f378bc5b7e438148df176e9be1dde704ce866361149e254',
                        prev_index: 2,
                        decred_staking_spend: 0, // SSGen
                        decred_tree: 1,
                    },
                    {
                        address_n: "m/44'/1'/0'/0/0",
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
                {
                    // https://github.com/trezor/trezor-firmware/pull/2703/
                    rules: ['<2.8.2'],
                    success: false,
                },
            ],
        },
    ],
};
