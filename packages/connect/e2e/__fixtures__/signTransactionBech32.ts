const { TX_CACHE } = global.TestUtils;

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Testnet (Bech32/P2WPKH): 1 input, 3 outputs',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: "m/84'/1'/0'/0/0",
                        amount: '129999867',
                        prev_hash:
                            'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00',
                        prev_index: 0,
                        script_type: 'SPENDWITNESS',
                        sequence: 4294967293,
                    },
                ],
                outputs: [
                    {
                        address: '2MsiAgG5LVDmnmJUPnYaCeQnARWGbGSVnr3',
                        amount: '10000000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 'tb1q9l0rk0gkgn73d0gc57qn3t3cwvucaj3h8wtrlu',
                        amount: '20000000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address_n: "m/84'/1'/0'/1/0",
                        amount: '99999694',
                        script_type: 'PAYTOWITNESS',
                    },
                ],
                locktime: 1287124,
                refTxs: TX_CACHE(['e294c4']),
            },
            result: {
                signatures: [
                    '3045022100c5575f6a13f01db3ddd21a36c1b17f5bfb4a84910f0590b8a7cc338f72e4f1670220389f5db2bec542330672db86814453b5bc210dd4429f0f8b5f1d7d2f5f0ef34a',
                ],
                serializedTx:
                    '0200000000010100ff121dd31ead0f06e3014d9192be8485afd6459e36b09179d8c372c1c494e20000000000fdffffff03809698000000000017a914051877a0cc43165e48975c1e62bdef3b6c942a3887002d3101000000001600142fde3b3d1644fd16bd18a78138ae3873398eca37cedff50500000000160014cc8067093f6f843d6d3e22004a4290cd0c0f336b02483045022100c5575f6a13f01db3ddd21a36c1b17f5bfb4a84910f0590b8a7cc338f72e4f1670220389f5db2bec542330672db86814453b5bc210dd4429f0f8b5f1d7d2f5f0ef34a012103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f862d4a31300',
            },
        },
        {
            description: 'Testnet (Bech32/P2WPKH): 3 inputs, no change',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: "m/84'/1'/0'/0/0",
                        amount: '100000',
                        prev_hash:
                            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                        prev_index: 0,
                        script_type: 'SPENDWITNESS',
                        sequence: 4294967293,
                    },
                    {
                        address_n: "m/84'/1'/0'/1/1",
                        amount: '19899859',
                        prev_hash:
                            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                        prev_index: 1,
                        script_type: 'SPENDWITNESS',
                        sequence: 4294967293,
                    },
                    {
                        address_n: "m/84'/1'/0'/0/1",
                        amount: '99999474',
                        prev_hash:
                            'f405b50dff7053f3697f485f95fe1c0f6a4f5e52446281b4ef470c2762a15dae',
                        prev_index: 0,
                        script_type: 'SPENDWITNESS',
                        sequence: 4294967293,
                    },
                ],
                outputs: [
                    {
                        address: 'mg2qow5HDZcsdwWjrBp6Tv7pnNzY6NYivh',
                        amount: '119999084',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                locktime: 1446137,
                refTxs: TX_CACHE(['70f987', 'f405b5']),
            },
            result: {
                signatures: [
                    '3045022100bc003730ad061af44c83a3afcdd5e643b21871ebf72e038eb52d863f36ad64ad02200bc52acb3ea67fb1e6c63d377bfdb1ee0ebefb1638db928f6357d14957f26f2b',
                    '3044022043532feb65b7dbc67ce5768ae68c7754ad08e6f6797746bc2db1d4bffcf90e8602201dea51f2de3a834eb0bcf87fdf90b8403c25283f0c50028b767c3988dcf903dc',
                    '3044022038cf3eb58e4b5b7e9876d96f67eb5bfb8698fe4f31f865a83fc8ced2c74b2a430220238f8bd66ada832d52469a1403bc8e18d36cfe1202ae77bc0f0190dddfdff8ae',
                ],
                serializedTx:
                    '020000000001039e506939e23ad82a559f2c5e812d13788644e1e0017afd5c40383ab01e87f9700000000000fdffffff9e506939e23ad82a559f2c5e812d13788644e1e0017afd5c40383ab01e87f9700100000000fdffffffae5da162270c47efb4816244525e4f6a0f1cfe955f487f69f35370ff0db505f40000000000fdffffff016c0a2707000000001976a91405a710c9ce0fdd2094ef41ee30f9fb9de59d8bd288ac02483045022100bc003730ad061af44c83a3afcdd5e643b21871ebf72e038eb52d863f36ad64ad02200bc52acb3ea67fb1e6c63d377bfdb1ee0ebefb1638db928f6357d14957f26f2b012103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f86202473044022043532feb65b7dbc67ce5768ae68c7754ad08e6f6797746bc2db1d4bffcf90e8602201dea51f2de3a834eb0bcf87fdf90b8403c25283f0c50028b767c3988dcf903dc012102d587bc96e0ceab05f27401d66dc3e596ba02f2c0d7b018b5f80eebfaeb01101202473044022038cf3eb58e4b5b7e9876d96f67eb5bfb8698fe4f31f865a83fc8ced2c74b2a430220238f8bd66ada832d52469a1403bc8e18d36cfe1202ae77bc0f0190dddfdff8ae012103dcf3bc936ecb2ec57b8f468050abce8c8756e75fd74273c9977744b1a0be7d03f9101600',
            },
        },
        {
            description: 'Testnet (Bech32/P2WPKH): 1 input, OP_RETURN output + change',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: "m/84'/1'/0'/1/4",
                        amount: '7802513',
                        prev_hash:
                            'ae0949b1b050ac6f92c7d9c1570f2f06c21a997eef8be9ef5edc2a38cb92a879',
                        prev_index: 1,
                        script_type: 'SPENDWITNESS',
                        sequence: 0,
                    },
                ],
                outputs: [
                    {
                        op_return_data: 'deadbeef',
                        amount: '0',
                        script_type: 'PAYTOOPRETURN',
                    },
                    {
                        address_n: "m/84'/1'/0'/1/5",
                        amount: '7802363',
                        script_type: 'PAYTOWITNESS',
                    },
                ],
                refTxs: TX_CACHE(['ae0949']),
            },
            result: {
                signatures: [
                    '30440220275aebfa3b619bef635e6170309de50da49512c309a17829df7647803875534702206c67ec124a3b9efc399929f26a9fb3f80454c0a1df4225c4c6ad3f3257e6b6f1',
                ],
                serializedTx:
                    '0200000000010179a892cb382adc5eefe98bef7e991ac2062f0f57c1d9c7926fac50b0b14909ae010000000000000000020000000000000000066a04deadbeeffb0d770000000000160014388c56fc4b008bd0efc4a21663f5ebf8a9e4de78024730440220275aebfa3b619bef635e6170309de50da49512c309a17829df7647803875534702206c67ec124a3b9efc399929f26a9fb3f80454c0a1df4225c4c6ad3f3257e6b6f1012102e7477af80286177f60fbf529b8bd3004dd2f0f407ce9f852b3e88fbe295c0f2700000000',
            },
        },
    ],
};
