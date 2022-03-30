const { ADDRESS_N, TX_CACHE } = global.TestUtils;

// fixtures: https://github.com/trezor/trezor-firmware/blob/master/tests/device_tests/test_multisig.py

const PUBKEYS_15 = [];
for (let i = 0; i < 15; i++) {
    PUBKEYS_15.push({
        // xpub: m/48'/0'/1'/0' of mnemonic_12
        // node: 'xpub6EGBV7FFmjU75tH7UUD93QQCuwWFSxxECvX4VwL44xEoRKAz4kD3W9fDziRnvdXko63cjwxCpwpYQZgs123PvCMxVqvzYPqKeczq4r2JYfU',
        node: {
            child_num: 2147483648,
            depth: 4,
            fingerprint: 1663797262,
            public_key: '035921d91e1489f6aec437ab4087709fc72c8c52b378099f28191171a68ededea8',
            chain_code: '8728524e3fc0e2d5c05c71426c34ed7bf7fcdc5f24039afb7382f0ac01608e58',
        },
        address_n: [0, i],
    });
}

const PUBKEYS_2_OF_3 = [
    {
        // xpub: m/48'/0'/1'/0' of mnemonic_all
        node: 'xpub6EexEtC6c2rN5QCpzrL2nUNGDfxizCi3kM1C2Mk5a6PfQs4H3F72C642M3XbnzycvvtD4U6vzn1nYPpH8VUmiREc2YuXP3EFgN1uLTrVEj4',
        address_n: [0, 0],
    },
    {
        // xpub: m/48'/0'/2'/0' of mnemonic_all
        node: 'xpub6F6Tq7sVLDrhuV3SpvsVKrKofF6Hx7oKxWLFkN6dbepuMhuYueKUnQo7E972GJyeRHqPKu44V1C9zBL6KW47GXjuprhbNrPQahWAFKoL2rN',
        address_n: [0, 0],
    },
    {
        // xpub: m/48'/0'/3'/0' of mnemonic_all
        node: 'xpub6Do6zDQqspotwduAsWgq2xZ1tWcwDjW8Q8JBZjnbQRLfJZ7YrDgtvDTq7pgHqk19uJwFPwwWrT31QvEusmT8NMWsCzPVuZSP3JAeJjWFmwC',
        address_n: [0, 0],
    },
];

const SIGNATURES_2_OF_3 = [
    '30450221009276eea820aa54a24bd9f1a056cb09a15f50c0816570a7c7878bd1c5ee7248540220677d200aec5e2f25bcf4000bdfab3faa9e1746d7f80c4ae4bfa1f5892eb5dcbf',
    '3045022100c2a9fbfbff1be87036d8a6a22745512b158154f7f3d8f4cad4ba7ed130b37b83022058f5299b4c26222588dcc669399bd88b6f2bc6e04b48276373683853187a4fd6',
];

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
        settings: {
            safety_checks: 2,
        },
    },
    tests: [
        {
            description: 'Bitcoin (multisig): 2 of 3 (sign with 1st key)',
            params: {
                coin: 'Bitcoin',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/48'/0'/1'/0'/0/0"),
                        prev_hash:
                            'c6091adf4c0c23982a35899a6e58ae11e703eacd7954f588ed4b9cdefc4dba52',
                        prev_index: 1,
                        amount: '100000',
                        script_type: 'SPENDMULTISIG',
                        multisig: {
                            pubkeys: PUBKEYS_2_OF_3,
                            signatures: ['', '', ''],
                            m: 2,
                        },
                    },
                ],
                outputs: [
                    {
                        address: '12iyMbUb4R2K3gre4dHSrbu5azG5KaqVss',
                        amount: '100000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['c6091a']),
            },
            result: {
                signatures: [SIGNATURES_2_OF_3[0]],
            },
        },
        {
            description: 'Bitcoin (multisig): 2 of 3 (sign with 3rd key)',
            params: {
                coin: 'Bitcoin',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/48'/0'/3'/0'/0/0"),
                        prev_hash:
                            'c6091adf4c0c23982a35899a6e58ae11e703eacd7954f588ed4b9cdefc4dba52',
                        prev_index: 1,
                        amount: '100000',
                        script_type: 'SPENDMULTISIG',
                        multisig: {
                            pubkeys: PUBKEYS_2_OF_3,
                            signatures: [SIGNATURES_2_OF_3[0], '', ''],
                            m: 2,
                        },
                    },
                ],
                outputs: [
                    {
                        address: '12iyMbUb4R2K3gre4dHSrbu5azG5KaqVss',
                        amount: '100000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['c6091a']),
            },
            result: {
                signatures: [SIGNATURES_2_OF_3[1]],
                serializedTx:
                    '010000000152ba4dfcde9c4bed88f55479cdea03e711ae586e9a89352a98230c4cdf1a09c601000000fdfe00004830450221009276eea820aa54a24bd9f1a056cb09a15f50c0816570a7c7878bd1c5ee7248540220677d200aec5e2f25bcf4000bdfab3faa9e1746d7f80c4ae4bfa1f5892eb5dcbf01483045022100c2a9fbfbff1be87036d8a6a22745512b158154f7f3d8f4cad4ba7ed130b37b83022058f5299b4c26222588dcc669399bd88b6f2bc6e04b48276373683853187a4fd6014c69522103dc0ff15b9c85c0d2c87099758bf47d36229c2514aeefcf8dea123f0f93c679762102bfe426e8671601ad46d54d09ee15aa035610d36d411961c87474908d403fbc122102a5d57129c6c96df663ad29492aa18605dad97231e043be8a92f9406073815c5d53aeffffffff01a0860100000000001976a91412e8391ad256dcdc023365978418d658dfecba1c88ac00000000',
            },
        },
        {
            description: 'Bitcoin (multisig): 15 of 15 (sign with 15th key)',
            setup: {
                mnemonic: 'mnemonic_12',
            },
            params: {
                coin: 'Bitcoin',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/48'/0'/1'/0'/0/14"),
                        prev_hash:
                            '6189e3febb5a21cee8b725aa1ef04ffce7e609448446d3a8d6f483c634ef5315',
                        prev_index: 1,
                        amount: '20000',
                        script_type: 'SPENDMULTISIG',
                        sequence: 4294967295,
                        multisig: {
                            pubkeys: PUBKEYS_15,
                            signatures: [
                                '3045022100b5f6fbf3d6ebef172213e886c80ccba9b450c58bc18bed842ab2fc150c6e274302207c3920d6e8b9466b67bad2729cc7a52485f0a26eba8ea9b6ecb8d3fac0a4b16d',
                                '3044022030cfc01c8e5e8dcbf96deebac220cfc218fd9ae4c326a7d8e795536cd64cc58f02202dada83d34cf51ddf99dfa4f01a2983418e4d9e3137f88b4198472d0e284096c',
                                '3045022100e8634f280df5c096299709016b37f1a5dda05d6680f9eeae1e47dda7f5651995022079214053a62a911e1e3d28b934f9a32ce4a8d5ef576432f40584a1ce31274fce',
                                '304402200345879de1d1ebefa16e62cd7a31168477959c251b4f61a77ed923007ec77b3402207f6e3f8b505adad3b32d83b366048bef50bb4f052b6499b0bb996094e1c4e8eb',
                                '30440220020e1eb47d7f428a1cd35e04782c27b47913944ce6174c46ba4531cf0842bbd2022030a8198855b96531c9385c9e4dd84a956dd1ef211964c1c1982f3eb40a91d88c',
                                '3044022005f8d405ee50653c7508251ad66147c71df528db7124310ffaefa57ff9839e760220383a7a6f86c8abcdc94724368e77c7370716fe62b400ff7d42a7d140f636a558',
                                '30450221009b2d68a358e485c37d9117ec598be547f83d9885f2c58e7e913e6e9ab6955fa202202848802eb093e68053ddcddc4162f00017e0d2ec1d6130ef8fcdc00f65b4fd2c',
                                '3045022100fe0b2e73e269cbb9cfd8035cee5be8561644cf204fd2cd190d89925e5669468b02203c85d18c74dff26e9d04ae30d0d6943bc932fab8d52838c84ef60f6d2268593e',
                                '3045022100ff4a2452a0fec838b354d62960d8b1eb1e9af20c56a818b7772da577ea7367360220499ed36546e23276a4a14563df88677072b1fb4b128bc05449d99f10b9098074',
                                '304402200e4fcdc587380c7b688fd093b5a551109056ee2f36df8e63f20648c81c172a60022079cdc72f7a318e5ff8b487914796cb7343825bdbf758808d119048a75062005f',
                                '304402203eab30094e923667cb7f18abdbd4bf0c73251cfd7dd4ad5dd37dead23ca41332022046cfacda6f6ee31e612e7444a561e699eb8b414edc205ac9513e3b53b4594774',
                                '30440220074e3127eff6b87aff74cf1065f842a8f8d51b7c7919479a91c58c1034b1e6b702206a31a48386645c7730abf8b850dd7985952c13e1791040ecd0533961e14021e3',
                                '3045022100cf9b538587593f51778eb50e11fe578bc13cddbb4ee03452662d415cc2c3ec0002207bd1cc14ca074fb623822740c6f451fc60b62777563e8374808e7c3f4c4d6c6b',
                                '3044022053d61515f5a29353e4fcbbab360852aeb609a22460c248e9e3dfeb0759269d1f0220698a1fa758eeb55954d64558c8a1f67ee7591261ad95f6c6dd160ef80891454f',
                                '',
                            ],
                            m: 15,
                        },
                    },
                ],
                outputs: [
                    {
                        address: '17kTB7qSk3MupQxWdiv5ZU3zcrZc2Azes1',
                        amount: '10000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['6189e3']),
            },
            result: {
                signatures: [
                    '3045022100f2521a4512a2513513a9618a03b8d8ad55bf859474ecfb74d7a1e534d25114c2022027489406604b2c9fc6b5ad1782048b7ddbd8dcf26b8707a9a13b4a493c7b5fe1',
                ],
                serializedTx:
                    '01000000011553ef34c683f4d6a8d346844409e6e7fc4ff01eaa25b7e8ce215abbfee3896101000000fd440600483045022100b5f6fbf3d6ebef172213e886c80ccba9b450c58bc18bed842ab2fc150c6e274302207c3920d6e8b9466b67bad2729cc7a52485f0a26eba8ea9b6ecb8d3fac0a4b16d01473044022030cfc01c8e5e8dcbf96deebac220cfc218fd9ae4c326a7d8e795536cd64cc58f02202dada83d34cf51ddf99dfa4f01a2983418e4d9e3137f88b4198472d0e284096c01483045022100e8634f280df5c096299709016b37f1a5dda05d6680f9eeae1e47dda7f5651995022079214053a62a911e1e3d28b934f9a32ce4a8d5ef576432f40584a1ce31274fce0147304402200345879de1d1ebefa16e62cd7a31168477959c251b4f61a77ed923007ec77b3402207f6e3f8b505adad3b32d83b366048bef50bb4f052b6499b0bb996094e1c4e8eb014730440220020e1eb47d7f428a1cd35e04782c27b47913944ce6174c46ba4531cf0842bbd2022030a8198855b96531c9385c9e4dd84a956dd1ef211964c1c1982f3eb40a91d88c01473044022005f8d405ee50653c7508251ad66147c71df528db7124310ffaefa57ff9839e760220383a7a6f86c8abcdc94724368e77c7370716fe62b400ff7d42a7d140f636a558014830450221009b2d68a358e485c37d9117ec598be547f83d9885f2c58e7e913e6e9ab6955fa202202848802eb093e68053ddcddc4162f00017e0d2ec1d6130ef8fcdc00f65b4fd2c01483045022100fe0b2e73e269cbb9cfd8035cee5be8561644cf204fd2cd190d89925e5669468b02203c85d18c74dff26e9d04ae30d0d6943bc932fab8d52838c84ef60f6d2268593e01483045022100ff4a2452a0fec838b354d62960d8b1eb1e9af20c56a818b7772da577ea7367360220499ed36546e23276a4a14563df88677072b1fb4b128bc05449d99f10b90980740147304402200e4fcdc587380c7b688fd093b5a551109056ee2f36df8e63f20648c81c172a60022079cdc72f7a318e5ff8b487914796cb7343825bdbf758808d119048a75062005f0147304402203eab30094e923667cb7f18abdbd4bf0c73251cfd7dd4ad5dd37dead23ca41332022046cfacda6f6ee31e612e7444a561e699eb8b414edc205ac9513e3b53b4594774014730440220074e3127eff6b87aff74cf1065f842a8f8d51b7c7919479a91c58c1034b1e6b702206a31a48386645c7730abf8b850dd7985952c13e1791040ecd0533961e14021e301483045022100cf9b538587593f51778eb50e11fe578bc13cddbb4ee03452662d415cc2c3ec0002207bd1cc14ca074fb623822740c6f451fc60b62777563e8374808e7c3f4c4d6c6b01473044022053d61515f5a29353e4fcbbab360852aeb609a22460c248e9e3dfeb0759269d1f0220698a1fa758eeb55954d64558c8a1f67ee7591261ad95f6c6dd160ef80891454f01483045022100f2521a4512a2513513a9618a03b8d8ad55bf859474ecfb74d7a1e534d25114c2022027489406604b2c9fc6b5ad1782048b7ddbd8dcf26b8707a9a13b4a493c7b5fe1014d01025f210281141623c07e77bf20e3335181e3c385e378713bee2071039af74f21e7e1d7a82103069b6d042359181b50c15f38b1029ce0947a5d8b256504d2fb9a91db7890c70a210391e26c2b423e687a7484205b71377285f0eb9366044603ebcfddc2a31abcca7221038103ccf6973890d90440e56ffaaba529be41d39d4a80a2b7228d311aeb0527282102b1a42ea1236877f9c212a91465ddbc60af3e6510c0bc5722cbc7872532aa5dfe21033854e6ea5e4926c2f979c9c939464b6603869ff8afe3f4ee8f190415df0562f4210349b6991fe34eedc0f63d93647259de2573b29342a0b9d8a201afc6d2be4c4bee21031089743da512d3e8b55871e9d0bd8ae18a9808ea98411d43b3b253469b14396021029d592d12f59e3276d7e714b4c6178545ff4427b709e76bd24cd06da8fe2a61292103e8281eee4489f1f6906b325c01317db2889e45fc56b4505fbba087af67d9521b2103e61921f04c232124d2181c8553c6c90b17419d8ed6d869fc2a7c5035caf9f01c21031a8b3ae83fea500e2704bd1c5d79eaec5fb0f3dffd7b9d69808a0c79d8f3a9c721033f1f50153130d91289c23ffe26fbda95711e40cd786a6eebc887e155594c79e42102660cd2cbb150386ff51ed786ca702b48c2d819c2682011f88eda9a1f03f311e621036061119a6c8a7585da55aaa14ec5bf8bbbb5bf8db33bd3ae14de926d7fc502ee5faeffffffff0110270000000000001976a9144a087d89f8ad16ca029c675b037c02fd1c5f9aec88ac00000000',
            },
        },
        {
            description: 'Bitcoin (multisig): missing pubkey (different seed)',
            setup: {
                mnemonic: 'mnemonic_12',
            },
            params: {
                coin: 'Bitcoin',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/48'/0'/1'/0'/0/0"),
                        prev_hash:
                            'c6091adf4c0c23982a35899a6e58ae11e703eacd7954f588ed4b9cdefc4dba52',
                        prev_index: 1,
                        amount: '100000',
                        script_type: 'SPENDMULTISIG',
                        multisig: {
                            pubkeys: PUBKEYS_2_OF_3,
                            signatures: ['', '', ''],
                            m: 2,
                        },
                    },
                ],
                outputs: [
                    {
                        address: '12iyMbUb4R2K3gre4dHSrbu5azG5KaqVss',
                        amount: '100000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['c6091a']),
            },
            result: false,
        },
    ],
};
