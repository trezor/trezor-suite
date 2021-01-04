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

export const searchTransactions = [
    {
        description: 'Partial TXID search',
        search: 'ade',
        result: [
            '17b013822da84cc39a0d2df8abc78ade03c8712d078a2d614889fb189c52c8f5',
            '5986a3b46340a5999d70f86fee8caea6b9870500e602c30b630195ade281a833',
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
            '072d69d762f33ea5e4c4493e94ce4dcf927fe9d8cf6df5b8d40217336a05571e',
            'e81dcd9aaa60d855fb219e977a260dc621d9c24e00ffbe2e1cae8aed36f7802f',
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
            '5be0cfd5b439c3112cfaea3cd05fdcea387433990885c86937d2488c59f1e692', // AAA
            '905e181a3e3066a88bf848690ad32cd260ca53dc192d6f588c0344fa08363b11', // AAAFEFSF
            'e4b5b24159856ea18ab5819832da3b4a6330f9c3c0a46d96674e632df504b56b', // AAAFEFSF
            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e', // AAAFEFSF
            '575df1986c414f1d74bebc2229d794e423a2371fb51bac1d3b517e5cca51b5ea', // AAAFEFSF
            'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00', // AAAFEFSF
        ],
    },
    {
        description: 'Exact Address label search',
        search: 'AAAFEFSF',
        result: [
            '905e181a3e3066a88bf848690ad32cd260ca53dc192d6f588c0344fa08363b11', // AAAFEFSF
            'e4b5b24159856ea18ab5819832da3b4a6330f9c3c0a46d96674e632df504b56b', // AAAFEFSF
            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e', // AAAFEFSF
            '575df1986c414f1d74bebc2229d794e423a2371fb51bac1d3b517e5cca51b5ea', // AAAFEFSF
            'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00', // AAAFEFSF
        ],
    },
    {
        description: 'Address label search (ignore casing)',
        search: 'aaaFEFSF',
        result: [
            '905e181a3e3066a88bf848690ad32cd260ca53dc192d6f588c0344fa08363b11', // AAAFEFSF
            'e4b5b24159856ea18ab5819832da3b4a6330f9c3c0a46d96674e632df504b56b', // AAAFEFSF
            '70f9871eb03a38405cfd7a01e0e1448678132d815e2c9f552ad83ae23969509e', // AAAFEFSF
            '575df1986c414f1d74bebc2229d794e423a2371fb51bac1d3b517e5cca51b5ea', // AAAFEFSF
            'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00', // AAAFEFSF
        ],
    },
];
