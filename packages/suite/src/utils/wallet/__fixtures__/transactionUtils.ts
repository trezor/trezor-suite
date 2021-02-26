export const analyzeTransactions = [
    {
        description: 'nothing new',
        fresh: [
            { blockHeight: 4, blockHash: '4', txid: '4' },
            { blockHeight: 3, blockHash: '3', txid: '3' },
            { blockHeight: 2, blockHash: '2', txid: '2' },
        ],
        known: [
            { blockHeight: 4, blockHash: '4', txid: '4' },
            { blockHeight: 3, blockHash: '3', txid: '3' },
            { blockHeight: 2, blockHash: '2', txid: '2' },
            { blockHeight: 1, blockHash: '1', txid: '1' },
        ],
        result: {
            newTransactions: [],
            add: [],
            remove: [],
        },
    },
    {
        description: 'one new (confirmed)',
        fresh: [
            { blockHeight: 5, blockHash: '5', txid: '5' },
            { blockHeight: 4, blockHash: '4', txid: '4' },
            { blockHeight: 3, blockHash: '3', txid: '3' },
            { blockHeight: 2, blockHash: '2', txid: '2' },
        ],
        known: [
            { blockHeight: 4, blockHash: '4', txid: '4' },
            { blockHeight: 3, blockHash: '3', txid: '3' },
            { blockHeight: 2, blockHash: '2', txid: '2' },
            { blockHeight: 1, blockHash: '1', txid: '1' },
        ],
        result: {
            newTransactions: [{ blockHeight: 5, blockHash: '5', txid: '5' }],
            add: [{ blockHeight: 5, blockHash: '5', txid: '5' }],
            remove: [],
        },
    },
    {
        description: 'one new (pending)',
        fresh: [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
        known: [],
        result: {
            newTransactions: [],
            add: [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
            remove: [],
        },
    },
    {
        description: 'still pending',
        fresh: [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
        known: [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
        result: {
            newTransactions: [],
            add: [],
            remove: [],
        },
    },
    {
        description: 'pending is gone',
        fresh: [],
        known: [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
        result: {
            newTransactions: [],
            add: [],
            remove: [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
        },
    },
    {
        description: 'pending txs are gone, 1 confirmed remains',
        fresh: [{ blockHeight: 1, blockHash: '1', txid: '1' }],
        known: [
            { blockHeight: undefined, blockHash: '2b', txid: '2b' },
            { blockHeight: undefined, blockHash: '2a', txid: '2a' },
            { blockHeight: 1, blockHash: '1', txid: '1' },
        ],
        result: {
            newTransactions: [],
            add: [],
            remove: [
                { blockHeight: undefined, blockHash: '2b', txid: '2b' },
                { blockHeight: undefined, blockHash: '2a', txid: '2a' },
            ],
        },
    },
    {
        description: 'pending is gone, confirmed is gone',
        fresh: [],
        known: [
            { blockHeight: undefined, blockHash: '2', txid: '2' },
            { blockHeight: 1, blockHash: '1', txid: '1' },
        ],
        result: {
            newTransactions: [],
            add: [],
            remove: [
                { blockHeight: undefined, blockHash: '2', txid: '2' },
                { blockHeight: 1, blockHash: '1', txid: '1' },
            ],
        },
    },
    {
        description: 'pending becomes confirmed',
        fresh: [{ blockHeight: 1, blockHash: '1', txid: '1' }],
        known: [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
        result: {
            newTransactions: [{ blockHeight: 1, blockHash: '1', txid: '1' }],
            add: [{ blockHeight: 1, blockHash: '1', txid: '1' }],
            remove: [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
        },
    },
    {
        description: 'pending missing, confirmed with different hash',
        fresh: [{ blockHeight: 1, blockHash: '1a', txid: '1a' }],
        known: [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
        result: {
            newTransactions: [{ blockHeight: 1, blockHash: '1a', txid: '1a' }],
            add: [{ blockHeight: 1, blockHash: '1a', txid: '1a' }],
            remove: [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
        },
    },
    {
        description: 'two new, one pending',
        fresh: [
            { blockHeight: undefined, blockHash: '4', txid: '4' },
            { blockHeight: 3, blockHash: '3', txid: '3' },
            { blockHeight: 2, blockHash: '2', txid: '2' },
            { blockHeight: 1, blockHash: '1', txid: '1' },
        ],
        known: [{ blockHeight: 1, blockHash: '1', txid: '1' }],
        result: {
            newTransactions: [
                { blockHeight: 3, blockHash: '3', txid: '3' },
                { blockHeight: 2, blockHash: '2', txid: '2' },
            ],
            add: [
                { blockHeight: undefined, blockHash: '4', txid: '4' },
                { blockHeight: 3, blockHash: '3', txid: '3' },
                { blockHeight: 2, blockHash: '2', txid: '2' },
            ],
            remove: [],
        },
    },
    {
        description: 'one new added between known',
        fresh: [
            { blockHeight: 3, blockHash: '3', txid: '3' },
            { blockHeight: 2, blockHash: '2', txid: '2' },
            { blockHeight: 1, blockHash: '1', txid: '1' },
        ],
        known: [
            { blockHeight: 3, blockHash: '3', txid: '3' },
            { blockHeight: 1, blockHash: '1', txid: '1' },
        ],
        result: {
            newTransactions: [{ blockHeight: 2, blockHash: '2', txid: '2' }],
            add: [{ blockHeight: 2, blockHash: '2', txid: '2' }],
            remove: [],
        },
    },
    {
        description: 'multiple new added between known',
        fresh: [
            { blockHeight: 4, blockHash: '4', txid: '4' },
            { blockHeight: 3, blockHash: '3b', txid: '3b' },
            { blockHeight: 3, blockHash: '3a', txid: '3a' },
            { blockHeight: 2, blockHash: '2c', txid: '2c' },
            { blockHeight: 2, blockHash: '2b', txid: '2b' },
            { blockHeight: 2, blockHash: '2a', txid: '2a' },
            { blockHeight: 1, blockHash: '1', txid: '1' },
        ],
        known: [
            { blockHeight: 3, blockHash: '3b', txid: '3b' },
            { blockHeight: 3, blockHash: '3a', txid: '3a' },
            { blockHeight: 1, blockHash: '1', txid: '1' },
        ],
        result: {
            newTransactions: [
                { blockHeight: 4, blockHash: '4', txid: '4' },
                { blockHeight: 2, blockHash: '2c', txid: '2c' },
                { blockHeight: 2, blockHash: '2b', txid: '2b' },
                { blockHeight: 2, blockHash: '2a', txid: '2a' },
            ],
            add: [
                { blockHeight: 4, blockHash: '4', txid: '4' },
                { blockHeight: 2, blockHash: '2c', txid: '2c' },
                { blockHeight: 2, blockHash: '2b', txid: '2b' },
                { blockHeight: 2, blockHash: '2a', txid: '2a' },
            ],
            remove: [],
        },
    },
    {
        description: 'no page intersection from TOP, remove known add new',
        fresh: [
            { blockHeight: undefined, blockHash: '4', txid: '4' },
            { blockHeight: 3, blockHash: '3', txid: '3' },
            { blockHeight: 2, blockHash: '2', txid: '2' },
        ],
        known: [
            { blockHeight: 1, blockHash: '1b', txid: '1b' },
            { blockHeight: 1, blockHash: '1a', txid: '1a' },
            { blockHeight: 0, blockHash: '0', txid: '0' },
        ],
        result: {
            newTransactions: [
                { blockHeight: 3, blockHash: '3', txid: '3' },
                { blockHeight: 2, blockHash: '2', txid: '2' },
            ],
            add: [
                { blockHeight: undefined, blockHash: '4', txid: '4' },
                { blockHeight: 3, blockHash: '3', txid: '3' },
                { blockHeight: 2, blockHash: '2', txid: '2' },
            ],
            remove: [
                { blockHeight: 1, blockHash: '1b', txid: '1b' },
                { blockHeight: 1, blockHash: '1a', txid: '1a' },
                { blockHeight: 0, blockHash: '0', txid: '0' },
            ],
        },
    },
    {
        description: 'rollback on second known block + 2 new txs',
        fresh: [
            { blockHeight: undefined, blockHash: '4', txid: '4' },
            { blockHeight: 3, blockHash: '3', txid: '3' },
            { blockHeight: 2, blockHash: '2a', txid: '2a' },
            { blockHeight: 1, blockHash: '1b', txid: '1b' },
            { blockHeight: 1, blockHash: '1a', txid: '1a' },
        ],
        known: [
            { blockHeight: 2, blockHash: '2', txid: '2' },
            { blockHeight: 1, blockHash: '1b', txid: '1b' },
            { blockHeight: 1, blockHash: '1a', txid: '1a' },
            { blockHeight: 0, blockHash: '0', txid: '0' },
        ],
        result: {
            newTransactions: [{ blockHeight: 3, blockHash: '3', txid: '3' }],
            add: [
                { blockHeight: undefined, blockHash: '4', txid: '4' },
                { blockHeight: 3, blockHash: '3', txid: '3' },
                { blockHeight: 2, blockHash: '2a', txid: '2a' },
            ],
            remove: [{ blockHeight: 2, blockHash: '2', txid: '2' }],
        },
    },
    {
        description:
            'rollback, BOTTOM page intersection not satisfied, block bellow could be affected as well',
        fresh: [
            { blockHeight: 3, blockHash: '3a', txid: '3a' },
            { blockHeight: 2, blockHash: '2b', txid: '2b' },
            { blockHeight: 2, blockHash: '2a', txid: '2a' },
        ],
        known: [
            { blockHeight: 3, blockHash: '3', txid: '3' },
            { blockHeight: 2, blockHash: '2', txid: '2' },
            { blockHeight: 1, blockHash: '1b', txid: '1b' },
            { blockHeight: 1, blockHash: '1a', txid: '1a' },
            { blockHeight: 0, blockHash: '0', txid: '0' },
        ],
        result: {
            newTransactions: [{ blockHeight: 2, blockHash: '2a', txid: '2a' }],
            add: [
                { blockHeight: 3, blockHash: '3a', txid: '3a' },
                { blockHeight: 2, blockHash: '2b', txid: '2b' },
                { blockHeight: 2, blockHash: '2a', txid: '2a' },
            ],
            remove: [
                { blockHeight: 3, blockHash: '3', txid: '3' },
                { blockHeight: 2, blockHash: '2', txid: '2' },
                { blockHeight: 1, blockHash: '1b', txid: '1b' },
                { blockHeight: 1, blockHash: '1a', txid: '1a' },
                { blockHeight: 0, blockHash: '0', txid: '0' },
            ],
        },
    },
];

export const enhanceTransaction = [
    {
        tx: {
            amount: 123,
            blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
            blockHeight: 590093,
            blockTime: 1565797979,
            fee: '0.00002929',
            totalSpent: '123.00002929',
            targets: [],
            tokens: [
                {
                    address: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
                    amount: '10',
                    decimals: 18,
                    from: '0x75e68d3b6acd23e79e395fa627ae5cae605c03d3',
                    name: 'Decentraland MANA',
                    symbol: 'MANA',
                    to: '0x73d0385f4d8e00c5e6504c6030f47bf6212736a8',
                    type: 'recv',
                },
            ],
            txid: '7e58757f43015242c0efa29447bea4583336f2358fdff587b52bbe040ad8982a',
            type: 'sent',
            details: {
                vin: [
                    {
                        addresses: ['tb1q4nytpy37cuz8yndtfqpau4nzsva0jh787ny3yg'],
                        isAddress: true,
                        n: 0,
                        sequence: 4294967294,
                        txid: 'c894b064beb2f9be4b0d64cffcd89da2e8dc6decac399f5617323a303e07e4e1',
                        value: '80720012',
                    },
                ],
                vout: [
                    {
                        addresses: ['tb1q4s560ew83wcd6lcjg7uku9qlx4p6gwh74q4jap'],
                        hex: '0014ac29a7e5c78bb0dd7f1247b96e141f3543a43afe',
                        isAddress: true,
                        n: 0,
                        value: '80718868',
                    },
                    {
                        addresses: ['mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q'],
                        hex: '76a914a579388225827d9f2fe9014add644487808c695d88ac',
                        isAddress: true,
                        n: 1,
                        value: '1000',
                    },
                ],
                size: 225,
                totalInput: '80720012',
                totalOutput: '80719868',
            },
        },
        account: global.JestMocks.getWalletAccount({
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            symbol: 'btc',
            networkType: 'bitcoin',
        }),
        result: {
            amount: '0.00000123',
            blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
            blockHeight: 590093,
            blockTime: 1565797979,
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            fee: '0.0000000000002929',
            totalSpent: '0.0000012300002929',
            symbol: 'btc',
            targets: [],
            tokens: [
                {
                    address: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
                    amount: '0.00000000000000001',
                    decimals: 18,
                    from: '0x75e68d3b6acd23e79e395fa627ae5cae605c03d3',
                    name: 'Decentraland MANA',
                    symbol: 'MANA',
                    to: '0x73d0385f4d8e00c5e6504c6030f47bf6212736a8',
                    type: 'recv',
                },
            ],
            txid: '7e58757f43015242c0efa29447bea4583336f2358fdff587b52bbe040ad8982a',
            type: 'sent',
            details: {
                vin: [
                    {
                        addresses: ['tb1q4nytpy37cuz8yndtfqpau4nzsva0jh787ny3yg'],
                        isAddress: true,
                        n: 0,
                        sequence: 4294967294,
                        txid: 'c894b064beb2f9be4b0d64cffcd89da2e8dc6decac399f5617323a303e07e4e1',
                        value: '0.80720012',
                    },
                ],
                vout: [
                    {
                        addresses: ['tb1q4s560ew83wcd6lcjg7uku9qlx4p6gwh74q4jap'],
                        hex: '0014ac29a7e5c78bb0dd7f1247b96e141f3543a43afe',
                        isAddress: true,
                        n: 0,
                        value: '0.80718868',
                    },
                    {
                        addresses: ['mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q'],
                        hex: '76a914a579388225827d9f2fe9014add644487808c695d88ac',
                        isAddress: true,
                        n: 1,
                        value: '0.00001',
                    },
                ],
                size: 225,
                totalInput: '0.80720012',
                totalOutput: '0.80719868',
            },
        },
    },
    {
        tx: {
            amount: '0.00006497',
            blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
            blockHeight: 590093,
            blockTime: 1565797979,
            fee: '0.00002929',
            totalSpent: '0.00009426',
            targets: [
                {
                    addresses: ['0x4f4f1488acb1ae1b46146ceff804f591dfe660ac'],
                    isAddress: true,
                    amount: '1234',
                },
            ],
            tokens: [],
            txid: '7e58757f43015242c0efa29447bea4583336f2358fdff587b52bbe040ad8982a',
            type: 'sent',
            details: {
                vin: [],
                vout: [],
                totalInput: '10000000',
                totalOutput: '10000000',
                size: 255,
            },
        },
        account: global.JestMocks.getWalletAccount({
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            symbol: 'btc',
            networkType: 'bitcoin',
        }),
        result: {
            amount: '0.0000000000006497',
            blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
            blockHeight: 590093,
            blockTime: 1565797979,
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            fee: '0.0000000000002929',
            totalSpent: '0.0000000000009426',
            symbol: 'btc',
            targets: [
                {
                    addresses: ['0x4f4f1488acb1ae1b46146ceff804f591dfe660ac'],
                    isAddress: true,
                    amount: '0.00001234',
                },
            ],
            tokens: [],
            txid: '7e58757f43015242c0efa29447bea4583336f2358fdff587b52bbe040ad8982a',
            type: 'sent',
            details: {
                vin: [],
                vout: [],
                totalInput: '0.1',
                totalOutput: '0.1',
                size: 255,
            },
        },
    },
    {
        tx: {
            amount: '0.00006497',
            blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
            blockHeight: 590093,
            blockTime: 1565797979,
            fee: '0.00002929',
            totalSpent: '0.00009426',
            targets: [
                {
                    addresses: ['0x4f4f1488acb1ae1b46146ceff804f591dfe660ac'],
                    isAddress: true,
                    amount: 1234,
                },
            ],
            tokens: [],
            txid: '7e58757f43015242c0efa29447bea4583336f2358fdff587b52bbe040ad8982a',
            type: 'sent',
            details: {
                vin: [],
                vout: [],
                totalInput: '10000000',
                totalOutput: '10000000',
                size: 255,
            },
        },
        account: global.JestMocks.getWalletAccount({
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            symbol: 'btc',
            networkType: 'bitcoin',
        }),
        result: {
            amount: '0.0000000000006497',
            blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
            blockHeight: 590093,
            blockTime: 1565797979,
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            fee: '0.0000000000002929',
            totalSpent: '0.0000000000009426',
            symbol: 'btc',
            targets: [
                {
                    addresses: ['0x4f4f1488acb1ae1b46146ceff804f591dfe660ac'],
                    isAddress: true,
                    amount: 1234,
                },
            ],
            tokens: [],
            txid: '7e58757f43015242c0efa29447bea4583336f2358fdff587b52bbe040ad8982a',
            type: 'sent',
            details: {
                vin: [],
                vout: [],
                totalInput: '0.1',
                totalOutput: '0.1',
                size: 255,
            },
        },
    },
];

export const searchTransactions = [
    {
        description: 'Partial TXID search',
        search: 'ade',
        result: [
            '17b013822da84cc39a0d2df8abc78ade03c8712d078a2d614889fb189c52c8f5',
            '5986a3b46340a5999d70f86fee8caea6b9870500e602c30b630195ade281a833',
            'bf20f5eea272056d439eb78db97a207f5a1bd3e8a29ff920744f2eb70b8d9425', // Address contains search
            'dbe87d35c441d00cb2368b93a50ccd7ee8a984a838561a08b2cbc03b434338fb', // Address contains search
            '5f8dbb7c7b3ddf297cc21abb66adbadeaede30d14c49f12ec1d42117b3e8c159',
            '48ce7f7d6344b3cf0bf1f53356941d1df4cade3460fbd33800dcbdb635800d0e',
            '85a198193021b1298b1a227eae89194502dadef90612b095ff059a579ff88d6c',
        ],
    },
    {
        description: 'Exact TXID search',
        search: '93600f534749714165262774ab248a4a1c40e833238d9a4bbf539095213fa258',
        result: ['93600f534749714165262774ab248a4a1c40e833238d9a4bbf539095213fa258'],
    },
    {
        description: 'Partial Address search',
        search: 'b1qgu',
        result: [
            '8796794aaa4563098325ef2cb08cafd97112b1d31baeed97e4d39efba6249be4',
            '072d69d762f33ea5e4c4493e94ce4dcf927fe9d8cf6df5b8d40217336a05571e',
            'a59a1761ad3fad987258c79850e397398ab8559f157bc6868a7ed4e8b742ef01',
            'fbebc7273c3fdd61eef334687668c1152226d7361251460f0fb1c6ccacbbae78',
            'e81dcd9aaa60d855fb219e977a260dc621d9c24e00ffbe2e1cae8aed36f7802f',
            'ae0949b1b050ac6f92c7d9c1570f2f06c21a997eef8be9ef5edc2a38cb92a879',
            'c6d86cd9872e98cc8f4f79846d91699e35f04ce81fad9c088384a11a319ab4cb',
        ],
    },
    {
        description: 'Exact Address search',
        search: 'tb1qegw9kj8z3206neq9f09m9ahs67h4xq9tgvhjcj',
        result: [
            '93600f534749714165262774ab248a4a1c40e833238d9a4bbf539095213fa258',
            '8c40061886e9815498b59b564be390beb8b7ff73d436b1d1c833475974bc3e5a',
        ],
    },
    {
        description: 'Partial Output label search',
        search: 'Pota',
        result: [
            '62431e78bb13a4fdd9c87517db1ea70b4cb5763227327da35748c96497c6ea9a', // Potato
            '4f9af222a7c53ea708f8f370583608eda85c49f9f58901c82f0c79c6ab998b18', // Not Potato
        ],
    },
    {
        description: 'Exact Output label search',
        search: 'Not potato',
        result: [
            '4f9af222a7c53ea708f8f370583608eda85c49f9f58901c82f0c79c6ab998b18', // Not Potato
        ],
    },
    {
        description: 'Output label search (ignore casing)',
        search: 'pOtAtO',
        result: [
            '62431e78bb13a4fdd9c87517db1ea70b4cb5763227327da35748c96497c6ea9a', // Potato
            '4f9af222a7c53ea708f8f370583608eda85c49f9f58901c82f0c79c6ab998b18', // Not Potato
        ],
    },
    {
        description: 'Partial Address label search',
        search: 'AAA',
        result: [
            '9438960e985b1de4e118cbcedf6122c2467477d768d262863ee13e981b6c2816', // AAA
            '5be0cfd5b439c3112cfaea3cd05fdcea387433990885c86937d2488c59f1e692', // AAA
            'f38d1ae79872985688d92dcec6a359ca563c48a506e8766488ad1d2aa8e4ea30', // AAAFEFSF
            '905e181a3e3066a88bf848690ad32cd260ca53dc192d6f588c0344fa08363b11', // AAAFEFSF
            '65b768dacccfb209eebd95a1fb80a04f1dd6a3abc6d7b41d5e9d9f91605b37d9', // AAAFEFSF
            'e4b5b24159856ea18ab5819832da3b4a6330f9c3c0a46d96674e632df504b56b', // AAAFEFSF
            'b4fc775f2bace65b68ba8c43423fab2f96c8743c54d5468b92923f70ca20ae2e', // AAAFEFSF
            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e', // AAAFEFSF
            'f405b50dff7053f3697f485f95fe1c0f6a4f5e52446281b4ef470c2762a15dae', // AAAFEFSF
            '575df1986c414f1d74bebc2229d794e423a2371fb51bac1d3b517e5cca51b5ea', // AAAFEFSF
            '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06', // AAAFEFSF
            'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00', // AAAFEFSF
        ],
    },
    {
        description: 'Exact Address label search',
        search: 'AAAFEFSF',
        result: [
            'f38d1ae79872985688d92dcec6a359ca563c48a506e8766488ad1d2aa8e4ea30', // AAAFEFSF
            '905e181a3e3066a88bf848690ad32cd260ca53dc192d6f588c0344fa08363b11', // AAAFEFSF
            '65b768dacccfb209eebd95a1fb80a04f1dd6a3abc6d7b41d5e9d9f91605b37d9', // AAAFEFSF
            'e4b5b24159856ea18ab5819832da3b4a6330f9c3c0a46d96674e632df504b56b', // AAAFEFSF
            'b4fc775f2bace65b68ba8c43423fab2f96c8743c54d5468b92923f70ca20ae2e', // AAAFEFSF
            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e', // AAAFEFSF
            'f405b50dff7053f3697f485f95fe1c0f6a4f5e52446281b4ef470c2762a15dae', // AAAFEFSF
            '575df1986c414f1d74bebc2229d794e423a2371fb51bac1d3b517e5cca51b5ea', // AAAFEFSF
            '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06', // AAAFEFSF
            'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00', // AAAFEFSF
        ],
    },
    {
        description: 'Address label search (ignore casing)',
        search: 'aaaFEFSF',
        result: [
            'f38d1ae79872985688d92dcec6a359ca563c48a506e8766488ad1d2aa8e4ea30', // AAAFEFSF
            '905e181a3e3066a88bf848690ad32cd260ca53dc192d6f588c0344fa08363b11', // AAAFEFSF
            '65b768dacccfb209eebd95a1fb80a04f1dd6a3abc6d7b41d5e9d9f91605b37d9', // AAAFEFSF
            'e4b5b24159856ea18ab5819832da3b4a6330f9c3c0a46d96674e632df504b56b', // AAAFEFSF
            'b4fc775f2bace65b68ba8c43423fab2f96c8743c54d5468b92923f70ca20ae2e', // AAAFEFSF
            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e', // AAAFEFSF
            'f405b50dff7053f3697f485f95fe1c0f6a4f5e52446281b4ef470c2762a15dae', // AAAFEFSF
            '575df1986c414f1d74bebc2229d794e423a2371fb51bac1d3b517e5cca51b5ea', // AAAFEFSF
            '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06', // AAAFEFSF
            'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00', // AAAFEFSF
        ],
    },
    {
        description: 'Higher than amount search',
        search: '> 0.07',
        result: [
            'f457a1b85f84dcdaadc06f5dffb1436034bf6fa69a271a08d005f0a65aea7693', // 0.0794905 TEST
            '121afe39eaeacd0f38ff1ed4ab34dbd34aa1239a82465a112dbcde1646b01ec7', // 0.07806848 TEST
            'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00', // 1.29999867 TEST
        ],
    },
    {
        description: 'Lower than amount search',
        search: '< -0.1',
        result: [
            'a59a1761ad3fad987258c79850e397398ab8559f157bc6868a7ed4e8b742ef01', // -0.22667356 TEST
            'b4fc775f2bace65b68ba8c43423fab2f96c8743c54d5468b92923f70ca20ae2e', // -1.19999084 TEST
            '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06', // -0.1 TEST
        ],
    },
    {
        description: 'Exclude amount search',
        search: '!= -0.00999888',
        notResult: [
            '62431e78bb13a4fdd9c87517db1ea70b4cb5763227327da35748c96497c6ea9a', // -0.00999888 TEST
        ],
    },
    {
        description: 'Date search',
        search: '2020-12-03',
        result: [
            '9438960e985b1de4e118cbcedf6122c2467477d768d262863ee13e981b6c2816',
            '5be0cfd5b439c3112cfaea3cd05fdcea387433990885c86937d2488c59f1e692',
        ],
    },
    {
        description: 'After date search',
        search: '> 2020-12-14',
        result: [
            '62431e78bb13a4fdd9c87517db1ea70b4cb5763227327da35748c96497c6ea9a', // 2020-12-27
            'f5cea29dec1d4e8b83a81b61627caf36adc33085284bde2969ae5beb75bd413c', // 2020-12-14
        ],
    },
    {
        description: 'Before date search',
        search: '< 2018-03-20',
        result: [
            '575df1986c414f1d74bebc2229d794e423a2371fb51bac1d3b517e5cca51b5ea', // 2020-03-16
            '43d273d3caf41759ad843474f960fbf80ff2ec961135d018b61e9fab3ad1fc06', // 2020-03-02
            'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00', // 2020-03-02
        ],
    },
    {
        description: 'Exclude date search',
        search: '!= 2020-12-27',
        notResult: [
            '62431e78bb13a4fdd9c87517db1ea70b4cb5763227327da35748c96497c6ea9a', // 2020-12-27
        ],
    },
    {
        description: 'AND operator (incoming December transactions only)',
        search: '> 2020-12-01 & < 2020-12-31 & > 0',
        results: [
            'f5cea29dec1d4e8b83a81b61627caf36adc33085284bde2969ae5beb75bd413c', // 2020-12-14 - 0.01 TEST
            '5be0cfd5b439c3112cfaea3cd05fdcea387433990885c86937d2488c59f1e692', // 2020-12-03 - 0.00019199 TEST
        ],
    },
    {
        description: 'OR operator (December 14th and 3rd transactions only)',
        search: '2020-12-14 | 2020-12-03 & > 0',
        results: [
            'f5cea29dec1d4e8b83a81b61627caf36adc33085284bde2969ae5beb75bd413c', // 2020-12-14 - 0.01 TEST
            '9438960e985b1de4e118cbcedf6122c2467477d768d262863ee13e981b6c2816', // 2020-12-03 - -0.00002066 TEST
            '5be0cfd5b439c3112cfaea3cd05fdcea387433990885c86937d2488c59f1e692', // 2020-12-03 - 0.00019199 TEST
        ],
    },
    {
        description: 'AND + OR operator (December 14th and 3rd incoming transactions only)',
        search: '2020-12-14 | 2020-12-03 & > 0',
        results: [
            'f5cea29dec1d4e8b83a81b61627caf36adc33085284bde2969ae5beb75bd413c', // 2020-12-14 - 0.01 TEST
            '5be0cfd5b439c3112cfaea3cd05fdcea387433990885c86937d2488c59f1e692', // 2020-12-03 - 0.00019199 TEST
        ],
    },
];

export const findChainedTransactions = [
    {
        description: 'deeply chained transactions',
        txid: 'ABCD',
        transactions: {
            'account1-key': [
                {
                    txid: 'ABCD-child',
                    details: {
                        vin: [{ txid: 'ABCD' }],
                    },
                },
                {
                    txid: 'ABCD-child-child',
                    details: {
                        vin: [{ txid: 'ABCD-child' }],
                    },
                },
                {
                    txid: 'ABCD-child-child-child',
                    details: {
                        vin: [{ txid: 'ABCD-child-child' }],
                    },
                },
            ],
            'account2-key': [
                {
                    txid: '0123',
                    details: {
                        vin: [{ txid: '0012' }],
                    },
                },
                {
                    txid: 'XYZ0',
                    details: {
                        vin: [{ txid: 'ABCD-child-child-child' }],
                    },
                },
                {
                    txid: '4567',
                    details: {
                        vin: [{ txid: '8910' }],
                    },
                },
            ],
            'account3-key': [
                {
                    txid: 'XYZ1',
                    details: {
                        vin: [{ txid: 'ABCD-child' }],
                    },
                },
            ],
        },
        result: [
            {
                key: 'account1-key',
                txs: [
                    {
                        txid: 'ABCD-child',
                        details: {
                            vin: [{ txid: 'ABCD' }],
                        },
                    },
                    {
                        txid: 'ABCD-child-child',
                        details: {
                            vin: [{ txid: 'ABCD-child' }],
                        },
                    },
                    {
                        txid: 'ABCD-child-child-child',
                        details: {
                            vin: [{ txid: 'ABCD-child-child' }],
                        },
                    },
                ],
            },
            {
                key: 'account2-key',
                txs: [
                    {
                        txid: 'XYZ0',
                        details: {
                            vin: [{ txid: 'ABCD-child-child-child' }],
                        },
                    },
                ],
            },
            {
                key: 'account3-key',
                txs: [
                    {
                        txid: 'XYZ1',
                        details: {
                            vin: [{ txid: 'ABCD-child' }],
                        },
                    },
                ],
            },
        ],
    },
];

export const getRbfParams = [
    {
        description: 'invalid account',
        account: { networkType: 'ethereum' },
        tx: {},
        result: undefined,
    },
    {
        description: 'invalid tx (type recv)',
        account: { networkType: 'bitcoin' },
        tx: { type: 'recv' },
        result: undefined,
    },
    {
        description: 'invalid tx (rbf false)',
        account: { networkType: 'bitcoin' },
        tx: { type: 'sent', rbf: false },
        result: undefined,
    },
    {
        description: 'invalid tx (no details)',
        account: { networkType: 'bitcoin' },
        tx: { type: 'sent', rbf: true, details: undefined },
        result: undefined,
    },
    {
        description: 'invalid tx (confirmed)',
        account: { networkType: 'bitcoin' },
        tx: { type: 'sent', rbf: true, details: {}, blockHeight: 1 },
        result: undefined,
    },
    {
        description: 'addresses not found',
        account: { networkType: 'bitcoin' },
        tx: {
            type: 'sent',
            rbf: true,
            details: {
                vin: [
                    {
                        addresses: ['abcd'],
                    },
                ],
                vout: [
                    {
                        addresses: ['abcd'],
                    },
                ],
            },
        },
        result: undefined,
    },
    {
        description: 'outputs not found',
        account: {
            networkType: 'bitcoin',
            addresses: {
                change: [],
                used: [{ address: 'abcd' }],
                unused: [],
            },
        },
        tx: {
            type: 'sent',
            rbf: true,
            details: {
                vin: [
                    {
                        addresses: ['abcd'],
                    },
                ],
                vout: [],
            },
        },
        result: undefined,
    },
    {
        description: 'without change address',
        account: {
            networkType: 'bitcoin',
            addresses: {
                change: [{ address: '1234', path: 'm/44/1' }],
                used: [{ address: 'abcd', path: 'm/44/0' }],
                unused: [],
            },
        },
        tx: {
            type: 'self',
            txid: '1A2b',
            rbf: true,
            fee: '166',
            details: {
                size: 100,
                vin: [
                    {
                        txid: 'prevTxid',
                        value: '1',
                        addresses: ['abcd'],
                    },
                ],
                vout: [
                    {
                        addresses: ['xyz0'],
                    },
                ],
            },
        },
        result: {
            txid: '1A2b',
            baseFee: 166,
            feeRate: '2',
            utxo: [
                {
                    address: 'abcd',
                    path: 'm/44/0',
                    blockHeight: 0,
                    confirmations: 0,
                    txid: 'prevTxid',
                    amount: '1',
                    vout: 0,
                },
            ],
            changeAddress: undefined,
            outputs: [
                {
                    type: 'payment',
                    address: 'xyz0',
                },
            ],
        },
    },
    {
        description: 'success',
        account: {
            networkType: 'bitcoin',
            addresses: {
                change: [{ address: '1234', path: 'm/44/1' }],
                used: [{ address: 'abcd', path: 'm/44/0' }],
                unused: [],
            },
        },
        tx: {
            type: 'sent',
            txid: '1A2b',
            rbf: true,
            fee: '366',
            details: {
                size: 100,
                vin: [
                    {
                        txid: 'prevTxid',
                        value: '1',
                        addresses: ['abcd'],
                    },
                ],
                vout: [
                    {
                        addresses: ['xyz0'],
                    },
                    {
                        addresses: ['1234'],
                    },
                ],
            },
        },
        result: {
            txid: '1A2b',
            baseFee: 366,
            feeRate: '4',
            utxo: [
                {
                    address: 'abcd',
                    path: 'm/44/0',
                    blockHeight: 0,
                    confirmations: 0,
                    txid: 'prevTxid',
                    amount: '1',
                    vout: 0,
                },
            ],
            changeAddress: {
                address: '1234',
                path: 'm/44/1',
            },
            outputs: [
                {
                    type: 'payment',
                    address: 'xyz0',
                },
                {
                    type: 'change',
                    address: '1234',
                },
            ],
        },
    },
];
