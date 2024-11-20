const { TX_CACHE } = global.TestUtils;

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
                        address_n: "m/44'/0'/0'/0/4",
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
                        address_n: "m/44'/0'/0'/1/2",
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
                    '02000000017a1ebb08f129fb1cc814b59d63284286d58a7602708ae8be6dd073d8cbc7afbe000000006a47304402207e15d1685b0b3ab35de43ba0979e783a45a668daa9ce0a981ab3ee816b75230902206390bc8f3c9a21b03e8710d6fd01b1fc0c788eb861058389669b977f67b687fd012103f54094da6a0b2e0799286268bb59ca7c83538e81c78e64f6333f40f9e0e222c0ffffffff02aead0100000000001976a914902c642ba3a22f5c6cfa30a1790c133ddf15cc8888ac50c30000000000001976a914a6450f1945831a81912616691e721b787383f4ed88ac00000000',
            },
        },
        {
            description: 'Testnet (RBF): P2PKH in P2SH, remove change',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: "m/49'/1'/0'/0/4",
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
                        address_n: "m/49'/1'/0'/0/3",
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
                    '02000000000102d64ae26dceee1e309bed0821f39275b5f6e65d0072f8e23747ae76006967765e0100000017160014039ba06270e6c6c1ad4e6940515aa5cdbad33f9effffffff35ac1adc9e0cf408013090c52527d3cf9468d51e1a6c8408f5ed673eff41aaef0000000017160014209297fb46272a0b7e05139440dbd39daea3e25affffffff0140420f000000000017a9142369da13fee80c9d7fd8043bf1275c04deb360e687024830450221008fe88db9ad13d16c3d5011f33592979d7ad3cfa56dff54b9a67eb30f3269ab94022065a64b6009a2e1835cb190d0534a5ca2dec9b9e8c8a25c1579982779a9a2092d012103bb0e339d7495b1f355c49d385b79343e52e68d99de2fe1f7f476c465c9ccd167024830450221009a38bbbfea580b36f8bf9ca50883c5db6101025766d4093e3d2f1b27bca9dd140220585e60d547ef1b78ba51a0d6d43e1e8e14b26ac2bcc34fb9445b6a435b084962012103c2c2e65556ca4b7371549324b99390725493c8a6792e093a0bdcbb3e2d7df4ab00000000',
            },
        },
        {
            description: 'Testnet (RBF): Bech32/P2WPKH finalize',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: "m/84'/1'/0'/0/2",
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
                        address_n: "m/84'/1'/0'/1/1",
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
                    '0200000000010106fcd13aab9f1eb618d0351196ecf20ff8fb60f9743484ad5917f4cad373d2430100000000feffffff02a086010000000000160014b31dc2a236505a6cb9201fa0411ca38a254a7bf198a52f0100000000160014167dae080bca35c9ea49c0c8335dcc4b252a1d7002483045022100ee963bb30a075a8e23b2baa8ade4f648144bc5efab939a393b0f5be20bc09b8202201ab33382134da85b67061bcbdbc8e0bc86a85fb8ff02d462b14e6b867952568101210357cb3a5918d15d224f14a89f0eb54478272108f6cbb9c473c1565e55260f6e9369941400',
            },
        },
        {
            skip: ['1'], // disable this for T1B1. Failure_DataError: messages.c:224:missing required field
            description: 'Testnet (RBF): Meld transactions',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: "m/49'/1'/0'/0/4",
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
                        address_n: "m/49'/1'/0'/0/8",
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
                        address_n: "m/49'/1'/0'/0/3",
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
                        address_n: "m/49'/1'/0'/0/9",
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
                        address_n: "m/49'/1'/0'/1/0",
                        // 100000 + 4973340 + 998060 + 839318869 - 100000000 - 1000000 - 94500
                        amount: '744295769',
                        script_type: 'PAYTOP2SHWITNESS',
                    },
                ],
                refTxs: TX_CACHE(['5e7667', 'efaa41', '334cd7', '6673b7', 'ed89ac', '927784']),
            },
            result: {
                serializedTx:
                    '02000000000104d64ae26dceee1e309bed0821f39275b5f6e65d0072f8e23747ae76006967765e0100000017160014039ba06270e6c6c1ad4e6940515aa5cdbad33f9effffffff57b4cb6156c63a8d6b834e236a21edf9d0f11fdd2fd0f9b28248328e24b773660000000017160014adbbadefe594e9e4bfccb9c699ae5d4f18716772ffffffff35ac1adc9e0cf408013090c52527d3cf9468d51e1a6c8408f5ed673eff41aaef0000000017160014209297fb46272a0b7e05139440dbd39daea3e25affffffff0b03833dd525dae7f7ed1455f386fc7899737a1cc3f538c7c4efbc7be08477920000000017160014681ea49259abb892460bf3373e8a0b43d877fa18ffffffff0300e1f505000000001976a914548cb80e45b1d36312fe0cb075e5e337e3c54cef88ac40420f000000000017a9142369da13fee80c9d7fd8043bf1275c04deb360e687590d5d2c0000000017a91458b53ea7f832e8f096e896b8713a8c6df0e892ca870248304502210099c13d8c6d32f522467a9fc5c7e036245eaef7d4b1a090b6ce3fc655db96bf4a02207de0ba7d6fda2bac7d39b622a00f15b37ad3192b4ad1d7c1ddc2e1f081472e6a012103bb0e339d7495b1f355c49d385b79343e52e68d99de2fe1f7f476c465c9ccd16702483045022100b1473f08ef3c174475d6fdb7ab964eaafe2f11475c2d2993a54de429deaf4de602204197cd84712a7cc516445f165a2f42ba5c18eb1f3d20b760165bcbfa243d1507012102a52d8cf5a89c284bacff90a3d7c30a0166e0074ca3fc385f3efce638c50493b30247304402200a19b665d4156d8f8affd9eb8246a10d54101181047165e95e4ff4860b29b5cd022055416ba8aca3a48bfcb98a5f2288b7cdee0b46845950f209dd0cd47d0b646c41012103c2c2e65556ca4b7371549324b99390725493c8a6792e093a0bdcbb3e2d7df4ab02473044022017e7eb6fffcc0b25583728bf31f81536cd2cc4610e49b7c4d607f7e48cf5648f0220251b3af8ef4fa61690769e0b4ced36846cd082d00c610061fb6ce99038ca34700121028cbc37e1816a23086fa738c8415def477e813e20f484dbbd6f5a33a37c32225100000000',
            },
        },
        {
            description: 'Testnet (RBF): with OP_RETURN output',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: "m/84'/1'/1'/0/14",
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
                        address_n: "m/84'/1'/1'/1/10",
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
                    '020000000001010978ca90092d490a773ca00de50bc5c4d9930fab03b656f5525cf099379783400100000000fdffffff020000000000000000066a046465616414410f00000000001600141c02e2397a8a02ff71d3f26937d14a656469dd1f02483045022100944436661220c9c008441ff3b946610980cccc4d8373456288cac348882ed7ce02200b9fdd680252dd1f19257ccc1278478049e58fbc59496a726cc46d4d3407af73012102a269d4b8faf008074b974b6d64fa1776e17fdf65381a76d1338e9bba88983a8700000000',
            },
        },
        {
            description: 'Testnet (RBF): add new utxo and change output',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: "m/84'/1'/0'/0/65",
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
                        address_n: "m/84'/1'/0'/0/66",
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
                        address_n: "m/84'/1'/0'/1/0",
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
                    '02000000000102489bf0633bfdb2400d9c023d6a4e2f3b8310cd2d5d655a18251eb86850fc5d2d0000000000fdffffffe2f3e554265df6d4c6d367d2c4e794daed1d278e6f75a117865491dc2cd8eb560100000000fdffffff02a226000000000000160014978ac2568ec31385bb3213e80413eb07e204105a7e85010000000000160014cc8067093f6f843d6d3e22004a4290cd0c0f336b0247304402204e9dee3b104cfed3a1cacd2e4d9ae065924f4a161a2e27b0527d1c3c73be9ec802200d2506fbf3f97850de49d18ab90990709930c4b3ea462441d4d830bb99cffff6012102377521551fc6c84312a60519bc50b3a761836d184e02b5908289362ff3fd193a024730440220452142fd5b6087802fa6b3afe5702719befd3cd4d2322beca4ad2b45f09b9cc90220345b39cf02f9debd1a589b4dafc9daf6371febbb1d09b9b743acccf44b60f91f012103c40376f2a410b616d75bab29849e3d8744a8c3739d52add73b45afa1346c7c2e5d0f1d00',
            },
        },
        {
            description: 'Testnet (RBF): decrease output',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: "m/49'/1'/0'/0/4",
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
                        address_n: "m/49'/1'/0'/0/3",
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
                    '02000000000102d64ae26dceee1e309bed0821f39275b5f6e65d0072f8e23747ae76006967765e0100000017160014039ba06270e6c6c1ad4e6940515aa5cdbad33f9effffffff35ac1adc9e0cf408013090c52527d3cf9468d51e1a6c8408f5ed673eff41aaef0000000017160014209297fb46272a0b7e05139440dbd39daea3e25affffffff01301b0f000000000017a9142369da13fee80c9d7fd8043bf1275c04deb360e68702483045022100f9f9213ce781fa9765a37ab001a8b86998b04eefe46735892741d23c4fdc5131022071c5ead5972234b3f6330d5e5f0cde1d8cdf465cbe21abd9d28296f8e9e832a1012103bb0e339d7495b1f355c49d385b79343e52e68d99de2fe1f7f476c465c9ccd1670247304402205fa14c9be2309a611371ef80cfa476b5210d662f5b97130cc310598cfce62513022060801317237d2176d39070f7883bac5b2297a376d7dc006eda21835a5f84c45f012103c2c2e65556ca4b7371549324b99390725493c8a6792e093a0bdcbb3e2d7df4ab00000000',
            },
        },
        {
            description: 'Testnet (RBF): Taproot',
            skip: ['<1.10.4', '<2.4.3'],
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: "m/86'/1'/0'/1/0",
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
                    '020000000001017b350e3faca092f39883d7086cdd502c82b6f0314ab61541b062733edef156790100000000ffffffff01d20f000000000000225120e9af2fc69e20b0be2629cd0e9c34da9f3ef56af7beac4fb4298262bc5a45ec5d0140c510f9b5d77062746ea0805f3c73e7ee8d6a70296e0d7cb718e01b3a2ab70eec68ae0ef8d8711ebdb7926a25247951952b3a6612189a4e40a44f72d502a1e51400000000',
            },
        },
    ],
};
