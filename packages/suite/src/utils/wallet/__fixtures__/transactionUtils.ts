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
        },
    },
    {
        tx: {
            amount: '0.00006497',
            blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
            blockHeight: 590093,
            blockTime: 1565797979,
            fee: '0.00002929',
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
        },
    },
    {
        tx: {
            amount: '0.00006497',
            blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
            blockHeight: 590093,
            blockTime: 1565797979,
            fee: '0.00002929',
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
        },
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
