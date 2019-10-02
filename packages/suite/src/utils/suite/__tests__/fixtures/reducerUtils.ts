import TXS from './transactions';

const DISCOVERIES = [
    {
        deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
        index: 0,
        status: 4,
        total: 35,
        bundleSize: 0,
        loaded: 39,
        failed: [],
        networks: ['btc', 'btc', 'btc', 'test', 'test', 'test', 'eth', 'txrp'],
    },
];

export const getAccountTransactions = [
    {
        testName: 'BTC account, 2txs',
        transactions: TXS,
        account: global.JestMocks.getWalletAccount({
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            symbol: 'btc',
        }),
        result: [
            {
                amount: '0.00006497',
                blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
                blockHeight: 590093,
                blockTime: 1565797979,
                descriptor:
                    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                fee: '0.00002929',

                symbol: 'btc',
                targets: [
                    { addresses: ['36JkLACrdxARqXXffZk91V9W6SJvghKaVK'], amount: '0.00006497' },
                ],
                tokens: [],
                txid: '7e58757f43015242c0efa29447bea4583336f2358fdff587b52bbe040ad8982a',
                type: 'sent',
            },
            {
                amount: '0.00319322',
                blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
                blockHeight: 590093,
                blockTime: 1565797979,
                descriptor:
                    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                fee: '0.00000166',

                symbol: 'btc',
                targets: [
                    { addresses: ['3Bvy87TmQhhSBqfiCBh8w5yPx6usiDM8SY'], amount: '0.00319488' },
                ],
                tokens: [],
                txid: 'fa80a9949f1094119195064462f54d0e0eabd3139becd4514ae635b8c7fe3a46',
                type: 'recv',
            },
        ],
    },
    {
        testName: 'XRP testnet account, 2',
        transactions: TXS,
        account: global.JestMocks.getWalletAccount({
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            descriptor: 'rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H',
            symbol: 'txrp',
        }),
        result: [
            {
                descriptor: 'rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H',
                deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                symbol: 'txrp',
                type: 'recv',
                txid: 'A62FDA65E3B84FA2BED47086DB9458CFF8AF475196E327FC51DA0143BD998A9B',
                blockTime: 621951942,
                blockHeight: 454901,
                blockHash: 'A62FDA65E3B84FA2BED47086DB9458CFF8AF475196E327FC51DA0143BD998A9B',
                amount: '0.1',
                fee: '0.000012',
                targets: [
                    {
                        addresses: ['rMGDshGtHriKoC4pGGzWxyQfof1Gk9zV5k'],
                        isAddress: true,
                        amount: '0.1',
                    },
                ],
                tokens: [],
            },
            {
                descriptor: 'rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H',
                deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                symbol: 'txrp',
                type: 'recv',
                txid: 'DFA960521E384047E56946F9A441FB717475D132E49737A347CA8B6C80AFC84B',
                blockTime: 621951942,
                blockHeight: 454901,
                blockHash: 'DFA960521E384047E56946F9A441FB717475D132E49737A347CA8B6C80AFC84B',
                amount: '0.1',
                fee: '0.000012',
                targets: [
                    {
                        addresses: ['rMGDshGtHriKoC4pGGzWxyQfof1Gk9zV5k'],
                        isAddress: true,
                        amount: '0.1',
                    },
                ],
                tokens: [],
            },
        ],
    },
    {
        testName: 'eth account, 5 txs',
        transactions: TXS,
        account: global.JestMocks.getWalletAccount({
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            descriptor: '0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15',
            symbol: 'eth',
        }),
        result: [
            {
                descriptor: '0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15',
                deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                symbol: 'eth',
                type: 'recv',
                txid: '0x63635c5ca1e21d13780d5a0a66cc16dfe0b49ffb9eff191f15b3da271b1ad1d3',
                blockTime: 1495456394,
                blockHeight: 3748932,
                blockHash: '0x4e20bad727d86fb138c2ce1f52141648378c83acc2cd8d5e220f2fd90b581e59',
                amount: '0.000316822',
                fee: '0.000441',
                targets: [
                    { addresses: ['0x73d0385f4d8e00c5e6504c6030f47bf6212736a8'], isAddress: true },
                ],
                tokens: [],
                ethereumSpecific: {
                    status: -2,
                    nonce: 4,
                    gasLimit: 21000,
                    gasUsed: 21000,
                    gasPrice: '21000000000',
                },
            },
            {
                descriptor: '0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15',
                deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                symbol: 'eth',
                type: 'sent',
                txid: '0x5f3cba8a6dee792594dcce71c5aa39a872bce57cb33e0da8db02d9f2f865806c',
                blockTime: 1494938897,
                blockHeight: 3716306,
                blockHash: '0x7ccd4d3e0758caa38217ba53aeffce99f04fd3baef9ee1a4b77836742decfd22',
                amount: '0.00124351',
                fee: '0.00042',
                targets: [
                    {
                        addresses: ['0x73d0385f4d8e00c5e6504c6030f47bf6212736a8'],
                        isAddress: true,
                        amount: '0.00124351',
                    },
                ],
                tokens: [],
                ethereumSpecific: {
                    status: -2,
                    nonce: 1,
                    gasLimit: 21000,
                    gasUsed: 21000,
                    gasPrice: '20000000000',
                },
            },
            {
                descriptor: '0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15',
                deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                symbol: 'eth',
                type: 'sent',
                txid: '0xfaae2e7927e97002f15300c6011ca792243cbd57d574db34ccb2a9c18c272b3e',
                blockTime: 1493811343,
                blockHeight: 3643068,
                blockHash: '0x48a016dd2bde9ee285a9bd251de2a848585cac4f4fa31ad699e72df72988b15f',
                amount: '0',
                fee: '0.00073568',
                targets: [],
                tokens: [
                    {
                        type: 'sent',
                        name: 'Golem Network Token',
                        symbol: 'GNT',
                        address: '0xa74476443119a942de498590fe1f2454d7d4ac0d',
                        decimals: 18,
                        amount: '23000000000000000000',
                        from: '0xfa01a39f8abaeb660c3137f14a310d0b414b2a15',
                        to: '0xbc8580e0135a8e82722657f3e024c833d57df912',
                    },
                ],
                ethereumSpecific: {
                    status: -2,
                    nonce: 0,
                    gasLimit: 56784,
                    gasUsed: 36784,
                    gasPrice: '20000000000',
                },
            },
            {
                descriptor: '0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15',
                deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                symbol: 'eth',
                type: 'recv',
                txid: '0x0833ce97c3f4ce6c170c94aff0acfa1cbfd528bf0d3faa06676cad7daddd2e5c',
                blockTime: 1493811263,
                blockHeight: 3643065,
                blockHash: '0x0a7a90d34157253a6363d33f7aaa301cb171b4917908d4e896a4a7e5bf5e9c0a',
                amount: '0.00239919',
                fee: '0.00042',
                targets: [
                    { addresses: ['0x73d0385f4d8e00c5e6504c6030f47bf6212736a8'], isAddress: true },
                ],
                tokens: [],
                ethereumSpecific: {
                    status: -2,
                    nonce: 2,
                    gasLimit: 21000,
                    gasUsed: 21000,
                    gasPrice: '20000000000',
                },
            },
            {
                descriptor: '0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15',
                deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
                symbol: 'eth',
                type: 'recv',
                txid: '0xcef7e6fbb7f61df35eb6dd5c26f75c15152f83298d060e4c6b6850a835e2d9cd',
                blockTime: 1493721184,
                blockHeight: 3637164,
                blockHash: '0x3df882d951deeacb1cbbcc9f97bf1c7a8448d2669047a96a8cb2ad1051a5183a',
                amount: '0',
                fee: '0.00103568',
                targets: [],
                tokens: [
                    {
                        type: 'recv',
                        name: 'Golem Network Token',
                        symbol: 'GNT',
                        address: '0xa74476443119a942de498590fe1f2454d7d4ac0d',
                        decimals: 18,
                        amount: '23000000000000000000',
                        from: '0x73d0385f4d8e00c5e6504c6030f47bf6212736a8',
                        to: '0xfa01a39f8abaeb660c3137f14a310d0b414b2a15',
                    },
                ],
                ethereumSpecific: {
                    status: -2,
                    nonce: 1,
                    gasLimit: 56784,
                    gasUsed: 51784,
                    gasPrice: '20000000000',
                },
            },
        ],
    },
    {
        testName: 'eth account, 0 txs',
        transactions: TXS,
        account: global.JestMocks.getWalletAccount({
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            descriptor: '0xf69619a3dCAA63757A6BA0AF3628f5F6C42c50d2',
            symbol: 'eth',
        }),
        result: [],
    },
];

export const getDiscoveryProcess = [
    {
        testName:
            'Discovery for 7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f device',
        discoveries: DISCOVERIES,
        device: global.JestMocks.getSuiteDevice({
            state: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
        }),
        result: {
            bundleSize: 0,
            deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
            failed: [],
            index: 0,
            loaded: 39,
            networks: ['btc', 'btc', 'btc', 'test', 'test', 'test', 'eth', 'txrp'],
            status: 4,
            total: 35,
        },
    },
    {
        testName:
            'Discovery for 1dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f device',
        discoveries: DISCOVERIES,
        device: global.JestMocks.getSuiteDevice({
            state: '1dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
        }),
        result: null,
    },
];

export const observeChanges = [
    {
        testName: 'reducerUtils.observeChanges',
        prev: {
            a: 1,
            b: 2,
            c: 3,
        },
        current: {
            a: 1,
            b: 2,
            c: 5,
        },
        filter: undefined,
        result: true,
    },
    {
        testName: 'reducerUtils.observeChanges no change',
        prev: {
            a: 1,
            b: 2,
            c: 3,
        },
        current: {
            a: 1,
            b: 2,
            c: 3,
        },
        filter: undefined,
        result: false,
    },
    {
        testName: 'reducerUtils.observeChanges deep change with filter',
        prev: {
            a: 1,
            b: 2,
            c: {
                c1: 1,
                c2: 2,
            },
        },
        current: {
            a: 1,
            b: 2,
            c: {
                c1: 1,
                c2: 4,
            },
        },
        filter: { c: ['c2'] },
        result: true,
    },
    {
        testName: 'reducerUtils.observeChanges deep change without filter',
        prev: {
            a: 1,
            b: 2,
            c: {
                c1: 1,
                c2: 2,
            },
        },
        current: {
            a: 1,
            b: 2,
            c: {
                c1: 1,
                c2: 4,
            },
        },
        filter: undefined,
        result: true,
    },
    {
        testName: 'reducerUtils.observeChanges deep change with filter on wrong field',
        prev: {
            a: 1,
            b: 2,
            c: {
                c1: 1,
                c2: 2,
            },
        },
        current: {
            a: 1,
            b: 2,
            c: {
                c1: 1,
                c2: 4,
            },
        },
        filter: { c: ['c1'] },
        result: false,
    },
    {
        testName: 'reducerUtils.observeChanges array no change',
        prev: [1],
        current: [1],
        filter: undefined,
        result: false,
    },
    {
        testName: 'reducerUtils.observeChanges array with changed length',
        prev: [],
        current: [1],
        filter: undefined,
        result: true,
    },
    {
        testName: 'reducerUtils.observeChanges array with changed value',
        prev: [0],
        current: [1],
        filter: undefined,
        result: true,
    },
    {
        testName: 'reducerUtils.observeChanges different types',
        prev: 1,
        current: [1],
        filter: undefined,
        result: true,
    },
    {
        testName: 'reducerUtils.observeChanges object keys different lengths',
        prev: { key1: 1 },
        current: { key1: 1, key2: 2 },
        filter: undefined,
        result: true,
    },
    {
        testName: 'reducerUtils.observeChanges object keys same lengths but different keys',
        prev: { key1: 1 },
        current: { key2: 2 },
        filter: undefined,
        result: true,
    },
    {
        testName: 'reducerUtils.observeChanges different strings',
        prev: 'a',
        current: 'b',
        filter: undefined,
        result: true,
    },
    {
        testName: 'reducerUtils.observeChanges same strings',
        prev: 'a',
        current: 'a',
        filter: undefined,
        result: false,
    },
    {
        testName: 'reducerUtils.observeChanges different numbers',
        prev: 1,
        current: 2,
        filter: undefined,
        result: true,
    },
    {
        testName: 'reducerUtils.observeChanges same numbers',
        prev: 1,
        current: 1,
        filter: undefined,
        result: false,
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
