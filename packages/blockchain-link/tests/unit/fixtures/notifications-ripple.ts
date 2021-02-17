// To avoid unnecessary data this fixtures sends notifications with mostly undefined values
const tx = {
    // amount: undefined,
    // blockHash: undefined,
    // blockHeight: undefined,
    // blockTime: undefined,
    // fee: undefined,
    // txid: undefined,
    totalSpent: '0',
    tokens: [],
    // targets: [],
    details: {
        vin: [],
        vout: [],
        size: 0,
        totalInput: '0',
        totalOutput: '0',
    },
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
        notifications: [
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
        notifications: [
            {
                ledger_hash: 'abcd',
                ledger_index: 1,
                ...block,
            },
            {
                ledger_hash: 'efgh',
                ledger_index: 2,
                delay: 100,
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
        notifications: [
            {
                ledger_hash: 'abcd',
                ledger_index: 1,
                ...block,
            },
            {
                ledger_hash: 'efgh',
                ledger_index: 2,
                delay: 100,
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
        notifications: {
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
                targets: [{ addresses: ['B'], isAddress: true, n: 0 }],
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
        notifications: {
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
                targets: [{ addresses: ['A'], isAddress: true, n: 0 }],
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
        notifications: {
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
        notifications: {
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
                targets: [{ addresses: ['B'], isAddress: true, n: 0 }],
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
        notifications: {
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
                targets: [{ addresses: ['C'], isAddress: true, n: 0 }],
            },
        },
    },
];

export default {
    notifyBlocks,
    notifyAddresses,
};
