const legacyResults = [
    {
        rules: ['<2.5.3', '1'],
        success: false,
    },
];

const moneroSignTransaction: TestCase = {
    method: 'moneroSignTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Simple transaction - 1 input, 2 outputs',
            params: {
                path: "m/44'/128'/0'",
                networkType: 1,
                tsx_data: {
                    unlock_time: 0,
                    num_inputs: 1,
                    mixin: 15,
                    fee: 1000000000,
                    account: 0,
                    minor_indices: [],
                    integrated_indices: [],
                    client_version: 3,
                    hard_fork: 16,
                    outputs: [
                        {
                            amount: 333000000000,
                            addr: {
                                spend_public_key:
                                    '82d13691c317a335b19f7e654ba707692cd80b9b9a9e492be72ea56d5c310be2',
                                view_public_key:
                                    '47fa344ae0e7f66c11b423dea8b5519dbf7b3d2fb0ab434b39da0fc1fada5704',
                            },
                            is_subaddress: false,
                            original:
                                '9x8BPVAXijU9yu4DP2qPYSJbLCBwaQZLL8Lv3q1XT3X8erDDrhk9F8yK5QZNqaxknkTPMULPwtPycDanc2GkXPSN1VHNoRk',
                            is_integrated: false,
                        },
                        {
                            amount: 666000000000,
                            addr: {
                                spend_public_key:
                                    '9f1b39ee15005b7af11db2cdd8f802de2b7e8667b52e5944aa96355d880d9c51',
                                view_public_key:
                                    '93e6b2de17d6adfc03a97dd5c9007f0daa39fdea7b2b67a7cba37d3a0371ddb9',
                            },
                            is_subaddress: false,
                            original:
                                '9yCMhXSreAeMZh2HzbKPyjeAKvkxomBMACV9gSDWSTm5EeQZeSG6724j9rZMLaFjoC3HZtkPePDE6V4pvHRu9xAQMvrvRRU',
                            is_integrated: false,
                        },
                    ],
                    rsig_data: {
                        rsig_type: 1,
                        bp_version: 4,
                        grouping: [2],
                    },
                },
                inputs: [
                    {
                        outputs: [
                            {
                                idx: 11,
                                key: {
                                    dest: '30a1636f613a32ffe90480c34e4b12187c8b0aa6cee377469a71d5752b7bb23b',
                                    commitment:
                                        '983378c65e5943417bfb22229abc76754ba7f0e541a1bbb92a400e4a6a42b623',
                                },
                            },
                            {
                                idx: 113,
                                key: {
                                    dest: '89ff0d76cec901a44758f83004df80e4eaaec22d9324023cd19e92103a8a12fe',
                                    commitment:
                                        '513c192d90cf7f5b1becba27430935c78022b1e7a10a7609b6fb12c8a1b9841f',
                                },
                            },
                            {
                                idx: 14,
                                key: {
                                    dest: '936525107736f957303d414498c5f7675208e23e3f10035464939ed697140900',
                                    commitment:
                                        'fee10e0904d698f8f0d243889ab6e30c902befb99469c7ad8d65d4893c354f3e',
                                },
                            },
                            {
                                idx: 20,
                                key: {
                                    dest: '4c50ff9ae92f3adc799797b5b5caec7bce35df4c1fbf21525b001fbfb2d074c1',
                                    commitment:
                                        '22717dddc23748c19a53488d83a2df20c6c91c11e006448c70cfdfc245bf76a2',
                                },
                            },
                            {
                                idx: 3,
                                key: {
                                    dest: 'd67ff4018e35d88d1ee0e294c42cc9e5c043cd64a78830400f7f57ec4a0f9971',
                                    commitment:
                                        '15097d167d5acb8fbafe0ab01182da175e8cc50ce0b6ca01866b7e130b6555e5',
                                },
                            },
                            {
                                idx: 19,
                                key: {
                                    dest: 'e7305b2b6469dba1821698c67b900037dee8ea402fb24a4ff91ddb30dc3e6163',
                                    commitment:
                                        '9bd607f7c0dffefea36a410160d3d5b03e99ff7c572c0adb147af458785fd350',
                                },
                            },
                            {
                                idx: 4,
                                key: {
                                    dest: '271f6ea7b1caceb2e868a66cab69ee85518d9f17e99db91d8e8a0560a28b567e',
                                    commitment:
                                        '1991d992c2e487fd0c7e2a4903a1654efd5b71c4d678bbc3c408b948a2577d50',
                                },
                            },
                            {
                                idx: 39,
                                key: {
                                    dest: '4ffe05d206b2672a85f75402f743745f2722fe65d426a315616b6baa1f723e2f',
                                    commitment:
                                        'e9780d54ee09b06d44c7f5afd0a8a84baa1bfeb4cf60150617078a18956fa9fc',
                                },
                            },
                            {
                                idx: 16,
                                key: {
                                    dest: '2b4c32f903a4786d75b2f4da3240b7ae45c51c12306c73a96b0768070fb028c2',
                                    commitment:
                                        '735f7d057109e6f71f961501f3706145a5e8bff1dde64111fefb4fc4ed0525c4',
                                },
                            },
                            {
                                idx: 20,
                                key: {
                                    dest: 'a4c1aa38c9b350b0b55f752cee26189e272c1f63d3106896de2a63301810ce11',
                                    commitment:
                                        '983790812c391f4b8e95af39bd3e89d0e25a73a5603ed9286e0ec15d24a18e5e',
                                },
                            },
                            {
                                idx: 3,
                                key: {
                                    dest: 'd9885b3d6774de10dbb3f271cc106ce6cc93fcf454f3262677bf10d625b68bf7',
                                    commitment:
                                        'b70ed36a1e49792010184f22034be14d282554e1a37629afa73d8870582e9186',
                                },
                            },
                            {
                                idx: 23,
                                key: {
                                    dest: '0a70ea28d3cbedb72301e6c6a9ec8d41c89b313e4a23d9a0ef12157da07db619',
                                    commitment:
                                        'f8fd9da1c16264de426dda148c5ed9e285e14f02acdcfc232cb2e0abf1789d6e',
                                },
                            },
                            {
                                idx: 6,
                                key: {
                                    dest: '31a001af96376ad863b3c1cf2fe468fa74e6e1c7ec5f34126d09114a080ac3b9',
                                    commitment:
                                        '61698e6ae4a2b326030c4fb813c88e4f02f6f8feac0976754c2cb114895e2ced',
                                },
                            },
                            {
                                idx: 1,
                                key: {
                                    dest: '7dec0733b4075ec403f0671f1e15e4f3d5c1be34b371bacf9db69355d0bf2ded',
                                    commitment:
                                        '21cfa63612157860daf99d938e7614301f9212354a23bb7bc7fc1908c86543ea',
                                },
                            },
                            {
                                idx: 15,
                                key: {
                                    dest: '84363fefa02da8a78e5f6331dfb34f3f239638a61a09adbd7bc5632e59236750',
                                    commitment:
                                        'a58bcc18ce0577881989b473e4f76d0a9d908e75e91479e9b19ea09e9ae9cc71',
                                },
                            },
                            {
                                idx: 19,
                                key: {
                                    dest: '5a10addc18fefcd033f3a0c6de61edd145fd84856de66d88cdafbbdb736b0c4c',
                                    commitment:
                                        'f4510a8e5681e46d813c92b4060351fad1d6b27731d556b944da0e58e9914482',
                                },
                            },
                        ],
                        real_output: 13,
                        real_out_tx_key:
                            'e3c8b1f31e695a57ed073bf7cb09d85c82870766887673974ea154dfbb55e565',
                        real_out_additional_tx_keys: [],
                        real_output_in_tx_index: 1,
                        amount: 1000000000000,
                        rct: true,
                        mask: '5c9f93dc811ad3d252d24f95d21f794a120fe2f8ca9fa6ea488441e726b76b03',
                        subaddr_minor: 0,
                    },
                ],
            },
            result: {
                signatures: [expect.any(String)],
                tx_prefix_hash: expect.any(String),
                rv: {
                    txn_fee: 1000000000,
                    rv_type: 6,
                },
                pseudo_outs: [expect.any(String)],
            },
            legacyResults,
        },
        {
            description: 'Transaction with multiple inputs',
            params: {
                path: "m/44'/128'/0'",
                networkType: 1,
                tsx_data: {
                    unlock_time: 0,
                    num_inputs: 2,
                    mixin: 15,
                    fee: 1000000000,
                    account: 0,
                    minor_indices: [],
                    integrated_indices: [],
                    client_version: 3,
                    hard_fork: 16,
                    outputs: [
                        {
                            amount: 749500000000,
                            addr: {
                                spend_public_key:
                                    '56f1607b61f0c3edfe721bc234b7e7270ff1658a5a383385b1fce6338a93fc3e',
                                view_public_key:
                                    '6e4cc3baf373e26a95500921c8625768043b38fd026543d07c82470b917f855f',
                            },
                            is_subaddress: false,
                            original:
                                '9vTkG9sodzzgoqgB6Nqg7Y7XxGxdT6RtWPN1fqiy1rgbBSf8wvYADfXJpzUvrwSiqCJQ6FrvF35YWbsaaMYHzj4gBmdjGos',
                            is_integrated: false,
                        },
                        {
                            amount: 749500000000,
                            addr: {
                                spend_public_key:
                                    '9f1b39ee15005b7af11db2cdd8f802de2b7e8667b52e5944aa96355d880d9c51',
                                view_public_key:
                                    '93e6b2de17d6adfc03a97dd5c9007f0daa39fdea7b2b67a7cba37d3a0371ddb9',
                            },
                            is_subaddress: false,
                            original:
                                '9yCMhXSreAeMZh2HzbKPyjeAKvkxomBMACV9gSDWSTm5EeQZeSG6724j9rZMLaFjoC3HZtkPePDE6V4pvHRu9xAQMvrvRRU',
                            is_integrated: false,
                        },
                    ],
                    rsig_data: {
                        rsig_type: 1,
                        bp_version: 4,
                        grouping: [2],
                    },
                },
                inputs: [
                    {
                        outputs: [
                            {
                                idx: 118,
                                key: {
                                    dest: '83368677fadf9df2b17c91a712481f920dbd6ac7c86088fd11455d97f2df7270',
                                    commitment:
                                        'c6055dfdc4be32b94f9357ee5dcd1d731e50066bac74d39be58aa613d1e93b2a',
                                },
                            },
                            {
                                idx: 17,
                                key: {
                                    dest: 'f0994e452f644d5a9178774da09882958e29b139bb75191a13d64efb75135204',
                                    commitment:
                                        '9d947d8e4069313642655eac6198eb45ccd82b4c432e6815d88007efbba8fa55',
                                },
                            },
                            {
                                idx: 19,
                                key: {
                                    dest: '89a309be9f4b8db94730572b8094c4fd7e1ea5e4f34f8bbdb3493584b3ea5190',
                                    commitment:
                                        '9e8a59dd974e94199db9328b864fd014559eb109fa4c2428e41c36f2fb7992f6',
                                },
                            },
                            {
                                idx: 14,
                                key: {
                                    dest: '7f69fe02233ec73cc8a40dbcc00eae7f59463e4664c9771fce9d4d402cef2e08',
                                    commitment:
                                        'b19b3473dc3cb0a40094f6635d8d3403005bb6c291451df6ba739a2ddc32bc45',
                                },
                            },
                            {
                                idx: 63,
                                key: {
                                    dest: 'df602b9daa5e466e707bea80a8e7783acf62aeb6b66f316fcc030b265c8dcf21',
                                    commitment:
                                        '80b9b0eae6caa64bc01a10c7f709c1329c2188dea1096ffbdf4405642daff517',
                                },
                            },
                            {
                                idx: 4,
                                key: {
                                    dest: 'a6fdac7acd2c1c27e38af57b9b1c68b2ebd63fd394971d9e1cbd8349ea884f9c',
                                    commitment:
                                        '873a628c573702d2a159511d26a92a9648d381234ffc7f5a1d68008cc996477f',
                                },
                            },
                            {
                                idx: 34,
                                key: {
                                    dest: '4184b5cdaba6d42509efd7a892d5112e706de2d6686b0a710df8eef44ac2fdc6',
                                    commitment:
                                        'fe02611e59c6258e11e1c4ab439fb63484ab8eea1235e3be5e0247c7b21dfcaf',
                                },
                            },
                            {
                                idx: 1,
                                key: {
                                    dest: '83fc933bb27a40e660cac6e83a30662a378cb36ed2307282b00c6c5e75f52263',
                                    commitment:
                                        '2c45fb8045478b549fd3e3068829ba7b55fd5e181c5a13ee7dcf74b06f2ab6ad',
                                },
                            },
                            {
                                idx: 3,
                                key: {
                                    dest: '5d10be0aa09d3870b610188810c4cf87ef519d2cea5c5d92fc1bd998a1eac1aa',
                                    commitment:
                                        '09d1f5365b7e4e13d7bff43c4443d33396fd0003765ce313bb2ac37507c335c2',
                                },
                            },
                            {
                                idx: 13,
                                key: {
                                    dest: '614d04ff4a56e5aaca2e28811cd10e121a8a880d40b1c7d564e1b7c3570a350a',
                                    commitment:
                                        '1cab61e3e1d5466ad70aeebee83e89e115db1ca2215408a831d0b3179377897f',
                                },
                            },
                            {
                                idx: 6,
                                key: {
                                    dest: '7dec0733b4075ec403f0671f1e15e4f3d5c1be34b371bacf9db69355d0bf2ded',
                                    commitment:
                                        '21cfa63612157860daf99d938e7614301f9212354a23bb7bc7fc1908c86543ea',
                                },
                            },
                            {
                                idx: 7,
                                key: {
                                    dest: 'be00696b12dad7bc6084e657d499b1a48ffb05ca522254bfaec63fb93ecfa3f4',
                                    commitment:
                                        '09ce340e33fbe873e9a2c57159ebe505084319c8e4ebde5bd8892fcc905c47e3',
                                },
                            },
                            {
                                idx: 1,
                                key: {
                                    dest: 'c9480790a4687a13afb867669f2c832c4d49a5663268c32502125d43425d97cf',
                                    commitment:
                                        '01dc0285b9ce1f52360572c420bb200b54016c73c986eb65d069a98f2210282f',
                                },
                            },
                            {
                                idx: 8,
                                key: {
                                    dest: 'bd8d63ca54f990db0cc15299cf30aefce0783346f8ef8b991916037a56ad34c4',
                                    commitment:
                                        'b7606d60b3265568cb0d1728689c3149318f19094855755189afc31d26ff01d4',
                                },
                            },
                            {
                                idx: 8,
                                key: {
                                    dest: '16360ab94268a516563248367a022bf7656b41998a30cbc2478892f777439bab',
                                    commitment:
                                        'bdb782a8848c8c6412a00bc9412cc5c7d92860a45a5475a6e76603bf8a14a1c7',
                                },
                            },
                            {
                                idx: 2,
                                key: {
                                    dest: '75e23ff98d01af6f75dd18e7298f4e224967e553462fe96ac052803a91734669',
                                    commitment:
                                        '8681e711fe217099fe8d4c0fb6307e87e0d7c6f9c573314bffc762b097e8032e',
                                },
                            },
                        ],
                        real_output: 10,
                        real_out_tx_key:
                            'e3c8b1f31e695a57ed073bf7cb09d85c82870766887673974ea154dfbb55e565',
                        real_out_additional_tx_keys: [],
                        real_output_in_tx_index: 1,
                        amount: 1000000000000,
                        rct: true,
                        mask: '5c9f93dc811ad3d252d24f95d21f794a120fe2f8ca9fa6ea488441e726b76b03',
                        subaddr_minor: 0,
                    },
                    {
                        outputs: [
                            {
                                idx: 19,
                                key: {
                                    dest: 'ca926e37f82bf2a3ee15188ae3ee4424d0a4a97b21376f9749399deecf9dd3e2',
                                    commitment:
                                        'cb603b8e9fa71a7cefbcdf5cad7cb6e598bdbf626fe1cd9c4821449fd8abbf5e',
                                },
                            },
                            {
                                idx: 59,
                                key: {
                                    dest: '5f32c99b91875aff8e6403059a6dd3044271d568f768136082f7486249ebc971',
                                    commitment:
                                        'bd59befac1d5ae2518e2a544e706f3c68b25833fc6e7f968309aafa95fc44fe3',
                                },
                            },
                            {
                                idx: 8,
                                key: {
                                    dest: '0d9cd8520c7c0911ce8c6dc2ab1cc82077e484d2900a0b22edf3701855452088',
                                    commitment:
                                        '14f4c63bd3f532dee716fd3dad691732bed983bea2bbfac920b5cc83c19adfe3',
                                },
                            },
                            {
                                idx: 20,
                                key: {
                                    dest: '20068358d818680deb289fe27ced5bc84cda90d8d4a4d61158c456159a9a2856',
                                    commitment:
                                        '7df02a3c62a8e5e09d296ea0546e79cabbed8192929c41b4511564b9b8050244',
                                },
                            },
                            {
                                idx: 2,
                                key: {
                                    dest: 'e98408a99c1dcb9314b1e20c0c9d5590236eb0405d5334656d01c2ed4672e8f6',
                                    commitment:
                                        '2432a5ff4235db6fce150c641d818586ccc7ff3cb556bc15af1e7f415a5721a3',
                                },
                            },
                            {
                                idx: 36,
                                key: {
                                    dest: '62c4e46d58d1274594cde7968da6d2add4794edca41f59404715558a80d67b72',
                                    commitment:
                                        '96831dbc09897d397a2b99addb30c8a94b83c0364dfd4f5253a476baf1e34134',
                                },
                            },
                            {
                                idx: 40,
                                key: {
                                    dest: '271f6ea7b1caceb2e868a66cab69ee85518d9f17e99db91d8e8a0560a28b567e',
                                    commitment:
                                        '1991d992c2e487fd0c7e2a4903a1654efd5b71c4d678bbc3c408b948a2577d50',
                                },
                            },
                            {
                                idx: 66,
                                key: {
                                    dest: 'ee7840fefc335b260ef958c46f04e56a44b7dc3729a70eea74966855b07d8180',
                                    commitment:
                                        '4982f16d0300b9e6648b80bea8f23de8bc97d52b08b0b372194b66821dfdee89',
                                },
                            },
                            {
                                idx: 9,
                                key: {
                                    dest: 'a4c1aa38c9b350b0b55f752cee26189e272c1f63d3106896de2a63301810ce11',
                                    commitment:
                                        '983790812c391f4b8e95af39bd3e89d0e25a73a5603ed9286e0ec15d24a18e5e',
                                },
                            },
                            {
                                idx: 23,
                                key: {
                                    dest: '8f43d9cc3381eabe26235b97a3f5d874e5c554a16f9b32b5de705b24af44d48c',
                                    commitment:
                                        '7b72c7f6bf5808ac7815f19f65bc19ccd56e48f7a22423d4043ee4b0ee66cbcb',
                                },
                            },
                            {
                                idx: 1,
                                key: {
                                    dest: 'f5b6a46a398778808a08f6cf38edcb197472dfae9da888f5d2c208d95c5df4e4',
                                    commitment:
                                        '3a52112852ae797065cc2c3dba107ffbedfbdd5123b106b513e9242392f1bf93',
                                },
                            },
                            {
                                idx: 7,
                                key: {
                                    dest: '9cf778d255494a7684d153d3b6a1e65ff0c44820aa06415fb4ea15cfc54702cb',
                                    commitment:
                                        'fc7da65641efb699fb65bed8fee57fd88ff6de6758d5ca08e29214dc0d95e488',
                                },
                            },
                            {
                                idx: 4,
                                key: {
                                    dest: 'bb20e1f5bb0eaa2d3d41e14abc332045eac8668a90f3bade80aac351fc0ac957',
                                    commitment:
                                        '35816ea043002ee186466e26e311a9a84f8da7eb83f3c10c0079f1b5a740f332',
                                },
                            },
                            {
                                idx: 1,
                                key: {
                                    dest: '2fdb6203032347e04ff62df1ac3cc5b6f46c160f1f1adebb27fe596d181ba60b',
                                    commitment:
                                        '195c6784be1087c3c8690cd3fe005a54fe81a38a05dd56d7af7438a80a0f16b4',
                                },
                            },
                            {
                                idx: 2,
                                key: {
                                    dest: '794b53352ea21d30a96719e5fa1119a4b4709f97640a148b6f9490f2873e9ed2',
                                    commitment:
                                        '6a10bab11a72a361cbe9daa36255623fea76b04fe1e9cbfd41785541ab006bce',
                                },
                            },
                            {
                                idx: 25,
                                key: {
                                    dest: '5e45f9781878d01a11bbec4062615562ef3def4a637b9b054882c68a043e5807',
                                    commitment:
                                        'd2f7142869f9d5cb231d71ef67e0233238b039e2c9519c74cceb397d3f69c44c',
                                },
                            },
                        ],
                        real_output: 12,
                        real_out_tx_key:
                            '20d05f96031bcb263d0a9a751184fe9b3fa2f8814138611ef68dd3f6f0fb1bcf',
                        real_out_additional_tx_keys: [],
                        real_output_in_tx_index: 1,
                        amount: 500000000000,
                        rct: true,
                        mask: '84cde589182c3be46d3cc848da55d0bd8b214ce7ba1a1921a50657d4b20a4b07',
                        subaddr_minor: 1,
                    },
                ],
            },
            result: {
                signatures: [expect.any(String), expect.any(String)],
                tx_prefix_hash: expect.any(String),
                rv: {
                    txn_fee: 1000000000,
                    rv_type: 6,
                },
                pseudo_outs: [expect.any(String), expect.any(String)],
            },
            legacyResults,
        },
        {
            description: 'Transaction to subaddress',
            params: {
                path: "m/44'/128'/0'",
                networkType: 1,
                tsx_data: {
                    unlock_time: 0,
                    num_inputs: 1,
                    mixin: 15,
                    fee: 1000000000,
                    account: 0,
                    minor_indices: [],
                    integrated_indices: [],
                    client_version: 3,
                    hard_fork: 16,
                    outputs: [
                        {
                            amount: 333000000000,
                            addr: {
                                spend_public_key:
                                    '92f62aedb65f51643bb7aec85716e09bd2be903d697864172efc80c08ed6b34a',
                                view_public_key:
                                    'f6ae50e9dc987aae42afe6b8bd9963a175e6e07e5f74f2865650ef8ec7bb113a',
                            },
                            is_subaddress: true,
                            original:
                                'BdkPcpHVHoeHmPXDFhk6F9T4gTxoYFMTH4sukAUCNwLvDYEy3VKSe25W9YcjLK3gRgU1NSS3wJgZoPUErVdU4MTv7cHQeZX',
                            is_integrated: false,
                        },
                        {
                            amount: 666000000000,
                            addr: {
                                spend_public_key:
                                    '9f1b39ee15005b7af11db2cdd8f802de2b7e8667b52e5944aa96355d880d9c51',
                                view_public_key:
                                    '93e6b2de17d6adfc03a97dd5c9007f0daa39fdea7b2b67a7cba37d3a0371ddb9',
                            },
                            is_subaddress: false,
                            original:
                                '9yCMhXSreAeMZh2HzbKPyjeAKvkxomBMACV9gSDWSTm5EeQZeSG6724j9rZMLaFjoC3HZtkPePDE6V4pvHRu9xAQMvrvRRU',
                            is_integrated: false,
                        },
                    ],
                    rsig_data: {
                        rsig_type: 1,
                        bp_version: 4,
                        grouping: [2],
                    },
                },
                inputs: [
                    {
                        outputs: [
                            {
                                idx: 48,
                                key: {
                                    dest: '6e000484053e9ab156884744faae37b73881a5b2bf6a942f32697958162abc7e',
                                    commitment:
                                        'bf7f72099262e38debd8230d5c4318508a9a612dbbcd8649cd51f772488cbca7',
                                },
                            },
                            {
                                idx: 17,
                                key: {
                                    dest: 'fc1cfec5f53ece900cfc71e37d205a9dca8eaf0ee5547d997806c2919f29410a',
                                    commitment:
                                        '21f3a5df6a82eab3e2ba59bacff094861432770960ce716eaad9089fbdc0283b',
                                },
                            },
                            {
                                idx: 70,
                                key: {
                                    dest: 'f0994e452f644d5a9178774da09882958e29b139bb75191a13d64efb75135204',
                                    commitment:
                                        '9d947d8e4069313642655eac6198eb45ccd82b4c432e6815d88007efbba8fa55',
                                },
                            },
                            {
                                idx: 41,
                                key: {
                                    dest: '2057d0d89fc1598e60444037277a3d6c142b67447623232d9288852b9d10d303',
                                    commitment:
                                        '3f2559b66987f8a04c98194dbea5dd8089badfadb1241c59d88d489c8cb41913',
                                },
                            },
                            {
                                idx: 22,
                                key: {
                                    dest: 'd6c4de29348a031c48c5baee3e51b3bff6399df4eed19924da2e19a9f7d83df2',
                                    commitment:
                                        'fa4481eee9bd260e7dc64493a2688f5b58b7b85efe2875d1396dd62a15d22a52',
                                },
                            },
                            {
                                idx: 33,
                                key: {
                                    dest: 'df602b9daa5e466e707bea80a8e7783acf62aeb6b66f316fcc030b265c8dcf21',
                                    commitment:
                                        '80b9b0eae6caa64bc01a10c7f709c1329c2188dea1096ffbdf4405642daff517',
                                },
                            },
                            {
                                idx: 13,
                                key: {
                                    dest: 'f10cd3bd69ff32eb20ab1793f50136e122b84bdeb7198e732490ba66c8f45b95',
                                    commitment:
                                        'd5b060b9a1cc55bd398bb7d57fba109870a00998297c77abc8a130380151b7f2',
                                },
                            },
                            {
                                idx: 9,
                                key: {
                                    dest: '4d907295afce89dfc61fd274859aec94d8d530ce4f4dbe6abccd7d1cf8bfcc80',
                                    commitment:
                                        '71d152d32155af3d3e27ccd50df073cc7807d38996746387d90617a2f4bb2bbc',
                                },
                            },
                            {
                                idx: 27,
                                key: {
                                    dest: '0190906357ea783ec8667c8efb854eb65b5b106f9b65130a6a14c5121d134928',
                                    commitment:
                                        '3087382280286785ba3ff25f41f54338dddbd9fcfbb1ed0e41f1cb0b07427e00',
                                },
                            },
                            {
                                idx: 10,
                                key: {
                                    dest: '9cf778d255494a7684d153d3b6a1e65ff0c44820aa06415fb4ea15cfc54702cb',
                                    commitment:
                                        'fc7da65641efb699fb65bed8fee57fd88ff6de6758d5ca08e29214dc0d95e488',
                                },
                            },
                            {
                                idx: 2,
                                key: {
                                    dest: '7dec0733b4075ec403f0671f1e15e4f3d5c1be34b371bacf9db69355d0bf2ded',
                                    commitment:
                                        '21cfa63612157860daf99d938e7614301f9212354a23bb7bc7fc1908c86543ea',
                                },
                            },
                            {
                                idx: 1,
                                key: {
                                    dest: '9664cba043a349b711351e4afa493fcd55b87063426d26c5bd8b6d565cc2aa32',
                                    commitment:
                                        'edf55c1c0d36580a0822de7ea6a2bf92896a40cadd972c8cfbb4846ee227697f',
                                },
                            },
                            {
                                idx: 8,
                                key: {
                                    dest: 'c51af5afaa79637e8064336bda3c7d192a8ca66e3220e74cb3bb0342230f6bb9',
                                    commitment:
                                        'f4a913a5dabe090ff4b6a53b4176e7b5b495e1489983e7f129c9951359038f43',
                                },
                            },
                            {
                                idx: 15,
                                key: {
                                    dest: '16360ab94268a516563248367a022bf7656b41998a30cbc2478892f777439bab',
                                    commitment:
                                        'bdb782a8848c8c6412a00bc9412cc5c7d92860a45a5475a6e76603bf8a14a1c7',
                                },
                            },
                            {
                                idx: 5,
                                key: {
                                    dest: '2d80c4cd23d8795711ea0cde1cb73c30729d54dd9632e3e6587c0cdc6c7b2b05',
                                    commitment:
                                        '5524bef354b83442d781fd2ed297543d2939a2c73a51792790638b06f77ca5b0',
                                },
                            },
                            {
                                idx: 7,
                                key: {
                                    dest: '4f94f0514709157b0f0e7a6bf9d2293715969065286e71ee76f54ab5b9dd8812',
                                    commitment:
                                        '780ca269aeaf54c050632f526935ea6c142ac890f05fefc0cc43f1d7228de95e',
                                },
                            },
                        ],
                        real_output: 10,
                        real_out_tx_key:
                            'e3c8b1f31e695a57ed073bf7cb09d85c82870766887673974ea154dfbb55e565',
                        real_out_additional_tx_keys: [],
                        real_output_in_tx_index: 1,
                        amount: 1000000000000,
                        rct: true,
                        mask: '5c9f93dc811ad3d252d24f95d21f794a120fe2f8ca9fa6ea488441e726b76b03',
                        subaddr_minor: 0,
                    },
                ],
            },
            result: {
                signatures: [expect.any(String)],
                tx_prefix_hash: expect.any(String),
                rv: {
                    txn_fee: 1000000000,
                    rv_type: 6,
                },
                pseudo_outs: [expect.any(String)],
            },
            legacyResults,
        },
        {
            description: 'Invalid path - not hardened',
            params: {
                path: "m/44'/128'/0",
                networkType: 1,
                tsx_data: {
                    unlock_time: 0,
                    num_inputs: 1,
                    mixin: 15,
                    fee: 1000000000,
                    account: 0,
                    minor_indices: [],
                    integrated_indices: [],
                    client_version: 3,
                    hard_fork: 16,
                    outputs: [
                        {
                            amount: 100000000,
                            addr: {
                                spend_public_key:
                                    'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
                                view_public_key:
                                    '1122334455667788990011223344556677889900112233445566778899001122',
                            },
                            is_subaddress: false,
                            original: '',
                            is_integrated: false,
                        },
                        {
                            amount: 50000000,
                            addr: {
                                spend_public_key:
                                    'ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100',
                                view_public_key:
                                    '9988776655443322110099887766554433221100998877665544332211009988',
                            },
                            is_subaddress: false,
                            original: '',
                            is_integrated: false,
                        },
                    ],
                    rsig_data: {
                        rsig_type: 1,
                        bp_version: 4,
                        grouping: [2],
                    },
                },
                inputs: [
                    {
                        outputs: [
                            {
                                idx: 0,
                                key: {
                                    dest: 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
                                    commitment:
                                        '1122334455667788990011223344556677889900112233445566778899001122',
                                },
                            },
                        ],
                        real_output: 0,
                        real_out_tx_key:
                            'ccddee00112233445566778899aabbccddeeff00112233445566778899aabbcc',
                        real_out_additional_tx_keys: [],
                        real_output_in_tx_index: 0,
                        amount: 160000000,
                        rct: true,
                        mask: 'ddee00112233445566778899aabbccddeeff00112233445566778899aabbccdd',
                        subaddr_minor: 0,
                    },
                ],
            },
            result: false,
            legacyResults,
        },
        {
            description: 'Invalid - no inputs',
            params: {
                path: "m/44'/128'/0'",
                networkType: 1,
                tsx_data: {
                    unlock_time: 0,
                    num_inputs: 0,
                    mixin: 15,
                    fee: 1000000000,
                    account: 0,
                    minor_indices: [],
                    integrated_indices: [],
                    client_version: 3,
                    hard_fork: 16,
                    outputs: [
                        {
                            amount: 100000000,
                            addr: {
                                spend_public_key:
                                    'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
                                view_public_key:
                                    '1122334455667788990011223344556677889900112233445566778899001122',
                            },
                            is_subaddress: false,
                            original: '',
                            is_integrated: false,
                        },
                    ],
                    rsig_data: {
                        rsig_type: 1,
                        bp_version: 4,
                        grouping: [1],
                    },
                },
                inputs: [],
            },
            result: false,
            legacyResults,
        },
        {
            description: 'Invalid - not enough outputs',
            params: {
                path: "m/44'/128'/0'",
                networkType: 1,
                tsx_data: {
                    unlock_time: 0,
                    num_inputs: 1,
                    mixin: 15,
                    fee: 1000000000,
                    account: 0,
                    minor_indices: [],
                    integrated_indices: [],
                    client_version: 3,
                    hard_fork: 16,
                    outputs: [
                        {
                            amount: 100000000,
                            addr: {
                                spend_public_key:
                                    'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
                                view_public_key:
                                    '1122334455667788990011223344556677889900112233445566778899001122',
                            },
                            is_subaddress: false,
                            original: '',
                            is_integrated: false,
                        },
                    ],
                    rsig_data: {
                        rsig_type: 1,
                        bp_version: 4,
                        grouping: [],
                    },
                },
                inputs: [
                    {
                        outputs: [
                            {
                                idx: 0,
                                key: {
                                    dest: 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
                                    commitment:
                                        '1122334455667788990011223344556677889900112233445566778899001122',
                                },
                            },
                        ],
                        real_output: 0,
                        real_out_tx_key:
                            'ccddee00112233445566778899aabbccddeeff00112233445566778899aabbcc',
                        real_out_additional_tx_keys: [],
                        real_output_in_tx_index: 0,
                        amount: 110000000,
                        rct: true,
                        mask: 'ddee00112233445566778899aabbccddeeff00112233445566778899aabbccdd',
                        subaddr_minor: 0,
                    },
                ],
            },
            result: false,
            legacyResults,
        },
        {
            description: 'Invalid - input count mismatch',
            params: {
                path: "m/44'/128'/0'",
                networkType: 1,
                tsx_data: {
                    unlock_time: 0,
                    num_inputs: 2,
                    mixin: 15,
                    fee: 1000000000,
                    account: 0,
                    minor_indices: [],
                    integrated_indices: [],
                    client_version: 3,
                    hard_fork: 16,
                    outputs: [
                        {
                            amount: 100000000,
                            addr: {
                                spend_public_key:
                                    'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
                                view_public_key:
                                    '1122334455667788990011223344556677889900112233445566778899001122',
                            },
                            is_subaddress: false,
                            original: '',
                            is_integrated: false,
                        },
                        {
                            amount: 50000000,
                            addr: {
                                spend_public_key:
                                    'ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100',
                                view_public_key:
                                    '9988776655443322110099887766554433221100998877665544332211009988',
                            },
                            is_subaddress: false,
                            original: '',
                            is_integrated: false,
                        },
                    ],
                    rsig_data: {
                        rsig_type: 1,
                        bp_version: 4,
                        grouping: [2],
                    },
                },
                inputs: [
                    {
                        outputs: [
                            {
                                idx: 0,
                                key: {
                                    dest: 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
                                    commitment:
                                        '1122334455667788990011223344556677889900112233445566778899001122',
                                },
                            },
                        ],
                        real_output: 0,
                        real_out_tx_key:
                            'ccddee00112233445566778899aabbccddeeff00112233445566778899aabbcc',
                        real_out_additional_tx_keys: [],
                        real_output_in_tx_index: 0,
                        amount: 160000000,
                        rct: true,
                        mask: 'ddee00112233445566778899aabbccddeeff00112233445566778899aabbccdd',
                        subaddr_minor: 0,
                    },
                ],
            },
            result: false,
            legacyResults,
        },
    ],
};

export default moneroSignTransaction;
