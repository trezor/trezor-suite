const addresses = [
    {
        description: 'clear all addresses from the previous part of the test',
        method: 'unsubscribe',
        params: {
            type: 'addresses',
            addresses: undefined,
        },
        subscribed: [],
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
        subscribed: [],
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
        subscribed: [],
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
        subscribed: [],
    },
] as const;

const errors = [
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
        description: 'account subscribe (invalid "accounts" parameter)',
        method: 'subscribe',
        params: {
            type: 'accounts',
            accounts: 1,
        },
        error: 'Invalid parameter: accounts',
    },
    {
        description: 'address subscribe (invalid "addresses" parameter)',
        method: 'subscribe',
        params: {
            type: 'addresses',
            addresses: 1,
        },
        error: 'Invalid parameter: addresses',
    },
    {
        description: 'account unsubscribe (invalid "accounts" parameter)',
        method: 'unsubscribe',
        params: {
            type: 'accounts',
            accounts: 1,
        },
        error: 'Invalid parameter: accounts',
    },
    {
        description: 'address unsubscribe (invalid "addresses" parameter)',
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
] as const;

export default {
    addresses,
    errors,
};
