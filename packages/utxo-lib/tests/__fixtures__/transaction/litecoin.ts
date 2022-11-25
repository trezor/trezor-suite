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
    ],
    invalid: {
        addInput: [],
        fromBuffer: [],
    },
};
