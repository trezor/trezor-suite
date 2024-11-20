// fixures: https://github.com/trezor/trezor-firmware/blob/main/tests/device_tests/bitcoin/test_signtx_taproot.py

const { TX_CACHE } = global.TestUtils;

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        // https://tbtc1.trezor.io/api/tx/6dfac2f0d66e1972fea2bca80b6d6db80f6f48deacfdef42f15ff9625acdca59
        {
            description: 'Testnet (P2TR): send Taproot',
            skip: ['<1.10.4', '<2.4.3'],
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: "m/86'/1'/0'/1/0",
                        amount: 4600,
                        prev_hash:
                            'ec519494bea3746bd5fbdd7a15dac5049a873fa674c67e596d46505b9b835425',
                        prev_index: 0,
                        script_type: 'SPENDTAPROOT',
                    },
                ],
                outputs: [
                    {
                        address: 'tb1paxhjl357yzctuf3fe58fcdx6nul026hhh6kyldpfsf3tckj9a3wslqd7zd',
                        amount: 4450,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                // refTxs: TX_CACHE([]), // Taproot inputs doesnt require streaming previous transactions
            },
            result: {
                serializedTx:
                    '020000000001012554839b5b50466d597ec674a63f879a04c5da157addfbd56b74a3be949451ec0000000000ffffffff016211000000000000225120e9af2fc69e20b0be2629cd0e9c34da9f3ef56af7beac4fb4298262bc5a45ec5d0140961aee67c3ebbdd6b477f0a2aaa1f809706eda727fd8d5c4097e50f005fc861edba298ca58f723f663dbc2323b7200617918f59358191ba7f6989abcf431716b00000000',
            },
        },
        // https://tbtc1.trezor.io/api/tx/1054eb649110534518239bca2abebebee76d50addac27d0d582cef2b9b9d80c0
        {
            description: 'Testnet (P2TR): 2 inputs, 1 output, 1 change',
            skip: ['<1.10.4', '<2.4.3'],
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: "m/86'/1'/0'/0/0",
                        amount: 6800,
                        prev_hash:
                            'c96621a96668f7dd505c4deb9ee2b2038503a5daa4888242560e9b640cca8819',
                        prev_index: 0,
                        script_type: 'SPENDTAPROOT',
                    },
                    {
                        address_n: "m/86'/1'/0'/0/1",
                        amount: 13000,
                        prev_hash:
                            'c96621a96668f7dd505c4deb9ee2b2038503a5daa4888242560e9b640cca8819',
                        prev_index: 1,
                        script_type: 'SPENDTAPROOT',
                    },
                ],
                outputs: [
                    {
                        address: 'tb1q7r9yvcdgcl6wmtta58yxf29a8kc96jkyxl7y88',
                        amount: 15000,
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: "m/86'/1'/0'/1/0",
                        amount: 6800 + 13000 - 200 - 15000,
                        script_type: 'PAYTOTAPROOT',
                    },
                ],
                // refTxs: TX_CACHE([]), // Taproot inputs doesnt require streaming previous transactions
            },
            result: {
                serializedTx:
                    '020000000001021988ca0c649b0e56428288a4daa5038503b2e29eeb4d5c50ddf76866a92166c90000000000ffffffff1988ca0c649b0e56428288a4daa5038503b2e29eeb4d5c50ddf76866a92166c90100000000ffffffff02983a000000000000160014f0ca4661a8c7f4edad7da1c864a8bd3db05d4ac4f8110000000000002251209a9af24b396f593b34e23fefba6b417a55c5ee3f430c3837379fcb5246ab36d70140057066ce00e91ecd6839f4a01e29e007d68b3a4959f2c9ebbf099c58f13f1e74f7fa2d6c7f81e3b5f6d317293923608793b9f999cc726354833874b0c0f625b70140c5eb8df699334a7ac1b6b27d402c87eeec6b4138ffe10d8592624cde7914723073a3b6d21f09fb7432a279dda1cf415890cffb75c7923ddd818343ff0dd7532c00000000',
            },
        },
        {
            description: 'Testnet: send mixed inputs to mixed outputs',
            skip: ['<1.10.4', '<2.4.3'],
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: "m/49'/1'/1'/0/0",
                        amount: 20000,
                        prev_hash:
                            '8c3ea7a10ab6d289119b722ec8c27b70c17c722334ced31a0370d782e4b6775d',
                        prev_index: 0,
                        script_type: 'SPENDP2SHWITNESS',
                    },
                    {
                        address_n: "m/84'/1'/1'/0/0",
                        amount: 15000,
                        prev_hash:
                            '7956f1de3e7362b04115b64a31f0b6822c50dd6c08d78398f392a0ac3f0e357b',
                        prev_index: 0,
                        script_type: 'SPENDWITNESS',
                    },
                    {
                        address_n: "m/86'/1'/1'/0/0",
                        amount: 4450,
                        prev_hash:
                            '901593bed347678d9762fdee728c35dc4ec3cfdc3728a4d72dcaab3751122e85',
                        prev_index: 0,
                        script_type: 'SPENDTAPROOT',
                    },
                    {
                        address_n: "m/44'/1'/1'/0/0",
                        amount: 10000,
                        prev_hash:
                            '3ac32e90831d79385eee49d6030a2123cd9d009fe8ffc3d470af9a6a777a119b',
                        prev_index: 2,
                        script_type: 'SPENDADDRESS',
                    },
                ],
                outputs: [
                    {
                        address: 'tb1q6xnnna3g7lk22h5tn8nlx2ezmndlvuk556w4w3',
                        amount: 25000,
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 'mfnMbVFC1rH4p9GNbjkMfrAjyKRLycFAzA',
                        amount: 7000,
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: '2MvAG8m2xSf83FgeR4ZpUtaubpLNjAMMoka',
                        amount: 6900,
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        op_return_data: Buffer.from('test of op_return data').toString('hex'),
                        amount: 0,
                        script_type: 'PAYTOOPRETURN',
                    },
                    {
                        address: 'tb1ptgp9w0mm89ms43flw0gkrhyx75gyc6qjhtpf0jmt5sv0dufpnsrsyv9nsz',
                        amount: 10000,
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['8c3ea7', '7956f1', '901593', '3ac32e']), // referenced transactions are required because of mixed inputs
            },
            result: {
                serializedTx:
                    '020000000001045d77b6e482d770031ad3ce3423727cc1707bc2c82e729b1189d2b60aa1a73e8c0000000017160014a33c6e24c99e108b97bc411e7e9ef31e9d5d6164ffffffff7b350e3faca092f39883d7086cdd502c82b6f0314ab61541b062733edef156790000000000ffffffff852e125137abca2dd7a42837dccfc34edc358c72eefd62978d6747d3be9315900000000000ffffffff9b117a776a9aaf70d4c3ffe89f009dcd23210a03d649ee5e38791d83902ec33a020000006a473044022058aaae6309d4a9126611aa0d84674f4d175597a2478608c2e54a53c04237f7d90220627deec01eda3972267b929978bc634dad2f8e9e88a36423aa4eafb03937e676012103bae960983f83e28fcb8f0e5f3dc1f1297b9f9636612fd0835b768e1b7275fb9dffffffff05a861000000000000160014d1a739f628f7eca55e8b99e7f32b22dcdbf672d4581b0000000000001976a91402e9b094fd98e2a26e805894eb78f7ff3fef199b88acf41a00000000000017a9141ff816cbeb74817050de585ceb2c772ebf71147a870000000000000000186a1674657374206f66206f705f72657475726e206461746110270000000000002251205a02573f7b39770ac53f73d161dc86f5104c6812bac297cb6ba418f6f1219c0702483045022100edeb4f6cd9d7b56ad23fd85d20dea19171131d0efec45496b2540a773757941f02204d308cda0e97e8f1909a082febe2e2ec535c7a35acdea6ef248e0268d18ef7610121021630971f20fa349ba940a6ba3706884c41579cd760c89901374358db5dd545b902483045022100dca7d8e242d770e154f8c081c580bd427da14deea30713b8f8d6062c0c8268ba0220748fdbadec4d6b5a8143b7deaaa4a67278de07cc8eedd9dacfb2717177e5b3ac012103f6b2377d52960a6094ec158cf19dcf9e33b3da4798c2302aa5806483ed4187ae01402f568a7e393d037b3e1b1fb53e97647c4ad9a5c868a2b91f7bfab672e6e526621c98d75a45caff9add5b1d1f90eaf553a2809bec2a29a655600f85a8485613710000000000',
            },
        },
    ],
};
