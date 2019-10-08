// To avoid unnecessary data this fixtures sends notifications with mostly undefined values
const tx = {
    // amount: undefined,
    // blockHash: undefined,
    // blockHeight: undefined,
    // blockTime: undefined,
    // fee: undefined,
    // txid: undefined,
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
        result: {
            blockHash: 'abcd',
            blockHeight: 1,
        },
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
            data: {
                address: 'A',
                tx: {
                    vin: [{ addresses: ['A'] }],
                    vout: [{ addresses: ['B'] }],
                },
            },
        },

        result: {
            descriptor: 'A',
            tx: {
                ...tx,
                amount: '0',
                type: 'sent',
                targets: [{ addresses: ['B'] }],
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
                tx: {
                    vin: [{ addresses: ['B'], value: '100' }],
                    vout: [{ addresses: ['A'], value: '50' }],
                },
            },
        },
        result: {
            descriptor: 'A',
            tx: {
                ...tx,
                type: 'recv',
                amount: '50',
                targets: [{ addresses: ['B'], amount: '100' }],
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
                tx: {
                    vin: [{ addresses: ['A'] }],
                    vout: [{ addresses: ['A'] }],
                },
            },
        },
        result: {
            descriptor: 'A',
            tx: {
                ...tx,
                type: 'self',
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
                tx: {
                    vin: [{ addresses: ['B'], value: '100' }],
                    vout: [
                        { addresses: ['A'], value: '40' },
                        { addresses: ['B-change'], value: '40' },
                    ],
                },
            },
        },
        result: {
            descriptor: 'xpub',
            tx: {
                ...tx,
                amount: '60',
                type: 'sent',
                targets: [{ addresses: ['A'], amount: '40' }],
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
                tx: {
                    vin: [{ addresses: ['A'] }],
                    vout: [{ addresses: ['B'], value: '50' }],
                },
            },
        },
        result: {
            descriptor: 'xpub',
            tx: {
                ...tx,
                type: 'recv',
                amount: '50',
                targets: [{ addresses: ['A'] }],
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
                tx: {
                    vin: [{ addresses: ['0x0'] }],
                    vout: [{ addresses: ['0x1'] }],
                },
            },
        },
        result: {
            descriptor: '0x0',
            tx: {
                ...tx,
                type: 'sent',
                amount: '0',
                targets: [{ addresses: ['0x1'] }],
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
                    tx: {
                        vin: [{ addresses: ['B'] }, { addresses: ['C'] }],
                        vout: [{ addresses: ['D'] }],
                    },
                },
            },
            {
                data: {
                    address: 'C',
                    tx: {
                        vin: [{ addresses: ['B'] }, { addresses: ['C'] }],
                        vout: [{ addresses: ['D'] }],
                    },
                },
            },
            {
                data: {
                    address: 'D',
                    tx: {
                        vin: [{ addresses: ['B'] }, { addresses: ['C'] }],
                        vout: [{ addresses: ['D'] }],
                    },
                },
            },
        ],
        result: {
            descriptor: 'xpub',
            tx: {
                ...tx,
                type: 'self',
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
                tx: {},
            },
        },
        result: {
            descriptor: 'X',
            tx: {
                ...tx,
                type: 'unknown',
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
];

export default {
    notifyBlocks,
    notifyAddresses,
};
