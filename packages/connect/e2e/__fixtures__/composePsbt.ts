const composePsbt: TestCase = {
    method: 'composePsbt',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Bitcoin (P2PKH)',
            params: {
                account: {
                    path: "m/44'/0'/0'",
                    utxo: [
                        {
                            txid: '50f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d',
                            vout: 1,
                            amount: '50000',
                            blockHeight: 343014,
                            path: "m/44'/0'/0'/0/5",
                            address: '1GA9u9TfCG7SWmKCveBumdA1TZpfom6ZdJ',
                        },
                    ],
                    addresses: {
                        used: [],
                        unused: [],
                        change: [
                            {
                                address: '1EcL6AyfQTyWKGvXwNSfsWoYnD3whzVFdu',
                                path: "m/44'/0'/0'/1/3",
                            },
                        ],
                    },
                },
                psbtData:
                    '70736274ff01007701000000016d20f69067ad1ffd50ee7c0f377dde2c932ccb03e84b5659732da99c20f1f6500100000000ffffffff0230750000000000001976a914954820f1de627a703596ac0396f986d958e3de4c88ac10270000000000001976a91405427736705cfbfaff76b1cff48283707fb1037088ac00000000000100e101000000016d20f69067ad1ffd50ee7c0f377dde2c932ccb03e84b5659732da99c20f1f650010000006a47304402203429bd3ce7b38c5c1e8a15340edd79ced41a2939aae62e259d2e3d18e0c5ee7602201b83b10ebc4d6dcee3f9eb42ba8f1ef8a059a05397e0c1b9223d1565a3e6ec01012102a7a079c1ef9916b289c2ff21a992c808d0de3dfcf8a9f163205c5c9e21f55d5cffffffff0230750000000000001976a914954820f1de627a703596ac0396f986d958e3de4c88ac10270000000000001976a91405427736705cfbfaff76b1cff48283707fb1037088ac00000000000000',
                coin: 'btc',
            },
            result: {
                type: 'final',
                bytes: 119,
                fee: '10000',
                feePerByte: '84.03361344537815',
                totalSpent: '20000',
                inputs: [{ script_type: 'SPENDADDRESS' }],
                outputs: [
                    {
                        amount: '30000',
                        script_type: 'PAYTOADDRESS',
                        address_n: [2147483692, 2147483648, 2147483648, 1, 3],
                    },
                    {
                        amount: '10000',
                        script_type: 'PAYTOADDRESS',
                        address: '1Up15Msx4sbvUCGm8Xgo2Zp5FQim3wE59',
                    },
                ],
            },
        },
        {
            description: 'Testnet (Bech32/P2WPKH)',
            params: {
                account: {
                    path: "m/84'/1'/0'",
                    utxo: [
                        {
                            txid: 'ae0949b1b050ac6f92c7d9c1570f2f06c21a997eef8be9ef5edc2a38cb92a879',
                            vout: 1,
                            amount: '7802513',
                            blockHeight: 343014,
                            path: "m/84'/1'/0'/1/4",
                            address: 'tb1qguznsd2hyl69gjx2axd6f5qu9k274qj9waffqy',
                        },
                    ],
                    addresses: {
                        used: [],
                        unused: [],
                        change: [
                            {
                                address: 'tb1q8zx9dlztqz9apm7y5gtx8a0tlz57fhncx343ya',
                                path: "m/84'/1'/0'/1/5",
                            },
                        ],
                    },
                },
                psbtData:
                    '70736274ff010061010000000179a892cb382adc5eefe98bef7e991ac2062f0f57c1d9c7926fac50b0b14909ae010000000000000000020000000000000000066a04deadbeeffb0d770000000000160014388c56fc4b008bd0efc4a21663f5ebf8a9e4de7800000000000100cf0100000000010179a892cb382adc5eefe98bef7e991ac2062f0f57c1d9c7926fac50b0b14909ae010000000000000000020000000000000000066a04deadbeeffb0d770000000000160014388c56fc4b008bd0efc4a21663f5ebf8a9e4de7802483045022100a87aa2338d0e7401d26b67b76a6446052ef148186893fe4bdceba467b00b5c2c022073159df4b4bb4514d23c8f9b0566098da47da383a829a941b54e95068beba491012102e7477af80286177f60fbf529b8bd3004dd2f0f407ce9f852b3e88fbe295c0f2700000000000000',
                coin: 'test',
            },
            result: {
                type: 'final',
                bytes: 97,
                fee: '150',
                feePerByte: '1.5463917525773196',
                totalSpent: '150',
                inputs: [{ script_type: 'SPENDWITNESS' }],
                outputs: [
                    {
                        amount: '0',
                        script_type: 'PAYTOOPRETURN',
                        op_return_data: 'deadbeef',
                    },
                    {
                        amount: '7802363',
                        script_type: 'PAYTOWITNESS',
                    },
                ],
            },
        },
    ],
};

export default composePsbt;
