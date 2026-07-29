export default {
    valid: [
        {
            description: 'Litecoin mimble-wimble peg-out transaction',
            network: 'litecoin',
            id: 'efe11e0d8d562e73b7795c2a3b7e44c6b6390f2c42c3ae90bb1005009c27a3f3',
            hash: 'f3a3279c000510bb90aec3422c0f39b6c6447e3b2a5c79b7732e568d0d1ee1ef',
            hex: '02000000000801f190b67fc759641b8376f5ca550cac80ca3b2509c6a144e1425a437b18c161590000000000ffffffff020675a5b66a00000022582066723521c495f90a5fbe3686c617c294d69ac71ed9e57b65032f83e45871fd83b28c980000000000160014f4de962f4bb82d0057974201202acd78d56db7f20000000000',
            raw: {
                version: 2,
                ins: [
                    {
                        hash: 'f190b67fc759641b8376f5ca550cac80ca3b2509c6a144e1425a437b18c16159',
                        index: 0,
                        script: '',
                    },
                ],
                outs: [
                    {
                        script: 'OP_8 66723521c495f90a5fbe3686c617c294d69ac71ed9e57b65032f83e45871fd83',
                        value: 458330830086,
                    },
                    {
                        script: 'OP_0 f4de962f4bb82d0057974201202acd78d56db7f2',
                        value: 9997490,
                    },
                ],
                locktime: 0,
            },
            coinbase: false,
            virtualSize: 125,
            weight: 500,
        },
        {
            description:
                'Tx without advanced transaction marker and with byte that could be misinterpreted as mweb flag',
            network: 'litecoin',
            id: '635a3debbc010155a26a8684ecf3a79b8680ecd1c640073f88fbe1c6cf5909b1',
            hash: 'b10959cfc6e1fb883f0740c6d1ec80869ba7f3ec84866aa2550101bceb3d5a63',
            hex: '010000000108406c87e5b409367a79dbca3666a58b94d53c4f845da305e5136c114afca7c6010000006b4830450221008c9912560979d94b1400812acb9709d89073b922ecccccbec73560a431b3d86702206e93e96e80d4cbbbb68fafb16f82a0a6f9fa0949e4ac3de1fb5000bd350f213d01210374cfa7fbe55217f1e7db36edfd8c4169c6533a0c803a78b01226bc257a80cd39ffffffff1a3198a10000000000160014c946de7985ffa42355c9f7c78ecf2d5893f134539f8680e6010000001976a91499b79eea83499802d0b60c4e9b7b6df9903e4ece88ac636ce40d0000000017a914f700a499409366faf341846d28c9bb39cc368a5d8778e82a000000000017a914cf894e1d57c9f4daafe5b10c034e007ec3bbdaed87a0b223070000000017a914369131e47ba5e197300db50e9bcdaeaa6828c31f879ebc1e0e0000000017a9146d979c6f3e4cc3e32c9f42a6156de1ca55321a30871115a300000000001976a914bea40d8c4f019a4d9bf378e30c4890aabaf99a0988ac60a62f010000000017a914dd3eabe01198f774fe4511268140e9ff4de0562787ac33f705000000001600141f471820719f04ddeb0d94d6ecdb3174ae918f5bb344ba1200000000160014ff1e028f5818796be21225dc0e5b4606febf2a88a0f17b010000000016001498fd6a086b7b5de0e3ce5d8c2290be715ec0a095a46752010000000017a914d269dfdda3bd12ee112cd5efdb3d7fb3412db0fa87607201950000000017a9148d15c7af94284da8b7dd59bba245791420afee99874c7ee8010000000017a91443b6b8da579aa98579ccb525084c854fe86948bc87f8fede000000000017a91489963134f5daf0493fb82387ab94be0295a4754e8760ec530000000000160014e0ac1d16aed59cd41c875897f5d907ab76207c1ca02e63000000000017a9144892a77f3897c67d0cd831d8204cba5847ca6b64879487c604000000001976a914bd78033b1e29de5f0c624f1e8eb703f566661dad88acf8d8ea020000000017a914d3f4cf2b4d6a64afbc5dbec83e04c5dc3e7a376787d0ddeb09000000001600147abb5628519ba939088289e297da189728fec42e42ce7c0600000000160014086d5dbe5b70b2d96f04da34ca46a3affe5426f28a499e170000000017a91427a81d705278947c2d0dcb90d7459a9d1f3ac8e98780ceca0400000000160014612b58361a490490e32ad36c984ac772d5b0a3940c704b010000000017a914e57a3420fa5cb01393623a05942e143b21b41a2287de368b020000000017a9145b1b8e6ec574239a5cf3069a84164824cfed70738797536006000000001976a91425f2b01184b25ede42f81cf06a4d1fe3821c7d4c88ac00000000',
            raw: {
                version: 1,
                ins: [
                    {
                        hash: '08406c87e5b409367a79dbca3666a58b94d53c4f845da305e5136c114afca7c6',
                        index: 1,
                        data: '4830450221008c9912560979d94b1400812acb9709d89073b922ecccccbec73560a431b3d86702206e93e96e80d4cbbbb68fafb16f82a0a6f9fa0949e4ac3de1fb5000bd350f213d01210374cfa7fbe55217f1e7db36edfd8c4169c6533a0c803a78b01226bc257a80cd39',
                    },
                ],
                outs: [
                    {
                        value: '10590257',
                        data: '0014c946de7985ffa42355c9f7c78ecf2d5893f13453',
                    },
                    {
                        value: '8162150047',
                        data: '76a91499b79eea83499802d0b60c4e9b7b6df9903e4ece88ac',
                    },
                    {
                        value: '233073763',
                        data: 'a914f700a499409366faf341846d28c9bb39cc368a5d87',
                    },
                    {
                        value: '2812024',
                        data: 'a914cf894e1d57c9f4daafe5b10c034e007ec3bbdaed87',
                    },
                    {
                        value: '119780000',
                        data: 'a914369131e47ba5e197300db50e9bcdaeaa6828c31f87',
                    },
                    {
                        value: '236895390',
                        data: 'a9146d979c6f3e4cc3e32c9f42a6156de1ca55321a3087',
                    },
                    {
                        value: '10687761',
                        data: '76a914bea40d8c4f019a4d9bf378e30c4890aabaf99a0988ac',
                    },
                    {
                        value: '19900000',
                        data: 'a914dd3eabe01198f774fe4511268140e9ff4de0562787',
                    },
                    {
                        value: '100086700',
                        data: '00141f471820719f04ddeb0d94d6ecdb3174ae918f5b',
                    },
                    {
                        value: '314197171',
                        data: '0014ff1e028f5818796be21225dc0e5b4606febf2a88',
                    },
                    {
                        value: '24900000',
                        data: '001498fd6a086b7b5de0e3ce5d8c2290be715ec0a095',
                    },
                    {
                        value: '22177700',
                        data: 'a914d269dfdda3bd12ee112cd5efdb3d7fb3412db0fa87',
                    },
                    {
                        value: '2499900000',
                        data: 'a9148d15c7af94284da8b7dd59bba245791420afee9987',
                    },
                    {
                        value: '32013900',
                        data: 'a91443b6b8da579aa98579ccb525084c854fe86948bc87',
                    },
                    {
                        value: '14614264',
                        data: 'a91489963134f5daf0493fb82387ab94be0295a4754e87',
                    },
                    {
                        value: '5500000',
                        data: '0014e0ac1d16aed59cd41c875897f5d907ab76207c1c',
                    },
                    {
                        value: '6500000',
                        data: 'a9144892a77f3897c67d0cd831d8204cba5847ca6b6487',
                    },
                    {
                        value: '80119700',
                        data: '76a914bd78033b1e29de5f0c624f1e8eb703f566661dad88ac',
                    },
                    {
                        value: '48945400',
                        data: 'a914d3f4cf2b4d6a64afbc5dbec83e04c5dc3e7a376787',
                    },
                    {
                        value: '166452688',
                        data: '00147abb5628519ba939088289e297da189728fec42e',
                    },
                    {
                        value: '108842562',
                        data: '0014086d5dbe5b70b2d96f04da34ca46a3affe5426f2',
                    },
                    {
                        value: '396249482',
                        data: 'a91427a81d705278947c2d0dcb90d7459a9d1f3ac8e987',
                    },
                    {
                        value: '80400000',
                        data: '0014612b58361a490490e32ad36c984ac772d5b0a394',
                    },
                    {
                        value: '21721100',
                        data: 'a914e57a3420fa5cb01393623a05942e143b21b41a2287',
                    },
                    {
                        value: '42677982',
                        data: 'a9145b1b8e6ec574239a5cf3069a84164824cfed707387',
                    },
                    {
                        value: '106976151',
                        data: '76a91425f2b01184b25ede42f81cf06a4d1fe3821c7d4c88ac',
                    },
                ],
                locktime: 0,
            },
            coinbase: false,
            virtualSize: 990,
            weight: 3960,
        },
    ],
    invalid: {
        addInput: [],
        fromBuffer: [],
    },
};
