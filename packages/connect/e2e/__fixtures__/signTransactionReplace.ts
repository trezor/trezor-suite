const { ADDRESS_N, TX_CACHE } = global.TestUtils;

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Bitcoin (RBF): P2PKH bump fee',
            params: {
                coin: 'Bitcoin',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/0'/0'/0/4"),
                        amount: '174998',
                        prev_index: 0,
                        prev_hash:
                            'beafc7cbd873d06dbee88a7002768ad5864228639db514c81cfb29f108bb1e7a',
                        orig_index: 0,
                        orig_hash:
                            '50f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d',
                    },
                ],
                outputs: [
                    {
                        address_n: ADDRESS_N("m/44'/0'/0'/1/2"),
                        script_type: 'PAYTOADDRESS',
                        amount: '109998', // 174998 - 50000 - 15000
                        orig_hash:
                            '50f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d',
                        orig_index: 0,
                    },
                    {
                        address: '1GA9u9TfCG7SWmKCveBumdA1TZpfom6ZdJ',
                        amount: '50000',
                        script_type: 'PAYTOADDRESS',
                        orig_hash:
                            '50f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d',
                        orig_index: 1,
                    },
                ],
                refTxs: TX_CACHE(['beafc7', '50f6f1']),
            },
            result: {
                serializedTx:
                    '01000000017a1ebb08f129fb1cc814b59d63284286d58a7602708ae8be6dd073d8cbc7afbe000000006b483045022100a8c1c118d61259f8df463deb538a10d9e9f42bbdfff28bb1337ee5426e5098f8022060e7464f7a63a83fd93dbd268f319133cb03452764afd601db063ff3eede9207012103f54094da6a0b2e0799286268bb59ca7c83538e81c78e64f6333f40f9e0e222c0ffffffff02aead0100000000001976a914902c642ba3a22f5c6cfa30a1790c133ddf15cc8888ac50c30000000000001976a914a6450f1945831a81912616691e721b787383f4ed88ac00000000',
            },
        },
        {
            description: 'Testnet (RBF): P2PKH in P2SH, remove change',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/49'/1'/0'/0/4"),
                        amount: '100000',
                        script_type: 'SPENDP2SHWITNESS',
                        prev_hash:
                            '5e7667690076ae4737e2f872005de6f6b57592f32108ed9b301eeece6de24ad6',
                        prev_index: 1,
                        orig_hash:
                            '334cd7ad982b3b15d07dd1c84e939e95efb0803071648048a7f289492e7b4c8a',
                        orig_index: 0,
                    },
                    {
                        address_n: ADDRESS_N("m/49'/1'/0'/0/3"),
                        amount: '998060',
                        script_type: 'SPENDP2SHWITNESS',
                        prev_hash:
                            'efaa41ff3e67edf508846c1a1ed56894cfd32725c590300108f40c9edc1aac35',
                        prev_index: 0,
                        orig_hash:
                            '334cd7ad982b3b15d07dd1c84e939e95efb0803071648048a7f289492e7b4c8a',
                        orig_index: 1,
                    },
                ],
                outputs: [
                    {
                        address: '2MvUUSiQZDSqyeSdofKX9KrSCio1nANPDTe',
                        amount: '1000000',
                        script_type: 'PAYTOADDRESS',
                        orig_hash:
                            '334cd7ad982b3b15d07dd1c84e939e95efb0803071648048a7f289492e7b4c8a',
                        orig_index: 0,
                    },
                ],
                refTxs: TX_CACHE(['5e7667', 'efaa41', '334cd7']),
            },
            result: {
                serializedTx:
                    '01000000000102d64ae26dceee1e309bed0821f39275b5f6e65d0072f8e23747ae76006967765e0100000017160014039ba06270e6c6c1ad4e6940515aa5cdbad33f9effffffff35ac1adc9e0cf408013090c52527d3cf9468d51e1a6c8408f5ed673eff41aaef0000000017160014209297fb46272a0b7e05139440dbd39daea3e25affffffff0140420f000000000017a9142369da13fee80c9d7fd8043bf1275c04deb360e68702483045022100c28eceaade3d0bc82e4b634d2c6d06feed4afe37c77b04b379eaf8c058b7190702202b7a369dd6104c13c60821c1ad4e7c2d8d37cf1962a9b3f5d70717709c021d63012103bb0e339d7495b1f355c49d385b79343e52e68d99de2fe1f7f476c465c9ccd16702483045022100f6a447b7f95fb067c87453c408aa648262adaf2472a7ccc754518cd06353b87502202e00359dd663eda24d381e070b92a5e41f1d047d276f685ff549a03659842b1b012103c2c2e65556ca4b7371549324b99390725493c8a6792e093a0bdcbb3e2d7df4ab00000000',
            },
        },
        {
            description: 'Testnet (RBF): Bech32/P2WPKH finalize',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/0/2"),
                        amount: '20000000',
                        script_type: 'SPENDWITNESS',
                        prev_hash:
                            '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06',
                        prev_index: 1,
                        orig_hash:
                            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                        orig_index: 0,
                        sequence: 4294967294,
                    },
                ],
                outputs: [
                    {
                        // NOTE: address_n should be correctly used instead of address (issue #10474)
                        address: 'tb1qkvwu9g3k2pdxewfqr7syz89r3gj557l3uuf9r9',
                        amount: '100000',
                        script_type: 'PAYTOWITNESS',
                        orig_hash:
                            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                        orig_index: 0,
                    },
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/1/1"),
                        amount: '19899800', // 20000000 - 100000 - 200
                        script_type: 'PAYTOWITNESS',
                        orig_hash:
                            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                        orig_index: 1,
                    },
                ],
                locktime: 1348713,
                refTxs: TX_CACHE(['43d273', '70f987']),
            },
            result: {
                serializedTx:
                    '0100000000010106fcd13aab9f1eb618d0351196ecf20ff8fb60f9743484ad5917f4cad373d2430100000000feffffff02a086010000000000160014b31dc2a236505a6cb9201fa0411ca38a254a7bf198a52f0100000000160014167dae080bca35c9ea49c0c8335dcc4b252a1d700247304402201ee1828ab0ca7f8113989399edda8394c65e5c3c9fe597a78890c5d2c9bd2aeb022010e76ad6abe171e5cded6b374a344ee18a51d38477b76a4b6fb30289ed24beff01210357cb3a5918d15d224f14a89f0eb54478272108f6cbb9c473c1565e55260f6e9369941400',
            },
        },
        {
            skip: ['1'], // disable this for T1B1. Failure_DataError: messages.c:224:missing required field
            description: 'Testnet (RBF): Meld transactions',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/49'/1'/0'/0/4"),
                        amount: '100000',
                        script_type: 'SPENDP2SHWITNESS',
                        prev_hash:
                            '5e7667690076ae4737e2f872005de6f6b57592f32108ed9b301eeece6de24ad6',
                        prev_index: 1,
                        orig_hash:
                            '334cd7ad982b3b15d07dd1c84e939e95efb0803071648048a7f289492e7b4c8a',
                        orig_index: 0,
                    },
                    {
                        address_n: ADDRESS_N("m/49'/1'/0'/0/8"),
                        amount: '4973340',
                        script_type: 'SPENDP2SHWITNESS',
                        prev_hash:
                            '6673b7248e324882b2f9d02fdd1ff1d0f9ed216a234e836b8d3ac65661cbb457',
                        prev_index: 0,
                        orig_hash:
                            'ed89acb52cfa438e3653007478e7c7feae89fdde12867943eec91293139730d1',
                        orig_index: 0,
                    },
                    {
                        address_n: ADDRESS_N("m/49'/1'/0'/0/3"),
                        amount: '998060',
                        script_type: 'SPENDP2SHWITNESS',
                        prev_hash:
                            'efaa41ff3e67edf508846c1a1ed56894cfd32725c590300108f40c9edc1aac35',
                        prev_index: 0,
                        orig_hash:
                            '334cd7ad982b3b15d07dd1c84e939e95efb0803071648048a7f289492e7b4c8a',
                        orig_index: 1,
                    },
                    {
                        address_n: ADDRESS_N("m/49'/1'/0'/0/9"),
                        amount: '839318869',
                        script_type: 'SPENDP2SHWITNESS',
                        prev_hash:
                            '927784e07bbcefc4c738f5c31c7a739978fc86f35514edf7e7da25d53d83030b',
                        prev_index: 0,
                        orig_hash:
                            'ed89acb52cfa438e3653007478e7c7feae89fdde12867943eec91293139730d1',
                        orig_index: 1,
                    },
                ],
                outputs: [
                    // NOTE: script_type should not be undefined (issue #10474)
                    {
                        address: 'moE1dVYvebvtaMuNdXQKvu4UxUftLmS1Gt',
                        amount: '100000000',
                        orig_hash:
                            'ed89acb52cfa438e3653007478e7c7feae89fdde12867943eec91293139730d1',
                        orig_index: 1,
                    },
                    {
                        address: '2MvUUSiQZDSqyeSdofKX9KrSCio1nANPDTe',
                        amount: '1000000',
                        orig_hash:
                            '334cd7ad982b3b15d07dd1c84e939e95efb0803071648048a7f289492e7b4c8a',
                        orig_index: 0,
                    },
                    {
                        address_n: ADDRESS_N("m/49'/1'/0'/1/0"),
                        // 100000 + 4973340 + 998060 + 839318869 - 100000000 - 1000000 - 94500
                        amount: '744295769',
                        script_type: 'PAYTOP2SHWITNESS',
                    },
                ],
                refTxs: TX_CACHE(['5e7667', 'efaa41', '334cd7', '6673b7', 'ed89ac', '927784']),
            },
            result: {
                serializedTx:
                    '01000000000104d64ae26dceee1e309bed0821f39275b5f6e65d0072f8e23747ae76006967765e0100000017160014039ba06270e6c6c1ad4e6940515aa5cdbad33f9effffffff57b4cb6156c63a8d6b834e236a21edf9d0f11fdd2fd0f9b28248328e24b773660000000017160014adbbadefe594e9e4bfccb9c699ae5d4f18716772ffffffff35ac1adc9e0cf408013090c52527d3cf9468d51e1a6c8408f5ed673eff41aaef0000000017160014209297fb46272a0b7e05139440dbd39daea3e25affffffff0b03833dd525dae7f7ed1455f386fc7899737a1cc3f538c7c4efbc7be08477920000000017160014681ea49259abb892460bf3373e8a0b43d877fa18ffffffff0300e1f505000000001976a914548cb80e45b1d36312fe0cb075e5e337e3c54cef88ac40420f000000000017a9142369da13fee80c9d7fd8043bf1275c04deb360e687590d5d2c0000000017a91458b53ea7f832e8f096e896b8713a8c6df0e892ca870247304402205b4b304cb5a23cd3b73aa586c983cbadefc3fcbcb8fb33684037b17a818726c002202a3f529183eebf2f06d041b18d379579c22d908be31060752179f01d125ff020012103bb0e339d7495b1f355c49d385b79343e52e68d99de2fe1f7f476c465c9ccd167024730440220666ebf2c146d4a369971ec1d5b69fce2f3b8e2c0ba689e6077ebed513f91dd760220200e203355156e23abf5b536ac174df4109985feddf86ab065c12f0da8339d6a012102a52d8cf5a89c284bacff90a3d7c30a0166e0074ca3fc385f3efce638c50493b30247304402207d6331026626fc133813ea672147c95feac29a3d7deefb49ef1d0194e061d53802207e4c3a3b8f3c2e11845684d74a5f1d8395da0a8e65e18c7f72155aac82be648e012103c2c2e65556ca4b7371549324b99390725493c8a6792e093a0bdcbb3e2d7df4ab02473044022047f95a95ea8cac78f057e15e37ac5cebd6abcf50d87e5509d30c730cb0f7e89f02201d861acb267c0bc100cac99cad42b067a39614602eef5f9f791c1875f24dd0de0121028cbc37e1816a23086fa738c8415def477e813e20f484dbbd6f5a33a37c32225100000000',
            },
        },
        {
            description: 'Testnet (RBF): with OP_RETURN output',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/84'/1'/1'/0/14"),
                        amount: '1000000',
                        script_type: 'SPENDWITNESS',
                        prev_hash:
                            '4083973799f05c52f556b603ab0f93d9c4c50be50da03c770a492d0990ca7809',
                        prev_index: 1,
                        orig_hash:
                            'ba917a2b563966e324ab37ed7de5f5cd7503b970b0f0bb9a5208f5835557e99c',
                        orig_index: 0,
                        sequence: 4294967293,
                    },
                ],
                outputs: [
                    {
                        amount: '0',
                        script_type: 'PAYTOOPRETURN',
                        op_return_data: '64656164',
                        orig_hash:
                            'ba917a2b563966e324ab37ed7de5f5cd7503b970b0f0bb9a5208f5835557e99c',
                        orig_index: 0,
                    },
                    {
                        address_n: ADDRESS_N("m/84'/1'/1'/1/10"),
                        // 1000000 - 150 - 150
                        amount: '999700',
                        script_type: 'PAYTOWITNESS',
                        orig_hash:
                            'ba917a2b563966e324ab37ed7de5f5cd7503b970b0f0bb9a5208f5835557e99c',
                        orig_index: 1,
                    },
                ],
                refTxs: TX_CACHE(['408397', 'ba917a']),
            },
            result: {
                serializedTx:
                    '010000000001010978ca90092d490a773ca00de50bc5c4d9930fab03b656f5525cf099379783400100000000fdffffff020000000000000000066a046465616414410f00000000001600141c02e2397a8a02ff71d3f26937d14a656469dd1f02483045022100f534412752c14064470d4a1f738fa01bc83598b07caaba4cd207b43b1b9702a4022071a4f0873006c07ccfeb1f82e86f3047eab208f38cfa41d7b566d6ca50dbca0f012102a269d4b8faf008074b974b6d64fa1776e17fdf65381a76d1338e9bba88983a8700000000',
            },
        },
        {
            description: 'Testnet (RBF): add new utxo and change output',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/0/65"),
                        amount: '10000',
                        script_type: 'SPENDWITNESS',
                        prev_hash:
                            '2d5dfc5068b81e25185a655d2dcd10833b2f4e6a3d029c0d40b2fd3b63f09b48',
                        prev_index: 0,
                        orig_hash:
                            '5bf10db6244c703d7f831043e6b6b0d6f3974bb5cf9fd216397e7620dc2e1015',
                        orig_index: 0,
                        sequence: 4294967293,
                    },
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/0/66"),
                        amount: '100000',
                        script_type: 'SPENDWITNESS',
                        prev_hash:
                            '56ebd82cdc91548617a1756f8e271dedda94e7c4d267d3c6d4f65d2654e5f3e2',
                        prev_index: 1,
                        sequence: 4294967293,
                    },
                ],
                outputs: [
                    {
                        address: 'tb1qj79vy45wcvfctwejz05qgyltql3qgyz6fwhn5m',
                        amount: '9890',
                        script_type: 'PAYTOADDRESS',
                        orig_hash:
                            '5bf10db6244c703d7f831043e6b6b0d6f3974bb5cf9fd216397e7620dc2e1015',
                        orig_index: 0,
                    },
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/1/0"),
                        // (10000 + 100000) - 9890 - 400 (new fee)
                        amount: '99710',
                        script_type: 'PAYTOWITNESS',
                    },
                ],
                locktime: 1904477,
                refTxs: TX_CACHE(['2d5dfc', '5bf10d', '56ebd8']),
            },
            result: {
                serializedTx:
                    '01000000000102489bf0633bfdb2400d9c023d6a4e2f3b8310cd2d5d655a18251eb86850fc5d2d0000000000fdffffffe2f3e554265df6d4c6d367d2c4e794daed1d278e6f75a117865491dc2cd8eb560100000000fdffffff02a226000000000000160014978ac2568ec31385bb3213e80413eb07e204105a7e85010000000000160014cc8067093f6f843d6d3e22004a4290cd0c0f336b024830450221008f7332cfb426a2cb30c0c038f6c1154f14d89f8e4987a62d19e51bd25fc37cc102206137b052492beb93cea11ce94d34fd593a58543f0b9c0bc723f6e0db36b64642012102377521551fc6c84312a60519bc50b3a761836d184e02b5908289362ff3fd193a0247304402201be3759adbadfa920f765cf50c847edee6b9e067c8281e73a7fd26c71a14b1e402202ba787e543acc23b0e971818b49227718ef388acb767d217042f4a0aed943d7a012103c40376f2a410b616d75bab29849e3d8744a8c3739d52add73b45afa1346c7c2e5d0f1d00',
            },
        },
        {
            description: 'Testnet (RBF): decrease output',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/49'/1'/0'/0/4"),
                        amount: '100000',
                        script_type: 'SPENDP2SHWITNESS',
                        prev_hash:
                            '5e7667690076ae4737e2f872005de6f6b57592f32108ed9b301eeece6de24ad6',
                        prev_index: 1,
                        orig_hash:
                            '334cd7ad982b3b15d07dd1c84e939e95efb0803071648048a7f289492e7b4c8a',
                        orig_index: 0,
                    },
                    {
                        address_n: ADDRESS_N("m/49'/1'/0'/0/3"),
                        amount: '998060',
                        script_type: 'SPENDP2SHWITNESS',
                        prev_hash:
                            'efaa41ff3e67edf508846c1a1ed56894cfd32725c590300108f40c9edc1aac35',
                        prev_index: 0,
                        orig_hash:
                            '334cd7ad982b3b15d07dd1c84e939e95efb0803071648048a7f289492e7b4c8a',
                        orig_index: 1,
                    },
                ],
                outputs: [
                    {
                        address: '2MvUUSiQZDSqyeSdofKX9KrSCio1nANPDTe',
                        amount: '990000',
                        script_type: 'PAYTOADDRESS',
                        orig_hash:
                            '334cd7ad982b3b15d07dd1c84e939e95efb0803071648048a7f289492e7b4c8a',
                        orig_index: 0,
                    },
                ],
                refTxs: TX_CACHE(['5e7667', 'efaa41', '334cd7']),
            },
            result: {
                serializedTx:
                    '01000000000102d64ae26dceee1e309bed0821f39275b5f6e65d0072f8e23747ae76006967765e0100000017160014039ba06270e6c6c1ad4e6940515aa5cdbad33f9effffffff35ac1adc9e0cf408013090c52527d3cf9468d51e1a6c8408f5ed673eff41aaef0000000017160014209297fb46272a0b7e05139440dbd39daea3e25affffffff01301b0f000000000017a9142369da13fee80c9d7fd8043bf1275c04deb360e68702483045022100bd303aa0d923e73300e37971d43b9cd134230f8287e0e3b702aacd19ba8ef97b02202b4368b3e9d7478b8529ea2aeea23f6612ec05854510794958d6ce58c19082ad012103bb0e339d7495b1f355c49d385b79343e52e68d99de2fe1f7f476c465c9ccd1670247304402204869b27aa926d98bfd36912f71e335c1d6afb2c1a28102407066db5257e1b8810220197bcac3c85a721547974bd7309a6ea2b809810a595cbdca2da9599af4038ba2012103c2c2e65556ca4b7371549324b99390725493c8a6792e093a0bdcbb3e2d7df4ab00000000',
            },
        },
        {
            description: 'Testnet (RBF): Taproot',
            skip: ['<1.10.4', '<2.4.3'],
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/86'/1'/0'/1/0"),
                        amount: '4600',
                        script_type: 'SPENDTAPROOT',
                        prev_hash:
                            '7956f1de3e7362b04115b64a31f0b6822c50dd6c08d78398f392a0ac3f0e357b',
                        prev_index: 1,
                        orig_hash:
                            '901593bed347678d9762fdee728c35dc4ec3cfdc3728a4d72dcaab3751122e85',
                        orig_index: 0,
                    },
                ],
                outputs: [
                    {
                        address: 'tb1paxhjl357yzctuf3fe58fcdx6nul026hhh6kyldpfsf3tckj9a3wslqd7zd',
                        amount: '4050',
                        script_type: 'PAYTOADDRESS',
                        orig_hash:
                            '901593bed347678d9762fdee728c35dc4ec3cfdc3728a4d72dcaab3751122e85',
                        orig_index: 0,
                    },
                ],
                refTxs: TX_CACHE(['901593']), // Taproot RBF still requires streaming original txs (unlike previous txs)
            },
            result: {
                serializedTx:
                    '010000000001017b350e3faca092f39883d7086cdd502c82b6f0314ab61541b062733edef156790100000000ffffffff01d20f000000000000225120e9af2fc69e20b0be2629cd0e9c34da9f3ef56af7beac4fb4298262bc5a45ec5d0140f0c345143097123efd78acfdd22d5f0334b775ad46310f01d2f1fe9708993256c6c55bdd6c65ee5e83d054e10a060b9306d92d4df676ec761a08b2ca642ec08000000000',
            },
        },
    ],
};
