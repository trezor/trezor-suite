export default {
    method: 'moneroSignTransaction',
    setup: {
        mnemonic: 'all all all all all all all all all all all all',
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
                signatures: [
                    '26d009308e8ed3f61cdd29b095b205d653021a7e6de2653348edd01961634e6f2e96a603a9e7a125da7ffbea6091cefcce2de5d148a406571f46497d1337302ce99d368aa26013ccc8ab9d5f2202c7c5d58d95eef4f4ad5cbb8392f81c9ee417a81264e7dfeeb6862e58d79564fbc6a3545f859f34a9c8ddb550a5bda0d0aea934ab489c3bcb29f3fd942d89a06b26b232e0e823dea795b2066c345e37a572bc390e2f99c1e8673fb8489740f3d080c1fe2756c0969e19a5178d908df6615455c928d20f0cf333ffd665d7de74ad652d915221a375813378700d453ed9c108a2b61a5aa0cc63b3a2509a9e853c721bc610bcc4109d7e32e6d4a2e7e4d0d1880b0868e247d762662864a6f36ba017b234b6f93604ae0dbbb109deeb60808e2bf5a82f7160823a2d5f3242b481380195c58e6da61970a379c510b48c3ee36712095dc6cb8bbf93cf00ce00c9f5a2cb37e3aaa73f43246aab72b81a086d34f8f7d93450b231fad14db8a66902ecfd5988dd5010a4c6ad9844cd923f1f63d1ff5067d1cd6ae7eb9cb39b8567681b8e28f361a3787263d46f37e7ff4bdb3f39893575dc36ac45a539f82bc790cdc33b4061fd2f5629046a4319844811bff4676157ff49979012bb66e43bd076a7b47ffe9f62e538c60bcba1f360935ee41502ee3265579f95a90422115304c9e13a092eb1dc1211e887c0ad3883514b8f768510440cdd32bd45c6c191dd68b43d549e1bf4bf37f805a9443ef4491bed301017611668effa458bf55b2fb4b61901a474b637d724db2ea27f7401217cfe2f31e1c8af89f2cf5a445118779bb5430116504bb100c7',
                ],
                tx_prefix_hash: 'fb0c75e21fb0b3f21ed94651b1437d118cd2e5931a8fad667e39c84067d4ddee',
                rv: {
                    txn_fee: 1000000000,
                    rv_type: 6,
                },
                pseudo_outs: ['0ba5b91927ce2668b80b15c16a08f4e84f00f605cb1dbb4b763aa925a7db43f8'],
            },
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
                signatures: [
                    'dc1cbba6831ba51c11fc0f950a707685ab98d0569701c81351d61bc76fd1a3ef2782df279ad68788b33ef5c20b391e7d2e144a78f2cdc9dcc32080e9e67e066e0aa81c2c78cf01455a4cfbe5a61b71d1b62f75466313e422c99f8142cc8f1353bf9bbf53c9b2f33bd6273480b7f49781777a8f2f7d641061c17f4b7311bb7bba91bb63ede2303b2669c768e774c93b4a6f468f7eceef6a0f1e06f67870819adf37523913ea881585e577d48bc8430b7060c24dfa1dc835a612c20f5213aeab690e3158e70a0e563004725e9181b106de32bd1116c8119119d7face3edae45a96982056267c4452d6b9c05c07a2b4a005103b77fbd5a99b9bc396fa71fde523bbc06294b353cef27e3079f8c924efeb3aed900ae17213b6d659c153a1dbcb8cb9b00a8875b3a081768e77ca13fbc6edb27d0a25a1b1213ead3ad84e532f4a1e78f0d7b33a27b905ad5229cd57575275d68b2906feb7b7aa9d58c989abf1be3f2815d7531c8fc48432e235eae7e005612da1b2ce8f9184bd363dbcedd9e71d4ddfbc9e8db321c668e77f737ff0909335d03dd824453999bacfa6444bb3467a1c0a9d7991281499f8a9fde46893d51c9e9811cb96a11d9dee87ab9db27a57b5fbe651b254cdf13a518f4a68942142774bf84e5677028f7cd9179db47493f578fc048b2cf420d500f62f924501f00e11819bf62fa30c40fff219df2be9322f2913f74f8b2ebb3fa5a75f5c0ff4b3d8f6239e06002a02fedc6879c0fa930f0f52c19825b1a5c2fe219bf6cf7c8cac6957f4c4f6881ec147d7992480a348c824a9a4aea018dbe54a567390887e7c111a23f013c9',
                    '8da7737f8e96e4d18360a346277c6966e420e055718e2a8f0d0d180c226089939fc50be433481c2cf6afc42021372e31da726dbfa77e7f5c8f3d22ccaf7a4af9de379cd54bf0e3f8086e30ecec7537636b00b974c3475df56997c3d1be73c83eb5d0dd226ecd9bcd53f8c5393ecb9d873898af746f4e2d6fc8ba1de4b21587ab08929683154d857215ddd68d4aaa2d883e38cfdfbf4ada140919a78f2a7bfcbc1840283fe362b7a5d84617d364e539dc077eec2390cfdcce9cef2794047cacc3c7974fedeade139f04edb940667662ff5e7d82875191cc132656c084de9a6222eda489eb5eeb2fbadab42eae76b3a27e904a404119e8b2d10662697f63877c48eab7f6f9624198bc09e54ccba0e9d46b177e251013700273bfcd827b170aedff687023853bfa79366c284e4aaf7a8b6fef5600ff623c225293c1cf449f4e9b79387b0e3af4a6ed0abbf321066e41040fd3a87736f643a8f348c5b74bd03f69561b2f7cf2542546c41a8e8717a3b907a21dd70808bb6cb74d60dd1bef53c62d377c5951553a0678967318dcdb8cb4b716975e0a36a0e357cba0528ba9df9645c7afc9d97395baca7938c2d5fc0547b3b4eb9415818ec0889b149d171ad0a1336916365524748f1eb1857ed32746238bff0266c7a5bfbda8d7943778a0f605a96f571927b21b85b81be26ca6b27833d9b3feda17e21361443dd620ab3da4232d937c1484b9bc1133eef695bc16e16deb7fca2f75efa010b3cef2ade13fce315a48e5f7cc65e4d42d34134da503d472f81a77ea71950029c8294b2584cf24a4e81ba22ca3330c009f591bfe3296f473ef6aee',
                ],
                tx_prefix_hash: 'c2dc022af6be641315b66f4c588404cdad96db2c1aba34fffcc0b7d519bc3177',
                rv: {
                    txn_fee: 1000000000,
                    rv_type: 6,
                },
                pseudo_outs: [
                    '95282d33ab31a1a0577c249f9ad0c9630efc183861e0b8a80d833819678b3b5b',
                    '31b873eb79507d5fb16847eb8019047af609c3be9dd3bc6bd981e209a459795c',
                ],
            },
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
                signatures: [
                    '81f78cacc6081f7ea0d4dbac30fc210fb38e23d449934c98252f416cf81392ebbdea147e5d14a731f7d737673c5cad5e56d035c294826b4d5e575324565d698676dc117aa1d7041ed765d65ab5a912f3a6cefe6432a19d2bd711e2d1f872936535d65f99733f5d655db1a689fdf97666d4e007aaa68bfa24b19772d973135b9b948d315c8de5a0da9efbed905ec6e9cad48c8997405962564d150d1e32373c5a9afe6e9c18021f3f8037cfbe426fd737c45fc9645b8f46c4625ee5f876224b7875b86207c90f3c301af760bb87868bca8f8465f65fc1cdca2bbd95deb25f14fadad14e3fd69549f9c65cb81e02fe957c6203cbbd23bc72b5f4a9a6582a072f4ced628f5021c135cea4cb3b24b77a355025d2ea38d775c57444bc4dbfb9ce1e237f55a3d9e7bb7711fdb6a18dacb671206b5f7e775f57dbe0bd7a22f94828ac5798d3560b8b3209324896d18c328bad688118b456266ccee18c1a99ba1106fe6575f1f6147233dd0f5b7bd0f4864c54a053dc622d3c3e9fd83fd8fb1f236dd49d42b22d2e08dd2dd1da77cffd1362bb838ec23472cd79de4fb99d0a640ac0613db970d7e688527c10511dc34c3b95c2ee282b3c4a83b8df2d652c941d84c7a2feecf455901a8761057e0c9f241584b11caefddcd815854c49cb162d1eee76204ee94fc42e83210e495a5c0a52c11d513097234e4fb3697f9b2afc24af7961cb6e2d1b2f7307c1e26defa41d2fa90de0eaf42de95ebb073fe30b572a5999af419f76fb0153ef89bbe8ce03be9c8e6e0930202ff46aa022942e7bf23c54b032264a4cc38cce0c17e78263487b6cbaf317ca4a',
                ],
                tx_prefix_hash: 'c0337cf139f60889b35826ddeeec9f47df94361fc9226ef5a5e5a3d070f1ed2b',
                rv: {
                    txn_fee: 1000000000,
                    rv_type: 6,
                },
                pseudo_outs: ['5507958663a71e8bd320f67ae6b6812eaed96d3fb0ab3eb3153b4a573dbd196f'],
            },
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
        },
    ],
} satisfies TestCase;
