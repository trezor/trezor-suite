import { TRANSACTION, ACCOUNT } from '@wallet-actions/constants';
import { analyzeTransactions } from '@wallet-utils/__fixtures__/transactionUtils';

const DEFAULT_ACCOUNT = {
    deviceState: 'deviceState',
    symbol: 'btc',
    networkType: 'bitcoin',
    descriptor: 'xpub',
    history: {},
};

const BLOCK = {
    coin: { shortcut: 'btc' },
};

const parseTx = (data: any) => ({
    targets: [],
    tokens: [],
    amount: '0',
    fee: '0',
    ...data,
});

const analyzeTransactionsExtended = [
    undefined,
    {
        result: [TRANSACTION.ADD, ACCOUNT.UPDATE],
        resultTxs: {
            'xpub-btc-deviceState': [
                { blockHeight: 5, blockHash: '5', txid: '5' },
                { blockHeight: 4, blockHash: '4', txid: '4' },
                { blockHeight: 3, blockHash: '3', txid: '3' },
                { blockHeight: 2, blockHash: '2', txid: '2' },
                { blockHeight: 1, blockHash: '1', txid: '1' },
            ],
        },
    },
    {
        result: [TRANSACTION.ADD, ACCOUNT.UPDATE],
        resultTxs: {
            'xpub-btc-deviceState': [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
        },
    },
    {
        result: [],
        resultTxs: {
            'xpub-btc-deviceState': [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
        },
    },
    {
        result: [TRANSACTION.REMOVE, ACCOUNT.UPDATE],
        resultTxs: {
            'xpub-btc-deviceState': [],
        },
    },
    {
        result: [TRANSACTION.REMOVE, ACCOUNT.UPDATE],
        resultTxs: {
            'xpub-btc-deviceState': [{ blockHeight: 1, blockHash: '1', txid: '1' }],
        },
    },
    {
        result: [TRANSACTION.REMOVE, ACCOUNT.UPDATE],
        resultTxs: {
            'xpub-btc-deviceState': [],
        },
    },
    {
        result: [TRANSACTION.REMOVE, TRANSACTION.ADD, ACCOUNT.UPDATE],
        resultTxs: {
            'xpub-btc-deviceState': [{ blockHeight: 1, blockHash: '1', txid: '1' }],
        },
    },
    {
        result: [TRANSACTION.REMOVE, TRANSACTION.ADD, ACCOUNT.UPDATE],
        resultTxs: {
            'xpub-btc-deviceState': [{ blockHeight: 1, blockHash: '1a', txid: '1a' }],
        },
    },
    {
        result: [TRANSACTION.ADD, ACCOUNT.UPDATE],
        resultTxs: {
            'xpub-btc-deviceState': [
                { blockHeight: undefined, blockHash: '4', txid: '4' },
                { blockHeight: 3, blockHash: '3', txid: '3' },
                { blockHeight: 2, blockHash: '2', txid: '2' },
                { blockHeight: 1, blockHash: '1', txid: '1' },
            ],
        },
    },
    {
        result: [TRANSACTION.ADD, ACCOUNT.UPDATE],
        resultTxs: {
            'xpub-btc-deviceState': [
                { blockHeight: 2, blockHash: '2', txid: '2' },
                { blockHeight: 3, blockHash: '3', txid: '3' },
                { blockHeight: 1, blockHash: '1', txid: '1' },
            ],
        },
    },
    {
        result: [TRANSACTION.ADD, ACCOUNT.UPDATE],
        resultTxs: {
            'xpub-btc-deviceState': [
                { blockHeight: 4, blockHash: '4', txid: '4' },
                { blockHeight: 2, blockHash: '2c', txid: '2c' },
                { blockHeight: 2, blockHash: '2b', txid: '2b' },
                { blockHeight: 2, blockHash: '2a', txid: '2a' },
                { blockHeight: 3, blockHash: '3b', txid: '3b' },
                { blockHeight: 3, blockHash: '3a', txid: '3a' },
                { blockHeight: 1, blockHash: '1', txid: '1' },
            ],
        },
    },
    {
        result: [TRANSACTION.REMOVE, TRANSACTION.ADD, ACCOUNT.UPDATE],
        resultTxs: {
            'xpub-btc-deviceState': [
                { blockHeight: undefined, blockHash: '4', txid: '4' },
                { blockHeight: 3, blockHash: '3', txid: '3' },
                { blockHeight: 2, blockHash: '2', txid: '2' },
            ],
        },
    },
    {
        result: [TRANSACTION.REMOVE, TRANSACTION.ADD, ACCOUNT.UPDATE],
        resultTxs: {
            'xpub-btc-deviceState': [
                { blockHeight: undefined, blockHash: '4', txid: '4' },
                { blockHeight: 3, blockHash: '3', txid: '3' },
                { blockHeight: 2, blockHash: '2a', txid: '2a' },
                { blockHeight: 1, blockHash: '1b', txid: '1b' },
                { blockHeight: 1, blockHash: '1a', txid: '1a' },
                { blockHeight: 0, blockHash: '0', txid: '0' },
            ],
        },
    },
    {
        result: [TRANSACTION.REMOVE, TRANSACTION.ADD, ACCOUNT.UPDATE],
        resultTxs: {
            'xpub-btc-deviceState': [
                { blockHeight: 3, blockHash: '3a', txid: '3a' },
                { blockHeight: 2, blockHash: '2b', txid: '2b' },
                { blockHeight: 2, blockHash: '2a', txid: '2a' },
            ],
        },
    },
];

// A little bit crazy test to avoid fixtures duplication
export const onBlock = analyzeTransactions
    // extend @wallet-utils/__fixtures__/transactionUtils
    .map((f, i) => {
        return {
            description: f.description,
            connect: {
                history: {
                    transactions: f.fresh.slice().map((t: any) => parseTx(t)),
                },
            },
            block: BLOCK,
            state: {
                accounts: [DEFAULT_ACCOUNT],
                transactions: {
                    'xpub-btc-deviceState': f.known,
                },
            },
            result: undefined,
            resultTxs: {},
            ...analyzeTransactionsExtended[i],
        };
    })
    // add more test cases
    .concat([
        {
            description: 'Account specific fields changed, blockbook: unconfirmed',
            connect: {
                history: {
                    total: 0,
                    unconfirmed: 1,
                },
            },
            block: BLOCK,
            state: {
                accounts: [{ ...DEFAULT_ACCOUNT, history: { total: 0, unconfirmed: 0 } }],
            },
            result: [ACCOUNT.UPDATE],
        },
        {
            description: 'Account specific fields changed, blockbook: total',
            connect: {
                history: {
                    total: 1,
                    unconfirmed: 0,
                },
            },
            block: BLOCK,
            state: {
                accounts: [{ ...DEFAULT_ACCOUNT, history: { total: 0, unconfirmed: 0 } }],
            },
            result: [ACCOUNT.UPDATE],
        },
        {
            description: 'Account specific fields changed, ripple: sequence',
            connect: {
                history: {},
                misc: {
                    sequence: 1,
                },
            },
            block: BLOCK,
            state: {
                accounts: [{ ...DEFAULT_ACCOUNT, networkType: 'ripple', misc: { sequence: 0 } }],
            },
            result: [ACCOUNT.UPDATE],
        },
        {
            description: 'Account specific fields changed, ripple: balance',
            connect: {
                history: {},
                balance: '1',
                misc: {
                    sequence: 0,
                },
            },
            block: BLOCK,
            state: {
                accounts: [
                    {
                        ...DEFAULT_ACCOUNT,
                        networkType: 'ripple',
                        balance: '0',
                        misc: { sequence: 0 },
                    },
                ],
            },
            result: [ACCOUNT.UPDATE],
        },
        {
            description: 'Account specific fields changed, ethereum: nonce',
            connect: {
                history: {},
                misc: {
                    nonce: 1,
                },
            },
            block: BLOCK,
            state: {
                accounts: [{ ...DEFAULT_ACCOUNT, networkType: 'ethereum', misc: { nonce: 0 } }],
            },
            result: [ACCOUNT.UPDATE],
        },
        {
            description: 'Account does not exists',
            connect: {
                balance: '1',
            },
            block: BLOCK,
            state: {
                accounts: [],
            },
        },
    ] as any);
