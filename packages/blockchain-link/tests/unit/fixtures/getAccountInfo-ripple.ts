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
                reserve: '10000000',
                sequence: 0,
            },
        },
        error: undefined,
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
            availableBalance: '10000000',
            empty: false,
            history: {
                total: -1,
                unconfirmed: 0,
            },
            misc: {
                reserve: '10000000',
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
            availableBalance: '10000000',
            empty: false,
            history: {
                total: -1,
                unconfirmed: 0,
                transactions: [
                    {
                        type: 'unknown',
                        targets: [],
                        internalTransfers: [],
                        tokens: [],
                        details: {
                            vin: [],
                            vout: [],
                            size: 0,
                            totalInput: '0',
                            totalOutput: '0',
                        },
                        rippleSpecific: { destinationTag: undefined },
                    },
                ],
            },
            misc: {
                reserve: '10000000',
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
            availableBalance: '10000000',
            empty: false,
            history: {
                total: -1,
                unconfirmed: 1,
            },
            misc: {
                reserve: '10000000',
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
            availableBalance: '10000000',
            empty: false,
            history: {
                total: -1,
                unconfirmed: 0,
                transactions: [
                    {
                        type: 'sent',
                        txid: '33F2085B0EF572376335716521E412CF611C4124B1088E5CCED48A7901CAF95E',
                        blockHeight: 47570158,
                        blockTime: 1559048351,
                        blockHash:
                            '33F2085B0EF572376335716521E412CF611C4124B1088E5CCED48A7901CAF95E',
                        amount: '5718112',
                        fee: '12',
                        targets: [
                            {
                                addresses: ['rw62XQr4hLZjiuiq46CWiA6FretVuyZaoG'],
                                isAddress: true,
                                amount: '5718112',
                                n: 0,
                            },
                        ],
                        tokens: [],
                        internalTransfers: [],
                        details: {
                            vin: [],
                            vout: [],
                            size: 0,
                            totalInput: '0',
                            totalOutput: '0',
                        },
                        rippleSpecific: { destinationTag: undefined },
                    },
                    {
                        type: 'recv',
                        txid: '533A8A2EDBCE914159C5491429763FD39A1F0F19E0F82800C3B7909B67B166A7',
                        blockHeight: 47455208,
                        blockTime: 1558617492,
                        blockHash:
                            '533A8A2EDBCE914159C5491429763FD39A1F0F19E0F82800C3B7909B67B166A7',
                        amount: '25718124',
                        fee: '6000',
                        targets: [
                            {
                                addresses: ['rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj'],
                                isAddress: true,
                                amount: '25718124',
                                n: 0,
                            },
                        ],
                        tokens: [],
                        internalTransfers: [],
                        details: {
                            vin: [],
                            vout: [],
                            size: 0,
                            totalInput: '0',
                            totalOutput: '0',
                        },
                        rippleSpecific: { destinationTag: undefined },
                    },
                ],
            },
            misc: {
                reserve: '10000000',
                sequence: 2,
            },
        },
    },
    {
        description: 'With missing destination',
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
                                meta: {
                                    TransactionResult: 'tecDST_TAG_NEEDED',
                                },
                                tx: {
                                    Account: 'r4eEbLKZGbVSBHnSUBZW8i5XaMjGLdqT4a',
                                    Amount: '25718124',
                                    Destination: 'rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj',
                                    Fee: '6000',
                                    Flags: 2147483648,
                                    LastLedgerSequence: 47457602,
                                    Sequence: 157331,
                                    SigningPubKey:
                                        '038CF47114672A12B269AEE015BF7A8438609B994B0640E4B28B2F56E93D948B15',
                                    TransactionType: 'Payment',
                                    TxnSignature:
                                        '30440220665BEB140619A36C737929487519B862D1592225568CBEBC248972AD8453D8EE0220020852427CE83EC4BD8A5BFB48B7DA573FFC042A1E3BE9A513FC04F3C3D45B12',
                                    date: 611932692,
                                    hash: '533A8A2EDBCE914159C5491429763FD39A1F0F19E0F82800C3B7909B67B166A7',
                                    inLedger: 47455208,
                                    ledger_index: 47455208,
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
            availableBalance: '10000000',
            empty: false,
            history: {
                total: -1,
                unconfirmed: 0,
                transactions: [
                    {
                        type: 'failed',
                        txid: '533A8A2EDBCE914159C5491429763FD39A1F0F19E0F82800C3B7909B67B166A7',
                        amount: '25718124',
                        fee: '6000',
                        blockTime: 1558617492,
                        blockHeight: 47455208,
                        blockHash:
                            '533A8A2EDBCE914159C5491429763FD39A1F0F19E0F82800C3B7909B67B166A7',
                        targets: [
                            {
                                addresses: ['rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj'],
                                isAddress: true,
                                amount: '25718124',
                                n: 0,
                            },
                        ],
                        tokens: [],
                        internalTransfers: [],
                        feeRate: undefined,
                        details: {
                            vin: [],
                            vout: [],
                            size: 0,
                            totalInput: '0',
                            totalOutput: '0',
                        },
                        rippleSpecific: { destinationTag: undefined },
                    },
                ],
            },
            misc: { sequence: 2, reserve: '10000000' },
            marker: undefined,
        },
    },
];
