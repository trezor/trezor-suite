// To avoid unnecessary data this fixtures sends notifications with mostly undefined values
const tx = {
    // amount: undefined,
    // blockHash: undefined,
    // blockHeight: undefined,
    // blockTime: undefined,
    // fee: undefined,
    // txid: undefined,
    internalTransfers: [],
    tokens: [],
    targets: [],
};
// const target = {
//     addresses: [],
//     amount: undefined,
//     coinbase: undefined,
//     isAddress: undefined,
// };

const notifyBlocks = [
    {
        description: 'single block notification',
        method: 'subscribe',
        notifications: [
            {
                id: '0',
                data: { hash: 'abcd', height: 1 },
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
                id: '0',
                data: { hash: 'abcd', height: 1 },
            },
            {
                id: '0',
                delay: 100,
                data: { hash: 'efgh', height: 2 },
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
                id: '1',
                data: { hash: 'abcd', height: 1 },
            },
            {
                id: '1',
                delay: 100,
                data: { hash: 'efgh', height: 2 },
            },
        ],
        notificationsCount: 0,
        result: undefined,
    },
    {
        description: 'single block notification (incremented subscription id == 2)',
        method: 'subscribe',
        notifications: [
            {
                id: '2',
                data: { hash: 'abcd', height: 1 },
            },
        ],
        notificationsCount: 1,
        result: {
            blockHash: 'abcd',
            blockHeight: 1,
        },
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
            data: {
                address: 'A',
                txData: { output_amount: [] },
                txUtxos: {
                    inputs: [{ address: 'A', amount: [] }],
                    outputs: [{ address: 'B', amount: [] }],
                },
                blockInfo: {},
            },
        },

        result: {
            descriptor: 'A',
            tx: {
                ...tx,
                amount: '0',
                type: 'sent',
                targets: [{ addresses: ['B'], n: 0, amount: '0', isAddress: true }],
                cardanoSpecific: {},
                details: {
                    vin: [{ addresses: ['A'], isAddress: true, value: '0', isAccountOwned: true }],
                    vout: [{ addresses: ['B'], isAddress: true, value: '0' }],
                    totalInput: '0',
                    totalOutput: '0',
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
            data: {
                address: 'A',
                txData: { output_amount: [] },
                txUtxos: {
                    inputs: [
                        {
                            address: 'B',
                            amount: [{ unit: 'lovelace', quantity: '100' }],
                        },
                    ],
                    outputs: [
                        {
                            address: 'A',
                            amount: [
                                {
                                    unit: 'lovelace',
                                    quantity: '50',
                                },
                            ],
                            output_index: 1,
                        },
                    ],
                },
                blockInfo: {},
            },
        },
        result: {
            descriptor: 'A',
            tx: {
                ...tx,
                type: 'recv',
                amount: '50',
                targets: [
                    {
                        addresses: ['A'],
                        amount: '50',
                        isAccountTarget: true,
                        n: 1,
                        isAddress: true,
                    },
                ],
                cardanoSpecific: {},
                details: {
                    vin: [{ addresses: ['B'], value: '100', isAddress: true }],
                    vout: [
                        {
                            addresses: ['A'],
                            value: '50',
                            isAddress: true,
                            n: 1,
                            isAccountOwned: true,
                        },
                    ],
                    totalInput: '100',
                    totalOutput: '50',
                },
            },
        },
    },
    {
        description: 'address tx notification (self)',
        method: 'subscribe',
        params: {
            type: 'addresses',
            addresses: ['A'],
        },
        notifications: {
            data: {
                address: 'A',
                txData: { output_amount: [] },
                txUtxos: {
                    inputs: [{ address: 'A', amount: [] }],
                    outputs: [{ address: 'A', amount: [] }],
                },
                blockInfo: {},
            },
        },
        result: {
            descriptor: 'A',
            tx: {
                ...tx,
                type: 'self',
                cardanoSpecific: {},
                targets: [
                    { addresses: ['A'], isAccountTarget: true, n: 0, amount: '0', isAddress: true },
                ],
                details: {
                    vin: [{ addresses: ['A'], isAddress: true, value: '0', isAccountOwned: true }],
                    vout: [{ addresses: ['A'], isAddress: true, value: '0', isAccountOwned: true }],
                    totalInput: '0',
                    totalOutput: '0',
                },
            },
        },
    },
    {
        description: 'account tx notification (sent)',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [
                {
                    descriptor: 'xpub',
                    addresses: {
                        used: [{ address: 'B' }],
                        unused: [],
                        change: [{ address: 'B-change' }],
                    },
                },
            ],
        },
        notifications: {
            data: {
                address: 'B',
                txData: { output_amount: [{ unit: 'lovelace', quantity: '100' }] },
                txUtxos: {
                    inputs: [{ address: 'B', amount: [{ unit: 'lovelace', quantity: '100' }] }],
                    outputs: [
                        { address: 'A', amount: [{ unit: 'lovelace', quantity: '40' }] },
                        { address: 'B-change', amount: [{ unit: 'lovelace', quantity: '40' }] },
                    ],
                },
                blockInfo: {},
            },
        },
        result: {
            descriptor: 'xpub',
            tx: {
                ...tx,
                amount: '60',
                type: 'sent',
                targets: [{ addresses: ['A'], amount: '40', n: 0, isAddress: true }],
                cardanoSpecific: {},
                details: {
                    vin: [
                        { addresses: ['B'], value: '100', isAddress: true, isAccountOwned: true },
                    ],
                    vout: [
                        { addresses: ['A'], value: '40', isAddress: true },
                        {
                            addresses: ['B-change'],
                            value: '40',
                            isAddress: true,
                            isAccountOwned: true,
                        },
                    ],
                    totalInput: '100',
                    totalOutput: '80',
                },
            },
        },
    },
    {
        description: 'account tx notification (recv)',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [
                {
                    descriptor: 'xpub',
                    addresses: { used: [], unused: [{ address: 'B' }], change: [] },
                },
            ],
        },
        notifications: {
            data: {
                address: 'B',
                txData: { output_amount: [{ unit: 'lovelace', quantity: '50' }] },
                txUtxos: {
                    inputs: [{ address: 'A', amount: [{ unit: 'lovelace', quantity: '100' }] }],
                    outputs: [{ address: 'B', amount: [{ unit: 'lovelace', quantity: '50' }] }],
                },
                blockInfo: {},
            },
        },
        result: {
            descriptor: 'xpub',
            tx: {
                ...tx,
                type: 'recv',
                amount: '50',
                targets: [
                    {
                        addresses: ['B'],
                        amount: '50',
                        isAccountTarget: true,
                        n: 0,
                        isAddress: true,
                    },
                ],
                cardanoSpecific: {},
                details: {
                    vin: [{ addresses: ['A'], value: '100', isAddress: true }],
                    vout: [
                        { addresses: ['B'], value: '50', isAddress: true, isAccountOwned: true },
                    ],

                    totalInput: '100',
                    totalOutput: '50',
                },
            },
        },
    },
    {
        description: 'account tx notification (account without addresses)',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [{ descriptor: '0x0' }],
        },
        notifications: {
            data: {
                address: '0x0',
                txData: { output_amount: [] },
                txUtxos: {
                    inputs: [{ address: '0x0', amount: [] }],
                    outputs: [{ address: '0x1', amount: [] }],
                },
                blockInfo: {},
            },
        },
        result: {
            descriptor: '0x0',
            tx: {
                ...tx,
                type: 'sent',
                amount: '0',
                cardanoSpecific: {},
                targets: [{ addresses: ['0x1'], n: 0, isAddress: true, amount: '0' }],
                details: {
                    vin: [
                        { addresses: ['0x0'], isAddress: true, value: '0', isAccountOwned: true },
                    ],
                    vout: [{ addresses: ['0x1'], isAddress: true, value: '0' }],

                    totalInput: '0',
                    totalOutput: '0',
                },
            },
        },
    },
    {
        description: 'account tx notification (self)',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [
                {
                    descriptor: 'xpub',
                    addresses: {
                        used: [{ address: 'B' }],
                        unused: [{ address: 'C' }],
                        change: [{ address: 'D' }],
                    },
                },
            ],
        },
        notifications: [
            {
                data: {
                    address: 'B',
                    txData: { output_amount: [{ unit: 'lovelace', quantity: '100' }] },
                    txUtxos: {
                        inputs: [
                            { address: 'B', amount: [] },
                            { address: 'C', amount: [] },
                        ],
                        outputs: [{ address: 'D', amount: [] }],
                    },
                    blockInfo: {},
                },
            },
            {
                data: {
                    address: 'C',
                    txData: { output_amount: [] },
                    txUtxos: {
                        inputs: [
                            { address: 'B', amount: [] },
                            { address: 'C', amount: [] },
                        ],
                        outputs: [{ address: 'D', amount: [] }],
                    },
                    blockInfo: {},
                },
            },
            {
                data: {
                    address: 'D',
                    txData: { output_amount: [] },
                    txUtxos: {
                        inputs: [
                            { address: 'B', amount: [] },
                            { address: 'C', amount: [] },
                        ],
                        outputs: [{ address: 'D', amount: [] }],
                    },
                    blockInfo: {},
                },
            },
        ],
        result: {
            descriptor: 'xpub',
            tx: {
                ...tx,
                type: 'self',
                cardanoSpecific: {},
                details: {
                    vin: [
                        { addresses: ['B'], isAddress: true, value: '0', isAccountOwned: true },
                        { addresses: ['C'], isAddress: true, value: '0', isAccountOwned: true },
                    ],
                    vout: [{ addresses: ['D'], isAddress: true, value: '0', isAccountOwned: true }],
                    totalInput: '0',
                    totalOutput: '0',
                },
            },
        },
    },
    {
        description: 'unknown tx notification',
        method: 'subscribe',
        params: {
            type: 'addresses',
            addresses: ['A'],
        },
        notifications: {
            data: {
                address: 'X',
                txData: { output_amount: [] },
                txUtxos: {
                    inputs: [{ address: 'B', amount: [] }],
                    outputs: [{ address: 'D', amount: [] }],
                },
                blockInfo: {},
            },
        },
        result: {
            descriptor: 'X',
            tx: {
                ...tx,
                type: 'unknown',
                amount: '0',
                cardanoSpecific: {},
                details: {
                    vin: [{ addresses: ['B'], isAddress: true, value: '0' }],
                    vout: [{ addresses: ['D'], isAddress: true, value: '0' }],
                    totalInput: '0',
                    totalOutput: '0',
                },
            },
        },
    },
    {
        description: 'notification without "tx" field',
        method: 'subscribe',
        params: {
            type: 'addresses',
            addresses: ['A'],
        },
        notifications: {
            data: {
                address: 'X',
            },
        },
        result: undefined,
    },
] as const;

export default {
    notifyBlocks,
    notifyAddresses,
};
