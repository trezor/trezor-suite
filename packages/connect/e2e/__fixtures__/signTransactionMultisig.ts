const { ADDRESS_N, TX_CACHE } = global.TestUtils;

// fixtures: https://github.com/trezor/trezor-firmware/blob/main/tests/device_tests/test_multisig.py

const PUBKEYS_15 = [];
for (let i = 0; i < 15; i++) {
    PUBKEYS_15.push({
        // xpub: m/48'/1'/1'/0'
        node: 'tpubDF4tYm8PaDydbLMZZRqcquYZ6AvxFmyTv6RhSokPh6YxccaCxP1gF2VABKV9wsinAdUbsbdLx1vcXdJH8qRcQMM9VYd926rWM685CepPUdN',
        address_n: [0, i],
    });
}

const PUBKEYS_2_OF_3 = [
    {
        // xpub: m/48'/1'/1'/0'
        node: 'tpubDF4tYm8PaDydbLMZZRqcquYZ6AvxFmyTv6RhSokPh6YxccaCxP1gF2VABKV9wsinAdUbsbdLx1vcXdJH8qRcQMM9VYd926rWM685CepPUdN',
        address_n: [0, 0],
    },
    {
        // xpub: m/48'/1'/2'/0'
        node: 'tpubDEhpbishBroZWzT7sQf9YuXiyCUSdkK6Cur95UkDdTRcyrJUhLtn69GhC8mJwrxmXRLSUitWAgsXcQ3Cb16EaqFyMob4LHPqzohSzyMMmP5',
        address_n: [0, 0],
    },
    {
        // xpub: m/48'/1'/3'/0'
        node: 'tpubDFLKt47Wb4BomPVBFW675DKNuhbd9hkx7s1wr2C8GMgQM5Sa5susNc78xKWsjkrkkCQsMT4o7m5RD8ZJqTgh9cjwEQg8pjCxr9Ar77C2wiv',
        address_n: [0, 0],
    },
];

const SIGNATURES_2_OF_3 = [
    '304402206c99b48a12f340599076b93efdc2578b0cdeaedf9092aed628788f4ffc579a50022031b16212dd1f0f62f01bb5862b6d128276c7a5430746aa27a04ae0c8acbcb3b1',
    '304502210089153ad97c0d69656cd9bd9eb2056552acaec91365dd7ab31250f3f707123baa02200f884de63041d73bd20fbe8804c6036968d8149b7f46963a82b561cd8211ab08',
];

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        // https://tbtc1.trezor.io/api/tx/4123415574c16899b4bb5b691f9b65643dbe566a9b68e4e2e7a8b29c79c83f2b
        {
            description: 'Testnet (multisig): 2 of 3 (sign with 1st key)',
            params: {
                coin: 'testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/48'/1'/1'/0'/0/0"),
                        prev_hash:
                            '6b07c1321b52d9c85743f9695e13eb431b41708cdf4e1585258d51208e5b93fc',
                        prev_index: 0,
                        amount: 1496278,
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
                        address: 'mnY26FLTzfC94mDoUcyDJh1GVE3LuAUMbs',
                        amount: 1496278 - 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['6b07c1']),
            },
            result: {
                signatures: [SIGNATURES_2_OF_3[0]],
            },
        },
        // https://tbtc1.trezor.io/api/tx/4123415574c16899b4bb5b691f9b65643dbe566a9b68e4e2e7a8b29c79c83f2b
        {
            description: 'Testnet (multisig): 2 of 3 (sign with 3rd key)',
            params: {
                coin: 'testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/48'/1'/3'/0'/0/0"),
                        prev_hash:
                            '6b07c1321b52d9c85743f9695e13eb431b41708cdf4e1585258d51208e5b93fc',
                        prev_index: 0,
                        amount: 1496278,
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
                        address: 'mnY26FLTzfC94mDoUcyDJh1GVE3LuAUMbs',
                        amount: 1496278 - 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['6b07c1']),
            },
            result: {
                signatures: [SIGNATURES_2_OF_3[1]],
                serializedTx:
                    '0100000001fc935b8e20518d2585154edf8c70411b43eb135e69f94357c8d9521b32c1076b00000000fdfd000047304402206c99b48a12f340599076b93efdc2578b0cdeaedf9092aed628788f4ffc579a50022031b16212dd1f0f62f01bb5862b6d128276c7a5430746aa27a04ae0c8acbcb3b10148304502210089153ad97c0d69656cd9bd9eb2056552acaec91365dd7ab31250f3f707123baa02200f884de63041d73bd20fbe8804c6036968d8149b7f46963a82b561cd8211ab08014c69522103725d6c5253f2040a9a73af24bcc196bf302d6cc94374dd7197b138e10912670121038924e94fff15302a3fb45ad4fc0ed17178800f0f1c2bdacb1017f4db951aa9f12102aae8affd0eb8e1181d665daef4de1828f23053c548ec9bafc3a787f558aa014153aeffffffff01c6ad1600000000001976a9144cfc772f24b600762f905a1ee799ce0e9c26831f88ac00000000',
            },
        },
        // https://tbtc1.trezor.io/api/tx/b41284067577e1266ad3632f7caffead5d58277cc35f42642455bfd2a3fa0325
        {
            description: 'Testnet (multisig): 15 of 15 (sign with 15th key)',
            params: {
                coin: 'testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/48'/1'/1'/0'/0/14"),
                        prev_hash:
                            '0d5b5648d47b5650edea1af3d47bbe5624213abb577cf1b1c96f98321f75cdbc',
                        prev_index: 0,
                        amount: 1476278,
                        script_type: 'SPENDMULTISIG',
                        // sequence: 4294967295,
                        multisig: {
                            pubkeys: PUBKEYS_15,
                            signatures: [
                                '3045022100c5e8ead2a9370b7a1b216aed668e7eb2d2fea18966a1d451efd056fda64c9df6022025a8d99049d54eab61f108dc951bbc06c84447712f8dd29a861a940da90bfec3',
                                '3044022023d8328a73eb367a9056ed9788d4d3a94838e042d91b27bb7908323fff47807e022041c36c372cf2f4e1991523a52ccd0556478883ee5f4de2b3af5b2f51231e9a35',
                                '304502210094effea35e97dcad3ca72a5dbed9514bf46f30d8df4c8acfcf802fdb6acb7dda022067a60066c07f083eeebec15c016b1ca60415dc83e69800e4d2926c71d2d87119',
                                '3045022100bd61237af5158cb4f5bd2c4250a05741511e3fcc59d7eec8269f9e0479472ab7022059146781d68c54665bacd81cb90d7d5588154924a9298a739fa5f5ecacae11e8',
                                '30450221009e96930d69b162dfcd324f794e818cae03eb44a7b57b3cd5e740b19e34ac885f022079a877094a43f6fdd03e84b6138c2b2648e72d013896e860c310e23316a1c328',
                                '3045022100b0fcf093d98f18102bebb6ee6c59a49d6f05db2bbcd9038f5b737b2ca2d68b3302206b4833d65527fdaf75944f6378110dc1cbd5ed5380b79d369eebc4b1f373472d',
                                '3045022100eb3441fd02221ed2f12ffdd964e8209703f44b4fe3d3c002e37d3b8ea0cca88902200bda222770a4f864e17af55502b96c3c72aa92c93662a106cd7b295dc1718289',
                                '3045022100cb5d1295f871e88c7a99b1cc9863d87e17a8c3c27891849285a740c76e0a14a302206991e0e840f9d3d075b11c0cd149dd47f372e8571e4f02a36d4488ecc737b777',
                                '3045022100c69a809598f99c86951b53e7ee90b8a204303f9c60593a2333c03b30adc819af022021b42b9d6a7e96469e467efd971b2ccdd24583243e586d184efe00efa7bbe52d',
                                '3045022100f23c515d166d6602b79f88f72a1c866f395861ee42546023e5f45e0536aa4b69022073eb205c915bbd781e5ad5d32d4d5051d82ae7a963442201e81985026b2ef9f7',
                                '304402207624b74f08b51c3306624a52c0e5db3c8db4b2c6e84207837617a1373ac80f7902204208e90763e522ce20e9d1baad8219226295b545844f39687f34f082f32bc668',
                                '3045022100c1b6c4cdb831853eae5a4c2c98effc42e494c6edef82b2c3e67077f2fa64179d022066cee19a4709015c1451779fa72c4b7a7652e97af2ddfda69a7afde2e8c6c7c0',
                                '3045022100f7303f87211605738a83405930cc92531fc97c799294740f4aded139d4f41a2302207d157b0913f4d69cf28fdf418fcbb94e82e8cf02f55b8ac4727e4b576f0517c7',
                                '30440220100b6562330591b0caca024ba5536f24a6a2f208ac367d86c99345ef2736b6f302204e880de0bf68cd2177678f320af467a9e547625ca72bf4855653f8eaab2392bb',
                                '',
                            ],
                            m: 15,
                        },
                    },
                ],
                outputs: [
                    {
                        address: 'mnY26FLTzfC94mDoUcyDJh1GVE3LuAUMbs',
                        amount: 1476278 - 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['0d5b56']),
            },
            result: {
                serializedTx:
                    '0100000001bccd751f32986fc9b1f17c57bb3a212456be7bd4f31aeaed50567bd448565b0d00000000fd490600483045022100c5e8ead2a9370b7a1b216aed668e7eb2d2fea18966a1d451efd056fda64c9df6022025a8d99049d54eab61f108dc951bbc06c84447712f8dd29a861a940da90bfec301473044022023d8328a73eb367a9056ed9788d4d3a94838e042d91b27bb7908323fff47807e022041c36c372cf2f4e1991523a52ccd0556478883ee5f4de2b3af5b2f51231e9a350148304502210094effea35e97dcad3ca72a5dbed9514bf46f30d8df4c8acfcf802fdb6acb7dda022067a60066c07f083eeebec15c016b1ca60415dc83e69800e4d2926c71d2d8711901483045022100bd61237af5158cb4f5bd2c4250a05741511e3fcc59d7eec8269f9e0479472ab7022059146781d68c54665bacd81cb90d7d5588154924a9298a739fa5f5ecacae11e8014830450221009e96930d69b162dfcd324f794e818cae03eb44a7b57b3cd5e740b19e34ac885f022079a877094a43f6fdd03e84b6138c2b2648e72d013896e860c310e23316a1c32801483045022100b0fcf093d98f18102bebb6ee6c59a49d6f05db2bbcd9038f5b737b2ca2d68b3302206b4833d65527fdaf75944f6378110dc1cbd5ed5380b79d369eebc4b1f373472d01483045022100eb3441fd02221ed2f12ffdd964e8209703f44b4fe3d3c002e37d3b8ea0cca88902200bda222770a4f864e17af55502b96c3c72aa92c93662a106cd7b295dc171828901483045022100cb5d1295f871e88c7a99b1cc9863d87e17a8c3c27891849285a740c76e0a14a302206991e0e840f9d3d075b11c0cd149dd47f372e8571e4f02a36d4488ecc737b77701483045022100c69a809598f99c86951b53e7ee90b8a204303f9c60593a2333c03b30adc819af022021b42b9d6a7e96469e467efd971b2ccdd24583243e586d184efe00efa7bbe52d01483045022100f23c515d166d6602b79f88f72a1c866f395861ee42546023e5f45e0536aa4b69022073eb205c915bbd781e5ad5d32d4d5051d82ae7a963442201e81985026b2ef9f70147304402207624b74f08b51c3306624a52c0e5db3c8db4b2c6e84207837617a1373ac80f7902204208e90763e522ce20e9d1baad8219226295b545844f39687f34f082f32bc66801483045022100c1b6c4cdb831853eae5a4c2c98effc42e494c6edef82b2c3e67077f2fa64179d022066cee19a4709015c1451779fa72c4b7a7652e97af2ddfda69a7afde2e8c6c7c001483045022100f7303f87211605738a83405930cc92531fc97c799294740f4aded139d4f41a2302207d157b0913f4d69cf28fdf418fcbb94e82e8cf02f55b8ac4727e4b576f0517c7014730440220100b6562330591b0caca024ba5536f24a6a2f208ac367d86c99345ef2736b6f302204e880de0bf68cd2177678f320af467a9e547625ca72bf4855653f8eaab2392bb01483045022100a3b204c0d9b59832efa61a3d3fc45c0ae949546581d743f8b0c52f831ab9628d022014c9a1822f47ac4e73fadfb1d12219210954579cc4ec9d90013791093065a919014d01025f2103725d6c5253f2040a9a73af24bcc196bf302d6cc94374dd7197b138e1091267012103f1e53b6e0ff99adf7e8fa826a94bdac83163d8abbc1d19a8d6b88a4af91b9a672103867d07f62ca478cf81833aab8986762f5ec5cc4af8cb209e1ef9c2f5a603550f2103625cfe267fccb637c85fe58cddc62d076710a70984daa8241c13c5809f361c912102a432bea1f057ee3f9f29641ea6dece719107299fe1cf3c749e3f65c9281758342102e3ec7638d1bd7f9f460f9dd45eda9a87ed6294b964eb1162c7c218a14de19efa210291c759e749ed4cc4bcab9fc82cc235ed20886d513eea041ff0a5b35d022668fc2102eb48c864e98e34df977d00d59a0269c0e4e587af8a735b74bc3045da9ba92b56210348a71ae119a69800a7cee68e05a6d5254f944d1223f029ab3488da662acaf301210239198c3053db07e85ef26e75beda25a156c147761de936a8eedaad65fea04a462103970fcc04710295ad215d5586543f423da63970451793fa36dc55480281908ea62102f027e2301b2caf019913f266ffcc459bec38269a675dcd7515b78b0b492a627521030d3ae4d84c1dd1001cf3646eafcd168d6c89f8830e3f700b06df0d4790f510f5210303858fce8047ac7dcbb14a532a407d5419ccc713bbc72991da56f8c197e262632103f3d859f76190e9819be1eeec94ad12a8499af0348e3134f0f0e69417e50e5d505faeffffffff01a65f1600000000001976a9144cfc772f24b600762f905a1ee799ce0e9c26831f88ac00000000',
            },
        },
        {
            description: 'Testnet (multisig): missing pubkey',
            setup: {
                mnemonic: 'mnemonic_12',
            },
            params: {
                coin: 'testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/48'/1'/1'/0'/0/0"),
                        prev_hash:
                            '0d5b5648d47b5650edea1af3d47bbe5624213abb577cf1b1c96f98321f75cdbc',
                        prev_index: 0,
                        amount: 1476278,
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
                        address: 'mnY26FLTzfC94mDoUcyDJh1GVE3LuAUMbs',
                        amount: 1476278 - 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['0d5b56']),
            },
            result: false,
        },
        {
            description: 'https://github.com/trezor/trezor-suite/issues/6234',
            setup: {
                mnemonic:
                    'solar segment strike patrol broccoli witness praise tennis fat elegant yellow menu favorite upgrade grace pulp subject tribe impact head west museum pulse term',
            },
            params: {
                coin: 'testnet',
                inputs: [
                    {
                        address_n: [2147483696, 2147483649, 2147483648, 2147483650, 0, 13],
                        prev_index: 0,
                        prev_hash:
                            'a48aa3de3a0d5e82625d004ac316c8dbbe7a0b2380dd632f974e0513b0a181ef',
                        script_type: 'SPENDWITNESS',
                        multisig: {
                            pubkeys: [
                                {
                                    node: 'tpubDEAEqUEydwjFkvZrk63u5qnhyQkMct2h7mmhUvue2GYACSygeyiDCXV5g59bs5Nursa3nAEWy1UamZaLL37tBqwVVLdhr9LzpkA7hdK2K3j',
                                    address_n: [0, 13],
                                },
                                {
                                    node: 'tpubDEFGNNrhcGZYq8i21XtJBfQqoktvRs3vmGT8nvS31QFgDMzPtLDyowdLLBMNf7fMQ7EBXCovagQctkFoXJqmUGeN4RzP3U7LKxzVp8R5YMu',
                                    address_n: [0, 13],
                                },
                                {
                                    node: 'tpubDEkumAckjusYPWdDBUm1HPg7tcJHAMRFfChXyBRu4Cyae6EteY3wekSh4rMmEVwPqiqY3CtZovtnR2X9dS7nbZ56C9hvpPiqtitDdvKCYFv',
                                    address_n: [0, 13],
                                },
                            ],
                            signatures: [],
                            m: 2,
                        },
                        amount: '600000',
                    },
                ],
                outputs: [
                    {
                        address_n: [2147483696, 2147483649, 2147483648, 2147483650, 1, 1],
                        script_type: 'PAYTOWITNESS',
                        amount: '199811',
                        multisig: {
                            pubkeys: [
                                {
                                    node: 'tpubDEAEqUEydwjFkvZrk63u5qnhyQkMct2h7mmhUvue2GYACSygeyiDCXV5g59bs5Nursa3nAEWy1UamZaLL37tBqwVVLdhr9LzpkA7hdK2K3j',
                                    address_n: [1, 1],
                                },
                                {
                                    node: 'tpubDEFGNNrhcGZYq8i21XtJBfQqoktvRs3vmGT8nvS31QFgDMzPtLDyowdLLBMNf7fMQ7EBXCovagQctkFoXJqmUGeN4RzP3U7LKxzVp8R5YMu',
                                    address_n: [1, 1],
                                },
                                {
                                    node: 'tpubDEkumAckjusYPWdDBUm1HPg7tcJHAMRFfChXyBRu4Cyae6EteY3wekSh4rMmEVwPqiqY3CtZovtnR2X9dS7nbZ56C9hvpPiqtitDdvKCYFv',
                                    address_n: [1, 1],
                                },
                            ],
                            signatures: [],
                            m: 2,
                        },
                    },
                    {
                        script_type: 'PAYTOADDRESS',
                        amount: '400000',
                        address: 'tb1q0egy6cmrhzz69l3xn7tpndjt2dtqkk7a9mlruh',
                    },
                ],
                refTxs: TX_CACHE(['a48aa3']),
            },
            result: {
                signatures: [
                    '3045022100fe3c723cdb1ebbbf4b3f889ec3c4449412a4f64231a3f48dba74ce037945d658022025424ca47d221ef02e3ba08ef9a104e506a10f4aecb36ea3d2013c6495b262fe',
                ],
                serializedTx:
                    '01000000000101ef81a1b013054e972f63dd80230b7abedbc816c34a005d62825e0d3adea38aa40000000000ffffffff02830c030000000000220020ab4e9fef404206b0112ce540e01286e6a07a18ca9005fee27908659a2169ae05801a0600000000001600147e504d6363b885a2fe269f9619b64b53560b5bdd0300483045022100fe3c723cdb1ebbbf4b3f889ec3c4449412a4f64231a3f48dba74ce037945d658022025424ca47d221ef02e3ba08ef9a104e506a10f4aecb36ea3d2013c6495b262fe01695221028ea1d4d06cef29e8bf919995ffb9e55cea91eef5b85ca036e1f9ebe1ab6e5f5521035d4060d36c60a512837ffb316c03bd68e7e448c72c66e462fe528813042e340b2103da108bf1722968df8c228bd6e3981388127169884482664c21f859d3b8d7f1a853ae00000000',
                witnesses: [
                    '0300483045022100fe3c723cdb1ebbbf4b3f889ec3c4449412a4f64231a3f48dba74ce037945d658022025424ca47d221ef02e3ba08ef9a104e506a10f4aecb36ea3d2013c6495b262fe01695221028ea1d4d06cef29e8bf919995ffb9e55cea91eef5b85ca036e1f9ebe1ab6e5f5521035d4060d36c60a512837ffb316c03bd68e7e448c72c66e462fe528813042e340b2103da108bf1722968df8c228bd6e3981388127169884482664c21f859d3b8d7f1a853ae',
                ],
            },
        },
    ],
};
