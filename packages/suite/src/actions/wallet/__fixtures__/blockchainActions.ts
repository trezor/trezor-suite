import { NOTIFICATION } from '@suite-actions/constants';
import { TRANSACTION, ACCOUNT, BLOCKCHAIN } from '@wallet-actions/constants';
import { analyzeTransactions } from '@wallet-utils/__fixtures__/transactionUtils';

const DEFAULT_ACCOUNT = {
    deviceState: 'deviceState',
    symbol: 'btc',
    networkType: 'bitcoin',
    descriptor: 'xpub',
    history: {
        total: 0,
    },
};

const BLOCK = {
    coin: { shortcut: 'btc' },
};

const parseTx = (data: any) => ({
    targets: [],
    tokens: [],
    amount: '0',
    fee: '0',
    details: {
        vin: [],
        vout: [],
        size: 255,
        totalInput: '0',
        totalOutput: '0',
    },
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
            connect: [
                {
                    history: {
                        total: 1, // to make sure that "basic" call will catch a difference
                    },
                },
                {
                    history: {
                        transactions: f.fresh.slice().map((t: any) => parseTx(t)),
                    },
                },
            ],
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

export const init = [
    {
        description: 'no accounts',
        actions: [{ type: BLOCKCHAIN.UPDATE_FEE }, { type: BLOCKCHAIN.READY }],
        blockchainUnsubscribeFiatRates: 0,
    },
    {
        description: 'one coin is present',
        initialState: {
            accounts: [{ symbol: 'btc' }],
        },
        actions: [{ type: BLOCKCHAIN.UPDATE_FEE }, { type: BLOCKCHAIN.READY }],
        blockchainUnsubscribeFiatRates: 1,
    },
    {
        description: 'multiple coins and custom backends are present',
        initialState: {
            accounts: [
                { symbol: 'btc' },
                { symbol: 'btc' },
                { symbol: 'ltc' },
                { symbol: 'ltc' },
                { symbol: 'eth' },
            ],
        },
        actions: [{ type: BLOCKCHAIN.UPDATE_FEE }, { type: BLOCKCHAIN.READY }],
        blockchainUnsubscribeFiatRates: 3,
    },
];

export const onConnect = [
    {
        description: 'unknown coin',
        symbol: 'btc-invalid',
        actions: [],
        blockchainEstimateFee: 0,
        blockchainSubscribeFiatRates: 0,
        blockchainSubscribe: 0,
    },
    {
        description: 'successful, no accounts, no subscriptions',
        symbol: 'btc',
        actions: [{ type: BLOCKCHAIN.UPDATE_FEE }, { type: BLOCKCHAIN.CONNECTED }],
        blockchainEstimateFee: 1,
        blockchainSubscribeFiatRates: 1,
        blockchainSubscribe: 0,
    },
    {
        description: 'successful, different coin accounts, no subscriptions',
        initialState: {
            accounts: [{ symbol: 'ltc' }],
        },
        symbol: 'btc',
        actions: [{ type: BLOCKCHAIN.UPDATE_FEE }, { type: BLOCKCHAIN.CONNECTED }],
        blockchainEstimateFee: 1,
        blockchainSubscribeFiatRates: 1,
        blockchainSubscribe: 0,
    },
    {
        description: 'successful with subscription',
        initialState: {
            accounts: [{ symbol: 'btc', history: {} }],
            blockchain: {
                btc: {
                    reconnection: { id: 1 },
                },
            },
        },
        symbol: 'btc',
        actions: [{ type: BLOCKCHAIN.UPDATE_FEE }, { type: BLOCKCHAIN.CONNECTED }],
        blockchainEstimateFee: 1,
        blockchainSubscribeFiatRates: 1,
        blockchainSubscribe: 1,
    },
    {
        description: 'successful, subscribeFiatRates failed, fee levels sorted',
        initialState: {
            accounts: [{ symbol: 'btc', history: {} }],
        },
        // order: subscribeFiatRates > estimateFee
        connect: [
            { success: false },
            { payload: { levels: [{ label: 'normal' }, { label: 'high' }, { label: 'low' }] } },
        ],
        symbol: 'btc',
        actions: [{ type: BLOCKCHAIN.UPDATE_FEE }, { type: BLOCKCHAIN.CONNECTED }],
        blockchainEstimateFee: 1,
        blockchainSubscribeFiatRates: 1,
        blockchainSubscribe: 0,
    },
    {
        description: 'successful, blockchainEstimateFee failed',
        initialState: {
            accounts: [{ symbol: 'eth', history: {} }],
        },
        // order: subscribeFiatRates > subscribe > estimateFee
        connect: [undefined, undefined, { success: false }],
        symbol: 'eth',
        actions: [{ type: BLOCKCHAIN.CONNECTED }],
        blockchainEstimateFee: 1,
        blockchainSubscribeFiatRates: 1,
        blockchainSubscribe: 1,
    },
];

export const onDisconnect = [
    {
        description: 'unknown coin',
        symbol: 'btc-invalid',
        actions: [],
    },
    {
        description: 'without accounts, not reconnection',
        symbol: 'btc',
        actions: [],
    },
    {
        description: 'with accounts, reconnection started',
        initialState: {
            accounts: [{ symbol: 'btc' }],
        },
        symbol: 'btc',
        actions: [{ type: BLOCKCHAIN.RECONNECT_TIMEOUT_START }],
    },
    {
        description: 'with accounts, with reconnection, reconnection restarted',
        initialState: {
            accounts: [{ symbol: 'btc' }],
            blockchain: {
                btc: {
                    reconnection: {
                        id: 1,
                        count: 1,
                    },
                },
            },
        },
        symbol: 'btc',
        actions: [{ type: BLOCKCHAIN.RECONNECT_TIMEOUT_START }],
    },
];

export const onNotification = [
    {
        description: 'no accounts',
        initialState: {
            accounts: [{ symbol: 'eth' }],
        },
        params: {
            notification: { descriptor: 'xpub', tx: { type: 'recv' } },
            coin: { shortcut: 'btc' },
        },
        actions: [],
        getAccountInfo: 0,
    },
    {
        description: 'pending btc tx, multiple accounts update',
        initialState: {
            accounts: [
                DEFAULT_ACCOUNT,
                { ...DEFAULT_ACCOUNT, descriptor: 'xpub2' },
                { ...DEFAULT_ACCOUNT, descriptor: 'xpub3' },
            ],
        },
        params: {
            notification: { descriptor: 'xpub', tx: { type: 'recv', amount: '100000' } },
            coin: { shortcut: 'btc' },
        },
        actions: [{ type: NOTIFICATION.EVENT, payload: { formattedAmount: '0.001 BTC' } }],
        getAccountInfo: 3,
    },
    {
        description: 'pending token tx, one account update',
        initialState: {
            accounts: [
                { ...DEFAULT_ACCOUNT, symbol: 'eth', networkType: 'ethereum' },
                { ...DEFAULT_ACCOUNT, descriptor: 'xpub2', symbol: 'eth', networkType: 'ethereum' },
            ],
        },
        params: {
            notification: {
                descriptor: 'xpub',
                tx: { type: 'recv', tokens: [{ amount: '1', decimals: 3, symbol: 'erc20' }] },
            },
            coin: { shortcut: 'eth' },
        },
        actions: [{ type: NOTIFICATION.EVENT, payload: { formattedAmount: '0.001 ERC20' } }],
        getAccountInfo: 1,
    },
    {
        description: 'sent btc, multiple accounts update',
        initialState: {
            accounts: [
                DEFAULT_ACCOUNT,
                { ...DEFAULT_ACCOUNT, descriptor: 'xpub2' },
                { ...DEFAULT_ACCOUNT, descriptor: 'xpub3' },
            ],
        },
        params: {
            notification: { descriptor: 'xpub', tx: {} },
            coin: { shortcut: 'btc' },
        },
        actions: [],
        getAccountInfo: 3,
    },
    {
        description: 'sent eth, one account update',
        initialState: {
            accounts: [
                { ...DEFAULT_ACCOUNT, symbol: 'eth', networkType: 'ethereum' },
                { ...DEFAULT_ACCOUNT, descriptor: 'xpub2', symbol: 'eth', networkType: 'ethereum' },
            ],
        },
        params: {
            notification: { descriptor: 'xpub', tx: {} },
            coin: { shortcut: 'eth' },
        },
        actions: [],
        getAccountInfo: 1,
    },
    {
        description: 'sent ripple, no account update',
        initialState: {
            accounts: [{ ...DEFAULT_ACCOUNT, symbol: 'xrp', networkType: 'ripple' }],
        },
        params: {
            notification: { descriptor: 'xpub', tx: {} },
            coin: { shortcut: 'xrp' },
        },
        actions: [],
        getAccountInfo: 0,
    },
];

export const customBacked = [
    {
        description: 'no backends',
        initialState: [],
        blockchainSetCustomBackend: 0,
    },
    {
        description: 'with one backend',
        initialState: [{ coin: 'btc' }, { coin: 'btc' }],
        blockchainSetCustomBackend: 1,
    },
    {
        description: 'with multiple backends',
        initialState: [
            { coin: 'btc' },
            { coin: 'btc' },
            { coin: 'ltc' },
            { coin: 'ltc' },
            { coin: 'ltc' },
            { coin: 'eth' },
        ],
        blockchainSetCustomBackend: 3,
    },
    {
        description: 'enable one, with multiple backends',
        initialState: [
            { coin: 'btc' },
            { coin: 'btc' },
            { coin: 'ltc' },
            { coin: 'ltc' },
            { coin: 'ltc' },
            { coin: 'eth' },
        ],
        symbol: 'btc',
        blockchainSetCustomBackend: 1,
    },
];
