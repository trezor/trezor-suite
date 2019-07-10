import xrpAccount from './accounts/ripple/rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj';

export default {
    blockbook: [
        {
            description: 'Empty ETH account',
            params: {
                descriptor: '0x1e6E3708a059aEa1241a81c7aAe84b6CDbC54d59',
            },
            serverFixtures: [
                {
                    method: 'getAccountInfo',
                    response: {
                        data: {
                            address: '0x1e6E3708a059aEa1241a81c7aAe84b6CDbC54d59',
                            balance: '0',
                            txs: 0,
                            unconfirmedBalance: '0',
                            unconfirmedTxs: 0,
                            nonce: '0',
                        },
                    },
                },
            ],
            response: {
                descriptor: '0x1e6E3708a059aEa1241a81c7aAe84b6CDbC54d59',
                balance: '0',
                availableBalance: '0',
                history: {
                    total: 0,
                    unconfirmed: 0,
                },
                misc: { nonce: '0' },
            },
        },
        {
            description: 'Empty BTC account',
            params: {
                descriptor:
                    'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
            },
            serverFixtures: [
                {
                    method: 'getAccountInfo',
                    response: {
                        data: {
                            address:
                                'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
                            balance: '0',
                            totalSent: '0',
                            totalReceived: '0',
                            txs: 0,
                            unconfirmedBalance: '0',
                            unconfirmedTxs: 0,
                        },
                    },
                },
            ],
            response: {
                descriptor:
                    'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
                balance: '0',
                availableBalance: '0',
                history: {
                    total: 0,
                    unconfirmed: 0,
                },
            },
        },
    ],
    ripple: [
        {
            description: 'Empty XRP account',
            params: {
                descriptor: 'rNpM6NUAdqWvmDpB22PJ7AHTrN6nkwEEpS',
            },
            response: {
                descriptor: 'rNpM6NUAdqWvmDpB22PJ7AHTrN6nkwEEpS',
                balance: '0',
                availableBalance: '0',
                history: {
                    tokens: 0,
                    total: 0,
                    unconfirmed: 0,
                },
                misc: {
                    reserve: '20000000',
                    sequence: 0,
                },
                tokens: [],
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
                availableBalance: '20000000',
                history: {
                    tokens: 0,
                    total: 0,
                    unconfirmed: 0,
                },
                misc: {
                    reserve: '20000000',
                    sequence: 2,
                },
                tokens: [],
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
                availableBalance: '20000000',
                history: {
                    tokens: 0,
                    total: 0,
                    unconfirmed: 0,
                    transactions: [
                        {
                            type: 'unknown',
                            amount: '0',
                            fee: '0',
                            targets: [],
                            tokens: [],
                        },
                    ],
                },
                misc: {
                    reserve: '20000000',
                    sequence: 2,
                },
                tokens: [],
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
                availableBalance: '20000000',
                history: {
                    tokens: 0,
                    total: 0,
                    unconfirmed: 0,
                    transactions: [
                        {
                            type: 'sent',
                            txid:
                                '33F2085B0EF572376335716521E412CF611C4124B1088E5CCED48A7901CAF95E',
                            blockHeight: 47570158,
                            blockTime: 612363551,
                            blockHash:
                                '33F2085B0EF572376335716521E412CF611C4124B1088E5CCED48A7901CAF95E',
                            amount: '5718112',
                            fee: '12',
                            // total: '5718124',
                            targets: [
                                {
                                    addresses: ['rw62XQr4hLZjiuiq46CWiA6FretVuyZaoG'],
                                    isAddress: true,
                                    amount: '5718112',
                                },
                            ],
                            tokens: [],
                        },
                        {
                            type: 'recv',
                            txid:
                                '533A8A2EDBCE914159C5491429763FD39A1F0F19E0F82800C3B7909B67B166A7',
                            blockHeight: 47455208,
                            blockTime: 611932692,
                            blockHash:
                                '533A8A2EDBCE914159C5491429763FD39A1F0F19E0F82800C3B7909B67B166A7',
                            amount: '25718124',
                            fee: '6000',
                            // total: '25724124',
                            targets: [
                                {
                                    addresses: ['r4eEbLKZGbVSBHnSUBZW8i5XaMjGLdqT4a'],
                                    isAddress: true,
                                    amount: '25718124',
                                },
                            ],
                            tokens: [],
                        },
                    ],
                },
                misc: {
                    reserve: '20000000',
                    sequence: 2,
                },
                tokens: [],
            },
        },
    ],
};
