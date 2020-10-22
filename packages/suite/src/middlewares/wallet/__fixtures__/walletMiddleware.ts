import { ACCOUNT } from '@wallet-actions/constants';

export const blockchainSubscription = [
    {
        description: 'create account, only one subscribed',
        initialAccounts: [{ descriptor: '1', symbol: 'ltc' }],
        actions: [
            {
                type: ACCOUNT.CREATE,
                payload: { descriptor: '1', symbol: 'btc' },
            },
        ],
        result: {
            subscribe: {
                called: 1,
                accounts: [{ descriptor: '1', symbol: 'btc' }],
                coin: 'btc',
            },
        },
    },
    {
        description: 'remove account, one subscription remain',
        initialAccounts: [{ descriptor: '1' }, { descriptor: '2' }],
        actions: [
            {
                type: ACCOUNT.REMOVE,
                payload: [{ descriptor: '1' }],
            },
        ],
        result: {
            subscribe: {
                called: 1,
                accounts: [{ descriptor: '2' }],
                coin: 'eth',
            },
            disconnect: {
                called: 0,
            },
        },
    },
    {
        description: 'remove account and disconnect backend',
        initialAccounts: [{ descriptor: '1' }, { descriptor: '2' }],
        actions: [
            {
                type: ACCOUNT.REMOVE,
                payload: [{ descriptor: '1' }, { descriptor: '2' }],
            },
        ],
        result: {
            subscribe: {
                called: 0,
            },
            disconnect: {
                called: 1,
                coin: 'eth',
            },
        },
    },
    {
        description: 'disconnect LTC backend, subscribe one account on BTC backend',
        initialAccounts: [
            { descriptor: '1btc', symbol: 'btc' },
            { descriptor: '2btc', symbol: 'btc' },
            { descriptor: '1ltc', symbol: 'ltc' },
            { descriptor: '2ltc', symbol: 'ltc' },
        ],
        actions: [
            {
                type: ACCOUNT.REMOVE,
                payload: [
                    { descriptor: '1btc', symbol: 'btc' },
                    { descriptor: '1ltc', symbol: 'ltc' },
                    { descriptor: '2ltc', symbol: 'ltc' },
                ],
            },
        ],
        result: {
            subscribe: {
                called: 1,
                accounts: [{ descriptor: '2btc', symbol: 'btc' }],
                coin: 'btc',
            },
            disconnect: {
                called: 1,
                coin: 'ltc',
            },
        },
    },
];
