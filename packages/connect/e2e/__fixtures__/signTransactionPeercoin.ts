const { ADDRESS_N, TX_CACHE } = global.TestUtils;

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            // See tx f7e3624c143b6a170cc44f9337d0fa8ea8564a211de9c077c6889d8c78f80909
            description: 'Peercoin: 1 input, 1 output, no change',
            params: {
                coin: 'Peercoin',
                timestamp: 1573209226,
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/6'/0'/0/0"),
                        prev_hash:
                            '41b29ad615d8eea40a4654a052d18bb10cd08f203c351f4d241f88b031357d3d',
                        prev_index: 0,
                        amount: '100000',
                    },
                ],
                outputs: [
                    {
                        address: 'PXtfyTjzgXSgTwK5AbszdHQSSxyQN3BLM5',
                        amount: '90000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                // https://blockbook.peercoin.net/tx/41b29ad615d8eea40a4654a052d18bb10cd08f203c351f4d241f88b031357d3d
                refTxs: TX_CACHE(['41b29a'], true),
            },
            result: {
                serializedTx:
                    '010000008a44c55d013d7d3531b0881f244d1f353c208fd00cb18bd152a054460aa4eed815d69ab241000000006a473044022025c0ea702390c702c7ae8b5ea469820bea8d942c8c16439f8f0ba2e91e699efc02200db9b0a48fa2861695fa91df4831a4c7306587e5d2dc85419647f462717bc8f001210274cb0ee652d9457fbb0f3872d43155a6bc16f77bd5749d8826b53db443b1b278ffffffff01905f0100000000001976a914ff9a05654150fdc92b1655f49d7f2a8aaf6a3a2a88ac00000000',
            },
        },
        {
            description: 'Peercoin: not enough funds',
            // See tx 915340ecc7466d287596f1f5b1fa0c1fa78c5b76ede0dff978fd6a1ca31eee24
            params: {
                coin: 'Peercoin',
                timestamp: 1573218223,
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/6'/0'/0/0"),
                        prev_hash:
                            '41b29ad615d8eea40a4654a052d18bb10cd08f203c351f4d241f88b031357d3d',
                        prev_index: 0,
                        amount: '100000',
                    },
                ],
                outputs: [
                    {
                        address_n: ADDRESS_N("m/44'/6'/0'/0/1"),
                        amount: '900000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                // https://blockbook.peercoin.net/tx/41b29ad615d8eea40a4654a052d18bb10cd08f203c351f4d241f88b031357d3d
                refTxs: TX_CACHE(['41b29a'], true),
            },
            result: false,
        },
    ],
};
