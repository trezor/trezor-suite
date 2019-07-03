// To avoid unnecessary data this fixtures sends notifications with mostly undefined values
const tx = {
    // amount: undefined,
    // blockHash: undefined,
    // blockHeight: undefined,
    // blockTime: undefined,
    // fee: undefined,
    // txid: undefined,
    tokens: [],
    // targets: [],
};
// const target = {
//     addresses: [],
//     amount: undefined,
//     coinbase: undefined,
//     isAddress: undefined,
// };

const block = {
    fee_base: 1,
    fee_ref: 1,
    ledger_time: 0,
    reserve_base: 0,
    reserve_inc: 0,
    txn_count: 0,
    type: 'ledgerClosed',
    validated_ledgers: '0-1',
};

const notifyBlocks = [
    {
        description: 'single block notification',
        method: 'subscribe',
        server: [
            {
                ledger_hash: 'abcd',
                ledger_index: 1,
                ...block,
            },
        ],
        result: {
            blockHash: 'abcd',
            blockHeight: 1,
        },
    },
    {
        description: 'multiple block notifications',
        method: 'subscribe',
        server: [
            {
                ledger_hash: 'abcd',
                ledger_index: 1,
                ...block,
            },
            {
                ledger_hash: 'efgh',
                ledger_index: 2,
                ...block,
            },
        ],
        result: {
            blockHash: 'efgh',
            blockHeight: 2,
        },
    },
    {
        description: 'server send notifications after unsubscribe',
        method: 'unsubscribe',
        server: [
            {
                ledger_hash: 'abcd',
                ledger_index: 1,
                ...block,
            },
            {
                ledger_hash: 'efgh',
                ledger_index: 2,
                ...block,
            },
        ],
        result: undefined,
    },
];

const notifyAddresses = [
    {
        description: 'address tx notification (sent)',
        method: 'subscribe',
        params: {
            type: 'addresses',
            addresses: ['A'],
        },
        server: {
            transaction: {
                Account: 'A',
                Destination: 'B',
                TransactionType: 'Payment',
            },
            Account: 'A',
            type: 'transaction',
            validated: true,
        },

        result: {
            descriptor: 'A',
            tx: {
                ...tx,
                type: 'sent',
                targets: [
                    {
                        addresses: ['B'],
                        isAddress: true,
                    },
                ],
            },
        },
    },
    {
        description: 'address tx notification (recv)',
        method: 'subscribe',
        params: {
            type: 'addresses',
            addresses: ['A'],
        },
        server: {
            transaction: {
                Account: 'B',
                Destination: 'A',
                TransactionType: 'Payment',
            },
            Account: 'A',
            type: 'transaction',
            validated: true,
        },
        result: {
            descriptor: 'A',
            tx: {
                ...tx,
                type: 'recv',
                targets: [{ addresses: ['B'], isAddress: true }],
            },
        },
    },
    {
        description: 'address tx notification (unknown)',
        method: 'subscribe',
        params: {
            type: 'addresses',
            addresses: ['A'],
        },
        server: {
            transaction: {
                TransactionType: 'Not-A-Payment',
            },
            type: 'transaction',
            validated: true,
        },
    },
    {
        description: 'account tx notification (sent)',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [{ descriptor: 'C' }],
        },
        server: {
            transaction: {
                Account: 'C',
                Destination: 'B',
                TransactionType: 'Payment',
            },
            Account: 'C',
            type: 'transaction',
            validated: true,
        },

        result: {
            descriptor: 'C',
            tx: {
                ...tx,
                type: 'sent',
                targets: [
                    {
                        addresses: ['B'],
                        isAddress: true,
                    },
                ],
            },
        },
    },
    {
        description: 'account tx notification (recv)',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [{ descriptor: 'C' }],
        },
        server: {
            transaction: {
                Account: 'B',
                Destination: 'C',
                TransactionType: 'Payment',
            },
            Account: 'C',
            type: 'transaction',
            validated: true,
        },

        result: {
            descriptor: 'C',
            tx: {
                ...tx,
                type: 'recv',
                targets: [
                    {
                        addresses: ['B'],
                        isAddress: true,
                    },
                ],
            },
        },
    },
];

const subscribedAddresses = [
    {
        description: 'clear all addresses from the previous part of the test',
        method: 'unsubscribe',
        params: {
            type: 'addresses',
            addresses: undefined,
        },
        subscribed: undefined,
    },
    {
        description: 'add first address',
        method: 'subscribe',
        params: {
            type: 'addresses',
            addresses: ['A'],
        },
        subscribed: ['A'],
    },
    {
        description: 'add second address',
        method: 'subscribe',
        params: {
            type: 'addresses',
            addresses: ['B'],
        },
        subscribed: ['A', 'B'],
    },
    {
        description: 'try to add duplicate of first address',
        method: 'subscribe',
        params: {
            type: 'addresses',
            addresses: ['A'],
        },
        subscribed: ['A', 'B'],
    },
    {
        description: 'remove first address',
        method: 'unsubscribe',
        params: {
            type: 'addresses',
            addresses: ['A'],
        },
        subscribed: ['B'],
    },
    {
        description: 'try to remove first address again',
        method: 'unsubscribe',
        params: {
            type: 'addresses',
            addresses: ['A'],
        },
        subscribed: ['B'],
    },
    {
        description: 'add 3 more addresses (and few invalid)',
        method: 'subscribe',
        params: {
            type: 'addresses',
            addresses: ['X', 'Y', 'Z', 'X', {}, 1, () => {}],
        },
        subscribed: ['B', 'X', 'Y', 'Z'],
    },
    {
        description: 'remove all addresses',
        method: 'unsubscribe',
        params: {
            type: 'addresses',
            addresses: undefined,
        },
        subscribed: undefined,
    },
    {
        description: 'add one address (permanently subscribed)',
        method: 'subscribe',
        params: {
            type: 'addresses',
            addresses: ['1'],
        },
        subscribed: ['1'],
    },
    // now working with accounts
    {
        description: 'add first account',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [{ descriptor: 'A' }],
        },
        subscribed: ['1', 'A'],
    },
    {
        description: 'try to add duplicate of first account',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [{ descriptor: 'A' }],
        },
        subscribed: ['1', 'A'],
    },
    {
        description: 'remove first account',
        method: 'unsubscribe',
        params: {
            type: 'accounts',
            accounts: [{ descriptor: 'A' }],
        },
        subscribed: ['1'],
    },
    {
        description: 'try to remove first account again',
        method: 'unsubscribe',
        params: {
            type: 'accounts',
            accounts: [{ descriptor: 'A' }],
        },
        subscribed: ['1'],
    },
    {
        description: 'add 2 more accounts (and few invalid)',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [
                { descriptor: 'X' },
                { descriptor: 'Y' },
                { descriptor: 'X' },
                null,
                {},
                1,
                () => {},
            ],
        },
        subscribed: ['1', 'X', 'Y'],
    },
    {
        description: 'remove second account',
        method: 'unsubscribe',
        params: {
            type: 'accounts',
            accounts: [{ descriptor: 'X' }],
        },

        subscribed: ['1', 'Y'],
    },
    {
        description: 'remove all accounts (permanently added address remains)',
        method: 'unsubscribe',
        params: {
            type: 'accounts',
            accounts: undefined,
        },
        subscribed: ['1'],
    },
    {
        description: 'add some account again',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [{ descriptor: 'A' }],
        },
        subscribed: ['1', 'A'],
    },
    {
        description: 'remove all accounts and addresses',
        method: 'unsubscribe',
        params: {
            type: 'addresses',
            addresses: undefined,
        },
        subscribed: undefined,
    },
    {
        description: 'add some account again (subscription is not registered)',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [{ descriptor: 'A' }],
        },
        subscribed: ['A'],
    },
    {
        description: 'remove account (subscription is removed)',
        method: 'unsubscribe',
        params: {
            type: 'accounts',
            accounts: undefined,
        },
        subscribed: undefined,
    },

    // {
    //     description: 'add account subscription (invalid accounts param type)',
    //     method: 'subscribe',
    //     params: {
    //         type: 'accounts',
    //         accounts: 1,
    //     },
    //     subscribed: undefined,
    // },
];

const subscribeErrors = [
    {
        description: 'subscribe (invalid "type" parameter)',
        method: 'subscribe',
        params: {
            type: 'unknown',
        },
        error: 'Invalid parameter: type',
    },
    {
        description: 'unsubscribe (invalid "type" parameter)',
        method: 'unsubscribe',
        params: {
            type: 'unknown',
        },
        error: 'Invalid parameter: type',
    },
    {
        description: 'account subscription (invalid "accounts" parameter)',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: 1,
        },
        error: 'Invalid parameter: accounts',
    },
    {
        description: 'address subscription (invalid "addresses" parameter)',
        method: 'subscribe',
        params: {
            type: 'addresses',
            addresses: 1,
        },
        error: 'Invalid parameter: addresses',
    },
    {
        description: 'account unsubscription (invalid "accounts" parameter)',
        method: 'unsubscribe',
        params: {
            type: 'accounts',
            accounts: 1,
        },
        error: 'Invalid parameter: accounts',
    },
    {
        description: 'address unsubscription (invalid "addresses" parameter)',
        method: 'unsubscribe',
        params: {
            type: 'addresses',
            addresses: 1,
        },
        error: 'Invalid parameter: addresses',
    },
    // {
    //     description: 'subscribe (server error)',
    //     method: 'subscribe',
    //     server: { method: 'subscribe', response: { error: { message: 'Error msg' } } },
    //     params: {
    //         type: 'addresses',
    //         addresses: ['A'],
    //     },
    //     error: 'Error msg',
    // },
    // {
    //     description: 'unsubscribe (server error)',
    //     method: 'unsubscribe',
    //     server: { method: 'unsubscribe', response: { error: { message: 'Error msg' } } },
    //     params: {
    //         type: 'addresses',
    //         addresses: ['A'],
    //     },
    //     error: 'Error msg',
    // },
];

export default {
    notifyBlocks,
    notifyAddresses,
    subscribedAddresses,
    subscribeErrors,
};
