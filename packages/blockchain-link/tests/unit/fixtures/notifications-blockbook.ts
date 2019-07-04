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
        server: [
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
        server: [
            {
                id: '0',
                data: { hash: 'abcd', height: 1 },
            },
            {
                id: '0',
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
        server: [
            {
                id: '1',
                data: { hash: 'abcd', height: 1 },
            },
            {
                id: '1',
                data: { hash: 'efgh', height: 2 },
            },
        ],
        result: undefined,
    },
    {
        description: 'single block notification (incremented subscription id == 2)',
        method: 'subscribe',
        server: [
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
        server: {
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
        server: {
            data: {
                address: 'A',
                tx: {
                    vin: [{ addresses: ['B'] }],
                    vout: [{ addresses: ['A'] }],
                },
            },
        },
        result: {
            descriptor: 'A',
            tx: {
                ...tx,
                type: 'recv',
                targets: [{ addresses: ['B'] }],
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
        server: {
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
                    addresses: { used: [{ address: 'B' }], unused: [], change: [] },
                },
            ],
        },
        server: {
            data: {
                address: 'B',
                tx: {
                    vin: [{ addresses: ['B'] }],
                    vout: [{ addresses: ['A'] }],
                },
            },
        },
        result: {
            descriptor: 'xpub',
            tx: {
                ...tx,
                type: 'sent',
                targets: [{ addresses: ['A'] }],
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
                    addresses: { used: [{ address: 'B' }], unused: [], change: [] },
                },
            ],
        },
        server: {
            data: {
                address: 'B',
                tx: {
                    vin: [{ addresses: ['A'] }],
                    vout: [{ addresses: ['B'] }],
                },
            },
        },
        result: {
            descriptor: 'xpub',
            tx: {
                ...tx,
                type: 'recv',
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
        server: {
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
        server: [
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
        server: {
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
        server: {
            data: {
                address: 'X',
            },
        },
        result: undefined,
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
        description: 'add first account (with descriptor)',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [{ descriptor: 'A' }],
        },
        subscribed: ['1', 'A'],
    },
    {
        description: 'add second account (with addresses)',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [
                {
                    descriptor: 'xpub',
                    addresses: { used: [{ address: 'B' }], unused: [{ address: 'C' }], change: [] },
                },
            ],
        },
        subscribed: ['1', 'A', 'B', 'C'],
    },
    {
        description: 'try to add duplicate of first account',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [{ descriptor: 'A' }],
        },
        subscribed: ['1', 'A', 'B', 'C'],
    },
    {
        description: 'remove first account (with descriptor)',
        method: 'unsubscribe',
        params: {
            type: 'accounts',
            accounts: [{ descriptor: 'A' }],
        },
        subscribed: ['1', 'B', 'C'],
    },
    {
        description: 'try to remove first account again',
        method: 'unsubscribe',
        params: {
            type: 'accounts',
            accounts: [{ descriptor: 'A' }],
        },
        subscribed: ['1', 'B', 'C'],
    },
    {
        description: 'override second account (with added new addresses)',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [
                {
                    descriptor: 'xpub',
                    addresses: {
                        change: [{ address: 'D' }],
                        used: [{ address: 'B' }],
                        unused: [{ address: 'C' }],
                    },
                },
            ],
        },
        subscribed: ['1', 'B', 'C', 'D'],
    },
    {
        description: 'add 2 more accounts (and few invalid)',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: [
                { descriptor: 'X' },
                { descriptor: 'X' },
                {
                    descriptor: 'xpub2',
                    addresses: {
                        change: [{ address: '0' }],
                        used: [{ address: 'Y' }],
                        unused: [{ address: 'Z' }],
                    },
                },
                null,
                {},
                1,
                () => {},
            ],
        },
        subscribed: ['1', 'B', 'C', 'D', 'X', '0', 'Y', 'Z'],
    },
    {
        description: 'remove second account',
        method: 'unsubscribe',
        params: {
            type: 'accounts',
            accounts: [
                {
                    descriptor: 'xpub',
                },
            ],
        },

        subscribed: ['1', 'X', '0', 'Y', 'Z'],
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
    {
        description: 'subscribe (server error)',
        method: 'subscribe',
        server: [{ response: { error: { message: 'Error msg' } } }],
        params: {
            type: 'addresses',
            addresses: ['A'],
        },
        error: 'Error msg',
    },
    {
        description: 'unsubscribe (server error)',
        method: 'unsubscribe',
        server: [null, { response: { error: { message: 'Error msg' } } }],
        params: {
            type: 'addresses',
            addresses: ['A'],
        },
        error: 'Error msg',
    },
];

export default {
    notifyBlocks,
    notifyAddresses,
    subscribedAddresses,
    subscribeErrors,
};
