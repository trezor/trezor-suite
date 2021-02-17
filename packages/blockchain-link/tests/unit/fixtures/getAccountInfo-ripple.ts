// @ts-ignore idk why t reports warning, resolveJsonModule is already set, TODO: investigate
import * as xrpAccount from './accounts/ripple/rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj.json';

export default [
    {
        description: 'Empty XRP account',
        params: {
            descriptor: 'rNpM6NUAdqWvmDpB22PJ7AHTrN6nkwEEpS',
        },
        response: {
            descriptor: 'rNpM6NUAdqWvmDpB22PJ7AHTrN6nkwEEpS',
            balance: '0',
            availableBalance: '0',
            empty: true,
            history: {
                total: -1,
                unconfirmed: 0,
            },
            misc: {
                reserve: '20000000',
                sequence: 0,
            },
        },
    },
    {
        description: 'Basic info',
        params: {
            descriptor: 'rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj',
        },
        serverFixtures: [
            {
                method: 'account_info',
                response: xrpAccount.account_info.validated,
            },
            {
                method: 'account_info',
                response: xrpAccount.account_info.current,
            },
        ],
        response: {
            descriptor: 'rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj',
            balance: '20000000',
            availableBalance: '0',
            empty: false,
            history: {
                total: -1,
                unconfirmed: 0,
            },
            misc: {
                reserve: '20000000',
                sequence: 2,
            },
        },
    },
    {
        description: 'With unknown transaction',
        params: {
            descriptor: 'rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj',
            details: 'txs',
        },
        serverFixtures: [
            {
                method: 'account_info',
                response: xrpAccount.account_info.validated,
            },
            {
                method: 'account_info',
                response: xrpAccount.account_info.current,
            },
            {
                method: 'account_tx',
                response: {
                    status: 'success',
                    type: 'response',
                    result: {
                        account: 'rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj',
                        transactions: [
                            {
                                tx: {
                                    TransactionType: 'Not-a-Payment',
                                },
                            },
                        ],
                    },
                },
            },
        ],
        response: {
            descriptor: 'rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj',
            balance: '20000000',
            availableBalance: '0',
            empty: false,
            history: {
                total: -1,
                unconfirmed: 0,
                transactions: [
                    {
                        type: 'unknown',
                        amount: '0',
                        fee: '0',
                        totalSpent: '0',
                        targets: [],
                        tokens: [],
                        details: {
                            vin: [],
                            vout: [],
                            size: 0,
                            totalInput: '0',
                            totalOutput: '0',
                        },
                    },
                ],
            },
            misc: {
                reserve: '20000000',
                sequence: 2,
            },
        },
    },
    {
        description: 'With pending transaction',
        params: {
            descriptor: 'rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj',
        },
        serverFixtures: [
            {
                method: 'account_info',
                response: xrpAccount.account_info.validated,
            },
            {
                method: 'account_info',
                response: xrpAccount.account_info.pending,
            },
        ],
        response: {
            descriptor: 'rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj',
            balance: '20000000',
            availableBalance: '0',
            empty: false,
            history: {
                total: -1,
                unconfirmed: 1,
            },
            misc: {
                reserve: '20000000',
                sequence: 2,
            },
        },
    },
    {
        description: 'With full transaction history',
        params: {
            descriptor: 'rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj',
            details: 'txs',
        },
        serverFixtures: [
            {
                method: 'account_info',
                response: xrpAccount.account_info.validated,
            },
            {
                method: 'account_info',
                response: xrpAccount.account_info.current,
            },
            {
                method: 'account_tx',
                response: xrpAccount.account_tx,
            },
        ],
        response: {
            descriptor: 'rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj',
            balance: '20000000',
            availableBalance: '0',
            empty: false,
            history: {
                total: -1,
                unconfirmed: 0,
                transactions: [
                    {
                        type: 'sent',
                        txid: '33F2085B0EF572376335716521E412CF611C4124B1088E5CCED48A7901CAF95E',
                        blockHeight: 47570158,
                        blockTime: 612363551,
                        blockHash:
                            '33F2085B0EF572376335716521E412CF611C4124B1088E5CCED48A7901CAF95E',
                        amount: '5718112',
                        fee: '12',
                        totalSpent: '5718124',
                        targets: [
                            {
                                addresses: ['rw62XQr4hLZjiuiq46CWiA6FretVuyZaoG'],
                                isAddress: true,
                                amount: '5718112',
                                n: 0,
                            },
                        ],
                        tokens: [],
                        details: {
                            vin: [],
                            vout: [],
                            size: 0,
                            totalInput: '0',
                            totalOutput: '0',
                        },
                    },
                    {
                        type: 'recv',
                        txid: '533A8A2EDBCE914159C5491429763FD39A1F0F19E0F82800C3B7909B67B166A7',
                        blockHeight: 47455208,
                        blockTime: 611932692,
                        blockHash:
                            '533A8A2EDBCE914159C5491429763FD39A1F0F19E0F82800C3B7909B67B166A7',
                        amount: '25718124',
                        fee: '6000',
                        totalSpent: '25724124',
                        targets: [
                            {
                                addresses: ['rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj'],
                                isAddress: true,
                                amount: '25718124',
                                n: 0,
                            },
                        ],
                        tokens: [],
                        details: {
                            vin: [],
                            vout: [],
                            size: 0,
                            totalInput: '0',
                            totalOutput: '0',
                        },
                    },
                ],
            },
            misc: {
                reserve: '20000000',
                sequence: 2,
            },
        },
    },
];
