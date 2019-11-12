export default {
    addAddresses: [
        {
            input: 'not-an-array',
            error: 'Invalid parameter: addresses',
        },
        {
            input: {},
            error: 'Invalid parameter: addresses',
        },
        {
            input: ['A', 'A', 'A', { invalid: 'value' }],
            unique: ['A'],
            subscribed: ['A'],
        },
        {
            input: ['A', 'B', 'A', false],
            unique: ['B'],
            subscribed: ['A', 'B'],
        },
        {
            input: ['A', 'B', 'C', 'C', 'D'],
            unique: ['C', 'D'],
            subscribed: ['A', 'B', 'C', 'D'],
        },
    ],
    removeAddresses: [
        {
            input: 'not-an-array',
            error: 'Invalid parameter: addresses',
        },
        {
            input: {},
            error: 'Invalid parameter: addresses',
        },
        {
            input: ['A', 'A', 'A', { invalid: 'value' }],
            subscribed: ['B', 'C', 'D'],
        },
        {
            input: ['A', 'B', 'A', false],
            subscribed: ['C', 'D'],
        },
        {
            input: ['A', 'B', 'C', 'A', 'D'],
            subscribed: [],
        },
    ],
    addAccounts: [
        {
            input: [
                {
                    descriptor: 'xpub',
                    addresses: {
                        change: [],
                        used: [{ address: 'A' }],
                        unused: [],
                    },
                },
            ],
            subscribedAccounts: [
                {
                    descriptor: 'xpub',
                    addresses: {
                        change: [],
                        used: [{ address: 'A' }],
                        unused: [],
                    },
                },
            ],
            subscribedAddresses: ['A'],
        },
        {
            input: [
                {
                    descriptor: 'xpub',
                    addresses: {
                        change: [],
                        used: [{ address: 'A' }, { address: 'B' }],
                        unused: [],
                    },
                },
            ],
            subscribedAccounts: [
                {
                    descriptor: 'xpub',
                    addresses: {
                        change: [],
                        used: [{ address: 'A' }, { address: 'B' }],
                        unused: [],
                    },
                },
            ],
            subscribedAddresses: ['A', 'B'],
        },
        {
            input: [
                {
                    descriptor: 'xpub2',
                    addresses: {
                        change: [{ address: 'xpub2-A' }],
                        used: [{ address: 'xpub2-B' }, { address: 'xpub2-C' }],
                        unused: [{ address: 'xpub2-D' }],
                    },
                },
            ],
            subscribedAccounts: [
                {
                    descriptor: 'xpub',
                    addresses: {
                        change: [],
                        used: [{ address: 'A' }, { address: 'B' }],
                        unused: [],
                    },
                },
                {
                    descriptor: 'xpub2',
                    addresses: {
                        change: [{ address: 'xpub2-A' }],
                        used: [{ address: 'xpub2-B' }, { address: 'xpub2-C' }],
                        unused: [{ address: 'xpub2-D' }],
                    },
                },
            ],
            subscribedAddresses: ['A', 'B', 'xpub2-A', 'xpub2-B', 'xpub2-C', 'xpub2-D'],
        },
    ],
    removeAccounts: [
        {
            input: [
                {
                    descriptor: 'xpub2',
                },
            ],
            subscribedAccounts: [
                {
                    descriptor: 'xpub',
                    addresses: {
                        change: [],
                        used: [{ address: 'A' }, { address: 'B' }],
                        unused: [],
                    },
                },
            ],
            subscribedAddresses: ['A', 'B'],
        },
        {
            input: [
                {
                    descriptor: 'xpub',
                },
            ],
            subscribedAccounts: [],
            subscribedAddresses: [],
        },
    ],
};
