// To avoid unnecessary data this fixtures sends notifications with mostly undefined values
const tx = {
    amount: '100',
    blockHash: 'abcd',
    txid: 'abcd',
    // blockHeight: undefined,
    blockTime: 0,
    // fee: undefined,
    // txid: undefined,
    internalTransfers: [],
    tokens: [],
    fee: '0',
    // targets: [],
    details: {
        vin: [],
        vout: [],
        size: 0,
        totalInput: '0',
        totalOutput: '0',
    },
};

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
        notificationsCount: 1,
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
        notificationsCount: 2,
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
        notificationsCount: 0,
        result: undefined,
    },
] as const;

const notifyAddresses = [
    {
        description: 'address tx notification (sent)',
        method: 'subscribe',
        params: {
            type: 'addresses',
            addresses: ['A'],
        },
        notifications: {
            hash: 'abcd',
            tx_json: {
                Account: 'A',
                Destination: 'B',
                TransactionType: 'Payment',
                DeliverMax: '100',
                DestinationTag: '123',
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
                        n: 0,
                        amount: '100',
                    },
                ],
                rippleSpecific: {
                    destinationTag: '123',
                },
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
            hash: 'abcd',
            tx_json: {
                Account: 'B',
                Destination: 'A',
                TransactionType: 'Payment',
                DeliverMax: '100',
                DestinationTag: '123',
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
                targets: [
                    {
                        addresses: ['A'],
                        isAddress: true,
                        n: 0,
                        amount: '100',
                    },
                ],
                rippleSpecific: {
                    destinationTag: '123',
                },
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
            hash: 'abcd',
            tx_json: {
                TransactionType: 'Not-A-Payment',
            },
            type: 'transaction',
            validated: true,
        },
        result: undefined,
    },
    {
        description: 'account tx notification (sent)',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [{ descriptor: 'C' }],
        },
        notifications: {
            hash: 'abcd',
            tx_json: {
                Account: 'C',
                Destination: 'B',
                TransactionType: 'Payment',
                DeliverMax: '100',
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
                targets: [{ addresses: ['B'], isAddress: true, n: 0, amount: '100' }],
                rippleSpecific: {},
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
            hash: 'abcd',
            tx_json: {
                Account: 'B',
                Destination: 'C',
                TransactionType: 'Payment',
                DeliverMax: '100',
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
                targets: [{ addresses: ['C'], isAddress: true, n: 0, amount: '100' }],
                rippleSpecific: {},
            },
        },
    },
] as const;

export default {
    notifyBlocks,
    notifyAddresses,
};
