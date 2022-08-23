import { NOTIFICATION } from '@suite-actions/constants';
import { TRANSACTION, BLOCKCHAIN } from '@wallet-actions/constants';
import { analyzeTransactionsFixtures as analyzeTransactions } from '@suite-common/wallet-utils';
import { accountActions } from '@suite-common/wallet-core';

const DEFAULT_ACCOUNT = {
    deviceState: 'deviceState',
    symbol: 'btc',
    networkType: 'bitcoin',
    descriptor: 'xpub',
    key: 'xpub-btc-deviceState',
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
    {
        result: [BLOCKCHAIN.SYNCED],
    },
    {
        result: [TRANSACTION.ADD, accountActions.updateAccount.type, BLOCKCHAIN.SYNCED],
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
        result: [TRANSACTION.ADD, accountActions.updateAccount.type, BLOCKCHAIN.SYNCED],
        resultTxs: {
            'xpub-btc-deviceState': [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
        },
    },
    {
        result: [BLOCKCHAIN.SYNCED],
        resultTxs: {
            'xpub-btc-deviceState': [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
        },
    },
    {
        result: [TRANSACTION.REMOVE, accountActions.updateAccount.type, BLOCKCHAIN.SYNCED],
        resultTxs: {
            'xpub-btc-deviceState': [],
        },
    },
    {
        result: [TRANSACTION.REMOVE, accountActions.updateAccount.type, BLOCKCHAIN.SYNCED],
        resultTxs: {
            'xpub-btc-deviceState': [{ blockHeight: 1, blockHash: '1', txid: '1' }],
        },
    },
    {
        result: [TRANSACTION.REMOVE, accountActions.updateAccount.type, BLOCKCHAIN.SYNCED],
        resultTxs: {
            'xpub-btc-deviceState': [],
        },
    },
    {
        result: [
            TRANSACTION.REMOVE,
            TRANSACTION.ADD,
            accountActions.updateAccount.type,
            BLOCKCHAIN.SYNCED,
        ],
        resultTxs: {
            'xpub-btc-deviceState': [{ blockHeight: 1, blockHash: '1', txid: '1' }],
        },
    },
    {
        result: [
            TRANSACTION.REMOVE,
            TRANSACTION.ADD,
            accountActions.updateAccount.type,
            BLOCKCHAIN.SYNCED,
        ],
        resultTxs: {
            'xpub-btc-deviceState': [{ blockHeight: 1, blockHash: '1a', txid: '1a' }],
        },
    },
    {
        result: [TRANSACTION.ADD, accountActions.updateAccount.type, BLOCKCHAIN.SYNCED],
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
        result: [TRANSACTION.ADD, accountActions.updateAccount.type, BLOCKCHAIN.SYNCED],
        resultTxs: {
            'xpub-btc-deviceState': [
                { blockHeight: 2, blockHash: '2', txid: '2' },
                { blockHeight: 3, blockHash: '3', txid: '3' },
                { blockHeight: 1, blockHash: '1', txid: '1' },
            ],
        },
    },
    {
        result: [TRANSACTION.ADD, accountActions.updateAccount.type, BLOCKCHAIN.SYNCED],
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
        result: [
            TRANSACTION.REMOVE,
            TRANSACTION.ADD,
            accountActions.updateAccount.type,
            BLOCKCHAIN.SYNCED,
        ],
        resultTxs: {
            'xpub-btc-deviceState': [
                { blockHeight: undefined, blockHash: undefined, txid: '0500' },
                { blockHeight: 4, blockHash: '04', txid: '0400' },
                { blockHeight: 3, blockHash: '03', txid: '0300' },
            ],
        },
    },
    {
        result: [
            TRANSACTION.REMOVE,
            TRANSACTION.ADD,
            accountActions.updateAccount.type,
            BLOCKCHAIN.SYNCED,
        ],
        resultTxs: {
            'xpub-btc-deviceState': [
                { blockHeight: undefined, blockHash: '04aa', txid: '04aa01' },
                { blockHeight: 4, blockHash: '04', txid: '0400' },
                { blockHeight: 3, blockHash: '03aa', txid: '03aa00' },
                { blockHeight: 2, blockHash: '02', txid: '0202' },
                { blockHeight: 2, blockHash: '02', txid: '0201' },
                { blockHeight: 1, blockHash: '01', txid: '0100' },
            ],
        },
    },
    {
        result: [
            TRANSACTION.REMOVE,
            TRANSACTION.ADD,
            accountActions.updateAccount.type,
            BLOCKCHAIN.SYNCED,
        ],
        resultTxs: {
            'xpub-btc-deviceState': [
                { blockHeight: 4, blockHash: '04aa', txid: '04aa00' },
                { blockHeight: 3, blockHash: '03aa', txid: '03aa01' },
                { blockHeight: 3, blockHash: '03aa', txid: '03aa00' },
            ],
        },
    },
];

// A little bit crazy test to avoid fixtures duplication
export const onBlock = analyzeTransactions
    // extend @wallet-utils/__fixtures__/transactionUtils
    .map((f, i) => ({
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
        ...analyzeTransactionsExtended[i],
    }))
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
            result: [accountActions.updateAccount.type, BLOCKCHAIN.SYNCED],
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
            result: [accountActions.updateAccount.type, BLOCKCHAIN.SYNCED],
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
            result: [accountActions.updateAccount.type, BLOCKCHAIN.SYNCED],
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
            result: [accountActions.updateAccount.type, BLOCKCHAIN.SYNCED],
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
            result: [accountActions.updateAccount.type, BLOCKCHAIN.SYNCED],
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
            result: [BLOCKCHAIN.SYNCED],
        },
    ] as any);

const seedBackends = (coins: string[]) =>
    coins.reduce(
        (prev, cur) => ({
            ...prev,
            [cur]: {
                backends: { selected: 'blockbook' as const, urls: { blockbook: ['http://url'] } },
            },
        }),
        { regtest: { backends: {} } },
    );

export const init = [
    {
        description: 'no accounts',
        initialState: {
            blockchain: seedBackends([]),
        },
        actions: [{ type: BLOCKCHAIN.UPDATE_FEE }],
        blockchainUnsubscribeFiatRates: 0,
        blockchainSetCustomBackend: 0,
    },
    {
        description: 'one coin and custom backend is present',
        initialState: {
            accounts: [{ symbol: 'btc' }],
            blockchain: seedBackends(['btc']),
        },
        actions: [{ type: BLOCKCHAIN.UPDATE_FEE }],
        blockchainUnsubscribeFiatRates: 1,
        blockchainSetCustomBackend: 1,
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
            blockchain: seedBackends(['btc', 'ltc', 'eth']),
        },
        actions: [{ type: BLOCKCHAIN.UPDATE_FEE }],
        blockchainUnsubscribeFiatRates: 3,
        blockchainSetCustomBackend: 3,
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
        actions: [
            { type: BLOCKCHAIN.UPDATE_FEE },
            { type: BLOCKCHAIN.SYNCED },
            { type: BLOCKCHAIN.CONNECTED },
        ],
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
        actions: [
            { type: BLOCKCHAIN.UPDATE_FEE },
            { type: BLOCKCHAIN.SYNCED },
            { type: BLOCKCHAIN.CONNECTED },
        ],
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
        actions: [
            { type: BLOCKCHAIN.UPDATE_FEE },
            { type: BLOCKCHAIN.SYNCED },
            { type: BLOCKCHAIN.CONNECTED },
        ],
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
        actions: [
            { type: BLOCKCHAIN.UPDATE_FEE },
            { type: BLOCKCHAIN.SYNCED },
            { type: BLOCKCHAIN.CONNECTED },
        ],
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
        actions: [{ type: BLOCKCHAIN.SYNCED }, { type: BLOCKCHAIN.CONNECTED }],
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
        getAccountInfo: 2,
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
        getAccountInfo: 2,
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

export const customBackend = [
    {
        description: 'enable coin with custom backend',
        initialState: {
            blockchain: seedBackends(['btc', 'eth']),
        },
        symbol: 'btc' as const,
        blockchainSetCustomBackend: 1,
    },
    {
        description: 'enable coin without custom backend',
        initialState: {
            blockchain: seedBackends([]),
        },
        symbol: 'btc' as const,
        blockchainSetCustomBackend: 1,
    },
];
