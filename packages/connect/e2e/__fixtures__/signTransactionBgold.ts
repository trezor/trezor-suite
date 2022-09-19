const { ADDRESS_N, TX_CACHE } = global.TestUtils;

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
            description: 'Bgold: 1 input, 1output, 1 change',
            params: {
                coin: 'Bgold',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/156'/0'/0/0"),
                        amount: '1252382934',
                        prev_hash:
                            '6f0398f8bac639312afc2e40210ce5253535f92326167f40e1f38dd7047b00ec',
                        prev_index: 0,
                        script_type: 'SPENDADDRESS',
                    },
                ],
                outputs: [
                    {
                        address_n: ADDRESS_N("m/44'/156'/0'/1/0"),
                        amount: '1896050',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 'GfDB1tvjfm3bukeoBTtfNqrJVFohS2kCTe',
                        amount: '1250485884',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['6f0398'], true), // Fake tx
            },
            result: {
                serializedTx:
                    '0100000001ec007b04d78df3e1407f162623f9353525e50c21402efc2a3139c6baf898036f000000006a473044022009721c9ca2c3d17e2df61c3940f2934b4fb42a7f68dbdbbbb0900f85d13ad2800220710bcdca9a562d436547a51b018c7d97f0ae918c0df4fc423cb02e05b224fda24121023bd0ec4022d12d0106c5b7308a25572953ba1951f576f691354a7b147ee0cc1fffffffff0272ee1c00000000001976a9141c82b9c11f193ad82413caadc0955730572b50ae88ac7ce6884a000000001976a914ea5f904d195079a350b534db4446433b3cec222e88ac00000000',
            },
        },
        {
            description: 'Bgold: 2 inputs, 1 output, no change',
            params: {
                coin: 'Bgold',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/156'/0'/0/0"),
                        amount: '1252382934',
                        prev_hash:
                            '6f0398f8bac639312afc2e40210ce5253535f92326167f40e1f38dd7047b00ec',
                        prev_index: 0,
                        script_type: 'SPENDADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/44'/156'/0'/0/1"),
                        amount: '38448607',
                        prev_hash:
                            'aae50f8dc1c19c35517e5bbc2214d38e1ce4b4ff7cb3151b5b31bf0f723f8e06',
                        prev_index: 0,
                        script_type: 'SPENDADDRESS',
                    },
                ],
                outputs: [
                    {
                        address: 'GfDB1tvjfm3bukeoBTtfNqrJVFohS2kCTe',
                        amount: '1270830541',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['6f0398', 'aae50f'], true), // Fake tx
            },
            result: {
                serializedTx:
                    '0100000002ec007b04d78df3e1407f162623f9353525e50c21402efc2a3139c6baf898036f000000006b483045022100dda4e32fb43cd2217e48df892b38c98acc5a4815c11ff232e327c0cb0f133d3d022041351c3f929a6011d442c500c45348f977cacb234a2999ca3b3b9922c0830fd44121023bd0ec4022d12d0106c5b7308a25572953ba1951f576f691354a7b147ee0cc1fffffffff068e3f720fbf315b1b15b37cffb4e41c8ed31422bc5b7e51359cc1c18d0fe5aa000000006a473044022024db731f390b48b8e346c2d519eea569042b6db7d15a1f0159e682eed3ff94a10220531c0673845e7cce81dd37953b70e4eceee0dcb5d0ab4d8b9a7de4d7e83ed727412102d54a7e5733b1635e5e9442943f48179b1700206b2d1925250ba10f1c86878be8ffffffff01cd55bf4b000000001976a914ea5f904d195079a350b534db4446433b3cec222e88ac00000000',
            },
        },
        {
            description: 'Bgold (P2SH): 1 input, 2 outputs, no change',
            params: {
                coin: 'Bgold',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/49'/156'/0'/1/0"),
                        amount: '1252382934',
                        prev_hash:
                            'db7239c358352c10996115b3de9e3f37ea0a97be4ea8c4b9e08996e257a21d0e',
                        prev_index: 0,
                        script_type: 'SPENDP2SHWITNESS',
                    },
                ],
                outputs: [
                    {
                        address: 'GfDB1tvjfm3bukeoBTtfNqrJVFohS2kCTe',
                        amount: '12300000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 'GZFLExxrvWFuFT1xRzhfwQWSE2bPDedBfn',
                        amount: '1240071934',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['db7239'], true), // Fake tx
            },
            result: {
                serializedTx:
                    '010000000001010e1da257e29689e0b9c4a84ebe970aea373f9edeb3156199102c3558c33972db0000000017160014b5355d001e720d8f4513da00ff2bba4dcf9d39fcffffffff02e0aebb00000000001976a914ea5f904d195079a350b534db4446433b3cec222e88acfefee949000000001976a914a8f757819ec6779409f45788f7b4a0e8f51ec50488ac024730440220297dd984a414b5105911b6b171f92a889a732f5fb0ee7c8804d5187edb76808a02201c97b6b5cdeb8ba483c6bb5085f1cceed2dbe61faa09db57e9116abc88184653412102ecea08b559fc5abd009acf77cfae13fa8a3b1933e3e031956c65c12cec8ca3e300000000',
            },
        },
        {
            description: 'Bgold (P2SH): 1 input, 1output, 1 change',
            params: {
                coin: 'Bgold',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/49'/156'/0'/1/0"),
                        amount: '1252382934',
                        prev_hash:
                            'db7239c358352c10996115b3de9e3f37ea0a97be4ea8c4b9e08996e257a21d0e',
                        prev_index: 0,
                        script_type: 'SPENDP2SHWITNESS',
                    },
                ],
                outputs: [
                    {
                        address: 'GfDB1tvjfm3bukeoBTtfNqrJVFohS2kCTe',
                        amount: '12300000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: ADDRESS_N("m/49'/156'/0'/1/0"),
                        amount: '1240071934',
                        script_type: 'PAYTOP2SHWITNESS',
                    },
                ],
                refTxs: TX_CACHE(['db7239'], true), // Fake tx
            },
            result: {
                serializedTx:
                    '010000000001010e1da257e29689e0b9c4a84ebe970aea373f9edeb3156199102c3558c33972db0000000017160014b5355d001e720d8f4513da00ff2bba4dcf9d39fcffffffff02e0aebb00000000001976a914ea5f904d195079a350b534db4446433b3cec222e88acfefee9490000000017a9140cd03822b799a452c106d1b3771844a067b17f118702463043021f718c7fcc27516eddb647f6cbafe310d98ccd1e43fe0d3ca2ee944e16b9dab90220359abfc5b144e7b7e54bfbfc2ce5962f5ad2e70985e77b34fb7bc104fefbe795412102ecea08b559fc5abd009acf77cfae13fa8a3b1933e3e031956c65c12cec8ca3e300000000',
            },
        },
        {
            description: 'Bgold (P2SH): spend multisig input',
            params: {
                coin: 'Bgold',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/49'/156'/1'/1/0"),
                        prev_hash:
                            '7f1f6bfe8d5a23e038c58bdcf47e6eb3b5ddb93300176b273564951105206b39',
                        prev_index: 0,
                        script_type: 'SPENDP2SHWITNESS',
                        amount: '1252382934',
                        multisig: {
                            pubkeys: [
                                {
                                    // m/49'/156'/1'
                                    node: 'xpub6BezrjBueDupZvwM1PGcPS5fFTQ7ZNQahTzQ7St8qMjXcRBraEZLbwYe38vQ1qxZckd3CHQio3pzSDPXX8wsf5Abxha11aYssjA48SHd85J',
                                    address_n: [1, 0],
                                },
                                {
                                    // m/49'/156'/2'
                                    node: 'xpub6BezrjBueDupd7ws7566VRFUcT2GL82n25h9rLUgHD4Q6wQdRuNBkwxKQcHBJo1x8AbqgsUXFdCBU7vyq9UfLgFBBx3SvNkK9coaThW6AAn',
                                    address_n: [1, 0],
                                },
                                {
                                    // m/49'/156'/3'
                                    node: 'xpub6BezrjBueDupfod6cp2aBD6vnB4fzMt21aB2qHVhN9CdPWmfcSrytVtsL9T5Qgp96NdPTXdwKgWsFZ4JCnUTQXNM636pCi7ZkoHmoHY1ruW',
                                    address_n: [1, 0],
                                },
                            ],
                            signatures: ['', '', ''],
                            m: 2,
                        },
                    },
                ],
                outputs: [
                    {
                        address: 'GfDB1tvjfm3bukeoBTtfNqrJVFohS2kCTe',
                        amount: '1252381934',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['7f1f6b'], true), // Fake tx
            },
            result: {
                serializedTx:
                    '01000000000101396b200511956435276b170033b9ddb5b36e7ef4dc8bc538e0235a8dfe6b1f7f0000000023220020ea9ec48498c451286c2ebaf9e19255e2873b0fb517d67b2f2005298c7e437829ffffffff01eed4a54a000000001976a914ea5f904d195079a350b534db4446433b3cec222e88ac030047304402207aae5d1f29a6e7a816bfa5c4fcce451f9a03727028a298daa98e9893ee9eec1702206ad96571ec48f99e4529257091274503585f690efa4095e554db9fcec0fa147b4169522103279aea0b253b144d1b2bb8532280001a996dcddd04f86e5e13df1355032cbc1321032c6465c956c0879663fa8be974c912d229c179a5cdedeb29611a1bec1f951eb22103494480a4b72101cbd2eadac8e18c7a3a7589a7f576bf46b8971c38c51e5eceeb53ae00000000',
            },
        },
    ],
};
