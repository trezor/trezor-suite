const { ADDRESS_N, TX_CACHE } = global.TestUtils;

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
                        address_n: ADDRESS_N("m/84'/1'/0'/0/0"),
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
                        address_n: ADDRESS_N("m/84'/1'/0'/1/0"),
                        amount: '99999694',
                        script_type: 'PAYTOWITNESS',
                    },
                ],
                locktime: 1287124,
                refTxs: TX_CACHE(['e294c4']),
            },
            result: {
                signatures: [
                    '304402200b780667eaca089ef829ab1d6613f9f80cccacccaed68022a902394b078a6bab022051fdf65a744b80fb804ba6c8bcd479c5adba0c614ea29d224706554a84d77c13',
                ],
                serializedTx:
                    '0100000000010100ff121dd31ead0f06e3014d9192be8485afd6459e36b09179d8c372c1c494e20000000000fdffffff03809698000000000017a914051877a0cc43165e48975c1e62bdef3b6c942a3887002d3101000000001600142fde3b3d1644fd16bd18a78138ae3873398eca37cedff50500000000160014cc8067093f6f843d6d3e22004a4290cd0c0f336b0247304402200b780667eaca089ef829ab1d6613f9f80cccacccaed68022a902394b078a6bab022051fdf65a744b80fb804ba6c8bcd479c5adba0c614ea29d224706554a84d77c13012103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f862d4a31300',
            },
        },
        {
            description: 'Testnet (Bech32/P2WPKH): 3 inputs, no change',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/0/0"),
                        amount: '100000',
                        prev_hash:
                            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                        prev_index: 0,
                        script_type: 'SPENDWITNESS',
                        sequence: 4294967293,
                    },
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/1/1"),
                        amount: '19899859',
                        prev_hash:
                            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e',
                        prev_index: 1,
                        script_type: 'SPENDWITNESS',
                        sequence: 4294967293,
                    },
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/0/1"),
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
                    '304402201c7b5e5bf96c116920b1ffaa6c69a30f029022e68df6d7e0b9c330970de1b5a90220693b00a2b17ece7cfae3dc3d861a5d5648caf6df6301d2f979dd5221ae9f31ff',
                    '3045022100dea85c9c58763c92f11fa1382eeb98f4d824cb0100591dd0929d7ed7d7fa52a10220651ecf6c9675229836f794909c22efbe700eb4eb9592b13635c6d76f5c0d2e25',
                    '3044022053338bd0e064690b888372b2c2ce36af154f79b5f73fd1e0205aa9b4b04da015022066d7c13a82acfa3d20b0b9eefce68a13d30837948a6711dadc0c5dd57cd6baaa',
                ],
                serializedTx:
                    '010000000001039e506939e23ad82a559f2c5e812d13788644e1e0017afd5c40383ab01e87f9700000000000fdffffff9e506939e23ad82a559f2c5e812d13788644e1e0017afd5c40383ab01e87f9700100000000fdffffffae5da162270c47efb4816244525e4f6a0f1cfe955f487f69f35370ff0db505f40000000000fdffffff016c0a2707000000001976a91405a710c9ce0fdd2094ef41ee30f9fb9de59d8bd288ac0247304402201c7b5e5bf96c116920b1ffaa6c69a30f029022e68df6d7e0b9c330970de1b5a90220693b00a2b17ece7cfae3dc3d861a5d5648caf6df6301d2f979dd5221ae9f31ff012103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f86202483045022100dea85c9c58763c92f11fa1382eeb98f4d824cb0100591dd0929d7ed7d7fa52a10220651ecf6c9675229836f794909c22efbe700eb4eb9592b13635c6d76f5c0d2e25012102d587bc96e0ceab05f27401d66dc3e596ba02f2c0d7b018b5f80eebfaeb01101202473044022053338bd0e064690b888372b2c2ce36af154f79b5f73fd1e0205aa9b4b04da015022066d7c13a82acfa3d20b0b9eefce68a13d30837948a6711dadc0c5dd57cd6baaa012103dcf3bc936ecb2ec57b8f468050abce8c8756e75fd74273c9977744b1a0be7d03f9101600',
            },
        },
        {
            description: 'Testnet (Bech32/P2WPKH): 1 input, OP_RETURN output + change',
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: ADDRESS_N("m/84'/1'/0'/1/4"),
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
                        address_n: ADDRESS_N("m/84'/1'/0'/1/5"),
                        amount: '7802363',
                        script_type: 'PAYTOWITNESS',
                    },
                ],
                refTxs: TX_CACHE(['ae0949']),
            },
            result: {
                signatures: [
                    '3045022100a87aa2338d0e7401d26b67b76a6446052ef148186893fe4bdceba467b00b5c2c022073159df4b4bb4514d23c8f9b0566098da47da383a829a941b54e95068beba491',
                ],
                serializedTx:
                    '0100000000010179a892cb382adc5eefe98bef7e991ac2062f0f57c1d9c7926fac50b0b14909ae010000000000000000020000000000000000066a04deadbeeffb0d770000000000160014388c56fc4b008bd0efc4a21663f5ebf8a9e4de7802483045022100a87aa2338d0e7401d26b67b76a6446052ef148186893fe4bdceba467b00b5c2c022073159df4b4bb4514d23c8f9b0566098da47da383a829a941b54e95068beba491012102e7477af80286177f60fbf529b8bd3004dd2f0f407ce9f852b3e88fbe295c0f2700000000',
            },
        },
    ],
};
