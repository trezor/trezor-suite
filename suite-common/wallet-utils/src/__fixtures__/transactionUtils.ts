import { type WalletAccountTransaction, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type TokenTransfer, type TransferType } from '@trezor/blockchain-link-types';
import { type AccountTransaction } from '@trezor/connect';

import { TXS } from './transactions';

export const token: TokenTransfer = {
    type: 'sent' as TransferType,
    from: 'A',
    to: 'B',
    name: 'Token name',
    symbol: 'TKNNME',
    amount: '1',
    decimals: 0,
    contract: '0x0',
};

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
            { blockHeight: undefined, blockHash: undefined, txid: '0500' },
            { blockHeight: 4, blockHash: '04', txid: '0400' },
            { blockHeight: 3, blockHash: '03', txid: '0300' },
        ],
        known: [
            { blockHeight: 2, blockHash: '02', txid: '0202' },
            { blockHeight: 2, blockHash: '02', txid: '0201' },
            { blockHeight: 1, blockHash: '01', txid: '0100' },
        ],
        result: {
            newTransactions: [
                { blockHeight: 4, blockHash: '04', txid: '0400' },
                { blockHeight: 3, blockHash: '03', txid: '0300' },
            ],
            add: [
                { blockHeight: undefined, blockHash: undefined, txid: '0500' },
                { blockHeight: 4, blockHash: '04', txid: '0400' },
                { blockHeight: 3, blockHash: '03', txid: '0300' },
            ],
            remove: [
                { blockHeight: 2, blockHash: '02', txid: '0202' },
                { blockHeight: 2, blockHash: '02', txid: '0201' },
                { blockHeight: 1, blockHash: '01', txid: '0100' },
            ],
        },
    },
    {
        description: 'rollback on second known block + 2 new txs',
        fresh: [
            { blockHeight: undefined, blockHash: '04aa', txid: '04aa01' },
            { blockHeight: 4, blockHash: '04', txid: '0400' },
            { blockHeight: 3, blockHash: '03aa', txid: '03aa00' }, // NOTE: blockHash is different than known
            { blockHeight: 2, blockHash: '02', txid: '0202' },
            { blockHeight: 2, blockHash: '02', txid: '0201' },
        ],
        known: [
            { blockHeight: 3, blockHash: '03', txid: '0300' },
            { blockHeight: 2, blockHash: '02', txid: '0202' },
            { blockHeight: 2, blockHash: '02', txid: '0201' },
            { blockHeight: 1, blockHash: '01', txid: '0100' },
        ],
        result: {
            newTransactions: [{ blockHeight: 4, blockHash: '04', txid: '0400' }],
            add: [
                { blockHeight: undefined, blockHash: '04aa', txid: '04aa01' },
                { blockHeight: 4, blockHash: '04', txid: '0400' },
                { blockHeight: 3, blockHash: '03aa', txid: '03aa00' },
            ],
            remove: [{ blockHeight: 3, blockHash: '03', txid: '0300' }],
        },
    },
    {
        description:
            'rollback, BOTTOM page intersection not satisfied, block bellow could be affected as well',
        fresh: [
            { blockHeight: 4, blockHash: '04aa', txid: '04aa00' },
            { blockHeight: 3, blockHash: '03aa', txid: '03aa01' },
            { blockHeight: 3, blockHash: '03aa', txid: '03aa00' },
        ],
        known: [
            { blockHeight: 4, blockHash: '04', txid: '0400' },
            { blockHeight: 3, blockHash: '03', txid: '0300' },
            { blockHeight: 2, blockHash: '02', txid: '0202' },
            { blockHeight: 2, blockHash: '02', txid: '0201' },
            { blockHeight: 1, blockHash: '01', txid: '0100' },
        ],
        result: {
            newTransactions: [{ blockHeight: 3, blockHash: '03aa', txid: '03aa00' }],
            add: [
                { blockHeight: 4, blockHash: '04aa', txid: '04aa00' },
                { blockHeight: 3, blockHash: '03aa', txid: '03aa01' },
                { blockHeight: 3, blockHash: '03aa', txid: '03aa00' },
            ],
            remove: [
                { blockHeight: 4, blockHash: '04', txid: '0400' },
                { blockHeight: 3, blockHash: '03', txid: '0300' },
                { blockHeight: 2, blockHash: '02', txid: '0202' },
                { blockHeight: 2, blockHash: '02', txid: '0201' },
                { blockHeight: 1, blockHash: '01', txid: '0100' },
            ],
        },
    },
];

export const analyzeTransactionsPrepending = [
    {
        description: 'pre-pending becomes confirmed (no confirmed)',
        fresh: [{ blockHeight: 1, blockHash: '1', txid: '1' }],
        known: [{ blockHeight: undefined, blockHash: '1', txid: '1', deadline: 2 }],
        blockHeight: 1,
        result: {
            newTransactions: [{ blockHeight: 1, blockHash: '1', txid: '1' }],
            add: [{ blockHeight: 1, blockHash: '1', txid: '1' }],
            remove: [{ blockHeight: undefined, blockHash: '1', txid: '1', deadline: 2 }],
        },
    },
    {
        description: 'pre-pending stays until deadline is reached (nothing new)',
        fresh: [{ blockHeight: 1, blockHash: '2', txid: '2' }],
        known: [
            { blockHeight: undefined, blockHash: '1', txid: '1', deadline: 2 },
            { blockHeight: 1, blockHash: '2', txid: '2' },
        ],
        blockHeight: 1,
        result: {
            newTransactions: [],
            add: [],
            remove: [],
        },
    },
    {
        description: 'pre-pending stays until deadline is reached (new confirmed tx)',
        fresh: [{ blockHeight: 1, blockHash: '2', txid: '2' }],
        known: [{ blockHeight: undefined, blockHash: '1', txid: '1', deadline: 2 }],
        blockHeight: 1,
        result: {
            newTransactions: [{ blockHeight: 1, blockHash: '2', txid: '2' }],
            add: [{ blockHeight: 1, blockHash: '2', txid: '2' }],
            remove: [],
        },
    },
    {
        description: 'pre-pending stays until deadline is reached (new pending tx)',
        fresh: [{ blockHeight: undefined, blockHash: '2', txid: '2' }],
        known: [{ blockHeight: undefined, blockHash: '1', txid: '1', deadline: 2 }],
        blockHeight: 1,
        result: {
            newTransactions: [],
            add: [{ blockHeight: undefined, blockHash: '2', txid: '2' }],
            remove: [],
        },
    },
    {
        description: 'pre-pending is removed when deadline is exceeded',
        fresh: [{ blockHeight: 1, blockHash: '2', txid: '2' }],
        known: [{ blockHeight: undefined, blockHash: '1', txid: '1', deadline: 1 }],
        blockHeight: 2,
        result: {
            newTransactions: [{ blockHeight: 1, blockHash: '2', txid: '2' }],
            add: [{ blockHeight: 1, blockHash: '2', txid: '2' }],
            remove: [{ blockHeight: undefined, blockHash: '1', txid: '1', deadline: 1 }],
        },
    },
    {
        description: 'pre-pending becomes confirmed (has confirmed tx)',
        fresh: [
            { blockHeight: 3, blockHash: '3', txid: '3' },
            { blockHeight: 1, blockHash: '2', txid: '2' },
        ],
        known: [
            { blockHeight: undefined, blockHash: '3', txid: '3', deadline: 3 },
            { blockHeight: 1, blockHash: '2', txid: '2' },
        ],
        blockHeight: 1,
        result: {
            newTransactions: [{ blockHeight: 3, blockHash: '3', txid: '3' }],
            add: [{ blockHeight: 3, blockHash: '3', txid: '3' }],
            remove: [{ blockHeight: undefined, blockHash: '3', txid: '3', deadline: 3 }],
        },
    },
    {
        description:
            'pre-pending stays until deadline is reached (new pending tx, known confirmed tx)',
        fresh: [{ blockHeight: undefined, blockHash: '3', txid: '3' }],
        known: [
            { blockHeight: undefined, blockHash: '1', txid: '1', deadline: 2 },
            { blockHeight: 1, blockHash: '2', txid: '2' },
        ],
        blockHeight: 1,
        result: {
            newTransactions: [],
            add: [{ blockHeight: undefined, blockHash: '3', txid: '3' }],
            remove: [],
        },
    },
    {
        description: 'pre-pending is removed when deadline is exceeded (known confirmed tx)',
        fresh: [
            { blockHeight: 5, blockHash: '5', txid: '5' },
            { blockHeight: 1, blockHash: '3', txid: '3' },
        ],
        known: [
            { blockHeight: undefined, blockHash: '1', txid: '1', deadline: 1 },
            { blockHeight: 1, blockHash: '3', txid: '3' },
        ],
        blockHeight: 2,
        result: {
            newTransactions: [{ blockHeight: 5, blockHash: '5', txid: '5' }],
            add: [{ blockHeight: 5, blockHash: '5', txid: '5' }],
            remove: [{ blockHeight: undefined, blockHash: '1', txid: '1', deadline: 1 }],
        },
    },
];

export const enhanceTransaction = [
    {
        tx: {
            amount: '123',
            blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
            blockHeight: 590093,
            blockTime: 1565797979,
            fee: '0.00002929',
            totalSpent: '123.00002929',
            targets: [],
            tokens: [
                {
                    contract: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
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
        account: mockWalletAccount({
            deviceState: '1stTestnetAddress@device_id:0',
            descriptor: asAccountDescriptor(
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            ),
            symbol: 'btc',
        }),
        result: {
            amount: '123',
            blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
            blockHeight: 590093,
            blockTime: 1565797979,
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            deviceState: '1stTestnetAddress@device_id:0',
            fee: '0.00002929',
            totalSpent: '123.00002929',
            symbol: 'btc',
            targets: [],
            tokens: [
                {
                    contract: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
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
        account: mockWalletAccount({
            deviceState: '1stTestnetAddress@device_id:0',
            descriptor: asAccountDescriptor(
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            ),
            symbol: 'btc',
        }),
        result: {
            amount: '0.00006497',
            blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
            blockHeight: 590093,
            blockTime: 1565797979,
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            deviceState: '1stTestnetAddress@device_id:0',
            fee: '0.00002929',
            totalSpent: '0.00009426',
            symbol: 'btc',
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
        account: mockWalletAccount({
            deviceState: '1stTestnetAddress@device_id:0',
            descriptor: asAccountDescriptor(
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            ),
            symbol: 'btc',
        }),
        result: {
            amount: '0.00006497',
            blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
            blockHeight: 590093,
            blockTime: 1565797979,
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            deviceState: '1stTestnetAddress@device_id:0',
            fee: '0.00002929',
            totalSpent: '0.00009426',
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
                totalInput: '10000000',
                totalOutput: '10000000',
                size: 255,
            },
        },
    },
];

const CHAINED_TXS = {
    'account1-key': [
        {
            descriptor: 'account1',
            txid: 'ABCD-child-child-child',
            type: 'received', // 3rd
            details: {
                vin: [{ txid: 'ABCD-child-child' }],
            },
        },
        {
            descriptor: 'account1',
            txid: 'ABCD-child-child',
            type: 'sent', // 2nd tx in chain to account 3
            details: {
                vin: [{ txid: 'ABCD-child' }],
            },
        },
        {
            descriptor: 'account1',
            txid: 'ABCD-child',
            type: 'received', // 1st
            details: {
                vin: [{ txid: 'ABCD' }],
            },
        },
    ],
    'account2-key': [
        {
            descriptor: 'account2',
            txid: '4567',
            details: {
                vin: [{ txid: '8910' }],
            },
        },
        {
            descriptor: 'account2',
            txid: 'ABCD-child', // 1st tx in chain to account 1
            type: 'sent',
            details: {
                vin: [{ txid: 'ABCD' }],
            },
        },
    ],
    'account3-key': [
        {
            descriptor: 'account3',
            txid: 'external_txid',
            type: 'sent', // 4th tx in chain spend to somewhere else
            details: {
                vin: [{ txid: 'ABCD-child-child-child' }],
            },
        },
        {
            descriptor: 'account3',
            txid: 'ABCD-child-child-child',
            type: 'sent', // 3rd tx in chain back to account 1
            details: {
                vin: [{ txid: 'ABCD-child-child' }],
            },
        },
        {
            descriptor: 'account3',
            txid: 'ABCD-child-child',
            type: 'received', // 2nd
            details: {
                vin: [{ txid: 'ABCD-child' }],
            },
        },
    ],
};

export const findChainedTransactions = [
    {
        description: 'deeply chained transactions by account 1',
        descriptor: 'account1',
        txid: 'ABCD',
        transactions: CHAINED_TXS,
        result: {
            own: [
                { txid: 'ABCD-child' },
                { txid: 'ABCD-child-child' },
                { txid: 'ABCD-child-child-child' },
            ],
            others: [{ txid: 'external_txid' }],
        },
    },
    {
        description: 'deeply chained transactions by account 2',
        descriptor: 'account2',
        txid: 'ABCD',
        transactions: CHAINED_TXS,
        result: {
            own: [{ txid: 'ABCD-child' }],
            others: [
                { txid: 'ABCD-child-child' },
                { txid: 'ABCD-child-child-child' },
                { txid: 'external_txid' },
            ],
        },
    },
    {
        description: 'last from chained transactions by account 1',
        descriptor: 'account2',
        txid: 'ABCD-child-child-child',
        transactions: CHAINED_TXS,
        result: {
            own: [],
            others: [{ txid: 'external_txid' }],
        },
    },
    {
        description: 'last from chained transactions by account 3',
        descriptor: 'account3',
        txid: 'ABCD-child-child-child',
        transactions: CHAINED_TXS,
        result: {
            own: [{ txid: 'external_txid' }],
            others: [],
        },
    },
    {
        description: 'no results',
        descriptor: 'account3',
        txid: 'external_txid',
        transactions: CHAINED_TXS,
        result: undefined,
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
                        isAddress: true,
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
                        isAddress: true,
                        addresses: ['xyz0'],
                    },
                ],
            },
        },
        result: {
            type: 'bitcoin',
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
                    required: true,
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
                        isAddress: true,
                        addresses: ['xyz0'],
                    },
                    {
                        isAddress: true,
                        addresses: ['1234'],
                    },
                ],
            },
        },
        result: {
            type: 'bitcoin',
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
                    required: true,
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
    {
        description: 'with OP_RETURN output',
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
                        isAddress: true,
                        addresses: ['xyz0'],
                    },
                    {
                        isAddress: false,
                        addresses: ['OP_RETURN (foobar)'],
                    },
                    {
                        isAddress: true,
                        addresses: ['1234'],
                    },
                ],
            },
        },
        result: {
            type: 'bitcoin',
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
                    required: true,
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
                    type: 'opreturn',
                    dataAscii: 'foobar',
                    dataHex: '666f6f626172',
                },
                {
                    type: 'change',
                    address: '1234',
                },
            ],
        },
    },
];

export const getAccountTransactions = [
    {
        testName: 'BTC account, 2txs',
        transactions: TXS,
        account: mockWalletAccount({
            deviceState: '1stTestnetAddress@device_id:0',
            descriptor: asAccountDescriptor(
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            ),
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
                deviceState: '1stTestnetAddress@device_id:0',
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
                deviceState: '1stTestnetAddress@device_id:0',
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
        account: mockWalletAccount({
            deviceState: '1stTestnetAddress@device_id:0',
            descriptor: asAccountDescriptor('rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H'),
            symbol: 'txrp',
        }),
        result: [
            {
                descriptor: 'rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H',
                deviceState: '1stTestnetAddress@device_id:0',
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
                deviceState: '1stTestnetAddress@device_id:0',
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
        account: mockWalletAccount({
            deviceState: '1stTestnetAddress@device_id:0',
            descriptor: asAccountDescriptor('0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15'),
            symbol: 'eth',
        }),
        result: [
            {
                descriptor: '0xFA01a39f8Abaeb660c3137f14A310d0b414b2A15',
                deviceState: '1stTestnetAddress@device_id:0',
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
                deviceState: '1stTestnetAddress@device_id:0',
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
                deviceState: '1stTestnetAddress@device_id:0',
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
                        contract: '0xa74476443119a942de498590fe1f2454d7d4ac0d',
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
                deviceState: '1stTestnetAddress@device_id:0',
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
                deviceState: '1stTestnetAddress@device_id:0',
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
                        contract: '0xa74476443119a942de498590fe1f2454d7d4ac0d',
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
        account: mockWalletAccount({
            deviceState: '1stTestnetAddress@device_id:0',
            descriptor: asAccountDescriptor('0xf69619a3dCAA63757A6BA0AF3628f5F6C42c50d2'),
            symbol: 'eth',
        }),
        result: [],
    },
];

export const isPending: Record<string, WalletAccountTransaction | AccountTransaction> = {
    'Sent and confirmed transaction': {
        amount: '123',
        blockHash: '00000000000000000017277948d61a631dae6cce1d7fb501301b825599189f51',
        blockHeight: 590093,
        blockTime: 1565797979,
        descriptor: asAccountDescriptor(
            'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
        ),
        deviceState: '1stTestnetAddress@device_id:0',
        fee: '0.00002929',
        symbol: 'btc',
        targets: [],
        tokens: [
            {
                contract: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
                amount: '10',
                decimals: 18,
                from: '0x75e68d3b6acd23e79e395fa627ae5cae605c03d3',
                name: 'Decentraland MANA',
                symbol: 'MANA',
                to: '0x73d0385f4d8e00c5e6504c6030f47bf6212736a8',
                type: 'recv',
            },
        ],
        internalTransfers: [],
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
    'Received and pending transaction': {
        descriptor: asAccountDescriptor(
            'vpub5YoEd2jJofNDXriAXpt4fyX23uRhrViFG3721C1wRRKUvDS4P6St7tqFfDP4JZsRARVhaVcGvW5jerdWBVc1c3fgqZeAYt29QSTiafKdwck',
        ),
        deviceState: 'mvAmt1x3QTsSmJrR4tbPtMpYnLbi3gDEBu@912734FCB107274D3CC465EC:1',
        symbol: 'test',
        type: 'recv',
        txid: '70ad253c25aa8a76ebcdb7fded56f2f57ec9b40967b7e79937b4f44445968c93',
        blockTime: 1665050077,
        blockHeight: -1,
        lockTime: 2349585,
        amount: '68000',
        fee: '141',
        targets: [
            {
                n: 1,
                addresses: ['tb1qdu4etzzpr3hqqkrqntpq32e8xjkeupajtarefl'],
                isAddress: true,
                amount: '68000',
                isAccountTarget: true,
            },
        ],
        tokens: [],
        internalTransfers: [],
        details: {
            vin: [
                {
                    txid: '8706ebd38ba68854681be404d2d65c151ba5f9b4367c7de93883edc311592102',
                    sequence: 4294967294,
                    n: 0,
                    addresses: ['tb1qej4prrnz7tw0f8g0duml87zks87dzl6q5rkthj'],
                    isAddress: true,
                    value: '34670643640',
                },
            ],
            vout: [
                {
                    value: '34670575499',
                    n: 0,
                    hex: '0014702701c3bd74fbea593686ea1eae555a1a20cd28',
                    addresses: ['tb1qwqnsrsaawna75kfksm4patj4tgdzpnfgmm8hnc'],
                    isAddress: true,
                },
                {
                    value: '68000',
                    n: 1,
                    hex: '00146f2b9588411c6e0058609ac208ab2734ad9e07b2',
                    addresses: ['tb1qdu4etzzpr3hqqkrqntpq32e8xjkeupajtarefl'],
                    isAddress: true,
                    isAccountOwned: true,
                },
            ],
            size: 222,
            totalInput: '34670643640',
            totalOutput: '34670643499',
        },
    },
};
