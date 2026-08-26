import { type UnknownAction } from '@reduxjs/toolkit';

import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type AccountsState,
    type BlockchainState,
    accountsActions,
    blockchainActions,
    feesActions,
    transactionsActions,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import { analyzeTransactions } from '@suite-common/wallet-utils/src/__fixtures__/transactionUtils';
import { type BlockchainBlock, type BlockchainNotification } from '@trezor/connect-common';
import { type DeepPartial } from '@trezor/type-utils';

const DEFAULT_ACCOUNT = {
    deviceState: '1stTestnetAddress@device_id:0',
    symbol: 'btc',
    networkType: 'bitcoin',
    descriptor: 'xpub',
    key: 'xpub-btc-deviceState',
    visible: true,
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
        result: [accountsActions.updateAccount.type, blockchainActions.synced.type],
    },
    {
        result: [
            transactionsActions.addTransaction.type,
            accountsActions.updateAccount.type,
            blockchainActions.synced.type,
        ],
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
        result: [
            transactionsActions.addTransaction.type,
            accountsActions.updateAccount.type,
            blockchainActions.synced.type,
        ],
        resultTxs: {
            'xpub-btc-deviceState': [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
        },
    },
    {
        result: [accountsActions.updateAccount.type, blockchainActions.synced.type],
        resultTxs: {
            'xpub-btc-deviceState': [{ blockHeight: undefined, blockHash: '1', txid: '1' }],
        },
    },
    {
        result: [
            transactionsActions.removeTransaction.type,
            accountsActions.updateAccount.type,
            blockchainActions.synced.type,
        ],
        resultTxs: {
            'xpub-btc-deviceState': [],
        },
    },
    {
        result: [
            transactionsActions.removeTransaction.type,
            accountsActions.updateAccount.type,
            blockchainActions.synced.type,
        ],
        resultTxs: {
            'xpub-btc-deviceState': [{ blockHeight: 1, blockHash: '1', txid: '1' }],
        },
    },
    {
        result: [
            transactionsActions.removeTransaction.type,
            accountsActions.updateAccount.type,
            blockchainActions.synced.type,
        ],
        resultTxs: {
            'xpub-btc-deviceState': [],
        },
    },
    {
        result: [
            transactionsActions.removeTransaction.type,
            transactionsActions.addTransaction.type,
            accountsActions.updateAccount.type,
            blockchainActions.synced.type,
        ],
        resultTxs: {
            'xpub-btc-deviceState': [{ blockHeight: 1, blockHash: '1', txid: '1' }],
        },
    },
    {
        result: [
            transactionsActions.removeTransaction.type,
            transactionsActions.addTransaction.type,
            accountsActions.updateAccount.type,
            blockchainActions.synced.type,
        ],
        resultTxs: {
            'xpub-btc-deviceState': [{ blockHeight: 1, blockHash: '1a', txid: '1a' }],
        },
    },
    {
        result: [
            transactionsActions.addTransaction.type,
            accountsActions.updateAccount.type,
            blockchainActions.synced.type,
        ],
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
        result: [
            transactionsActions.addTransaction.type,
            accountsActions.updateAccount.type,
            blockchainActions.synced.type,
        ],
        resultTxs: {
            'xpub-btc-deviceState': [
                { blockHeight: 2, blockHash: '2', txid: '2' },
                { blockHeight: 3, blockHash: '3', txid: '3' },
                { blockHeight: 1, blockHash: '1', txid: '1' },
            ],
        },
    },
    {
        result: [
            transactionsActions.addTransaction.type,
            accountsActions.updateAccount.type,
            blockchainActions.synced.type,
        ],
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
            transactionsActions.removeTransaction.type,
            transactionsActions.addTransaction.type,
            accountsActions.updateAccount.type,
            blockchainActions.synced.type,
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
            transactionsActions.removeTransaction.type,
            transactionsActions.addTransaction.type,
            accountsActions.updateAccount.type,
            blockchainActions.synced.type,
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
            transactionsActions.removeTransaction.type,
            transactionsActions.addTransaction.type,
            accountsActions.updateAccount.type,
            blockchainActions.synced.type,
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

/** Partial state passed directly to the test store initializer. */
type FixtureState = unknown;

/** Opaque mock responses passed directly to setTrezorConnectFixtures. */
type ConnectFixtures = unknown;

type OnBlockFixture = {
    description: string;
    connect?: ConnectFixtures;
    block: DeepPartial<BlockchainBlock>;
    state: FixtureState;
    result?: string[];
    resultTxs?: {
        'xpub-btc-deviceState': Array<{
            blockHeight: number | undefined;
            blockHash: string | undefined;
            txid: string;
        }>;
    };
};

type OnConnectFixture = {
    description: string;
    connect?: ConnectFixtures;
    initialState?: FixtureState;
    symbol: string;
    actions: UnknownAction[];
    blockchainEstimateFee: number;
    blockchainSubscribe: number;
};

// Fake timer handle seeded into blockchain[symbol].syncTimeout by the onDisconnect fixtures.
export const MOCK_SYNC_TIMEOUT = 42;

type OnDisconnectFixture = {
    description: string;
    initialState?: FixtureState;
    symbol: string;
    identity?: string;
    // The thunk armed a new sync timeout; the test asserts it fires syncAccountsWithBlockchainThunk.
    armsTimer?: boolean;
    // The seeded MOCK_SYNC_TIMEOUT handle must survive untouched (no clearTimeout call).
    keepsTimer?: boolean;
    // The seeded MOCK_SYNC_TIMEOUT handle must be cleared.
    clearsTimer?: boolean;
    actions: UnknownAction[];
};

type OnNotificationFixture = {
    description: string;
    initialState?: FixtureState;
    params: DeepPartial<BlockchainNotification>;
    actions: UnknownAction[];
    getAccountInfo: number;
};

type CustomBackendFixture = {
    description: string;
    initialState: FixtureState;
    symbol: 'btc';
    blockchainSetCustomBackend: number;
};

// A little bit crazy test to avoid fixtures duplication
export const onBlock: OnBlockFixture[] = analyzeTransactions
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
                    total: 1,
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
            result: [accountsActions.updateAccount.type, blockchainActions.synced.type],
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
            result: [accountsActions.updateAccount.type, blockchainActions.synced.type],
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
            result: [accountsActions.updateAccount.type, blockchainActions.synced.type],
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
            result: [accountsActions.updateAccount.type, blockchainActions.synced.type],
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
            result: [accountsActions.updateAccount.type, blockchainActions.synced.type],
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
            result: [blockchainActions.synced.type],
        },
        {
            description: 'external backend network is skipped without a custom backend',
            block: { coin: { shortcut: 'pol' } },
            state: {
                accounts: [{ ...DEFAULT_ACCOUNT, symbol: 'pol', networkType: 'ethereum' }],
            },
        },
        {
            description: 'external backend network syncs when a custom backend is configured',
            block: { coin: { shortcut: 'pol' } },
            state: {
                accounts: [
                    { ...DEFAULT_ACCOUNT, symbol: 'pol', networkType: 'ethereum', visible: false },
                ],
                blockchain: {
                    pol: {
                        backends: { selected: 'blockbook', urls: { blockbook: ['http://url'] } },
                    },
                },
            },
            result: [blockchainActions.synced.type],
        },
    ] as any);

const seedBackends = (coins: string[]): DeepPartial<BlockchainState> =>
    coins.reduce(
        (prev, cur) => ({
            ...prev,
            [cur]: {
                backends: { selected: 'blockbook' as const, urls: { blockbook: ['http://url'] } },
            },
        }),
        { regtest: { backends: {} } },
    );

type InitFixture = {
    description: string;
    initialState?: {
        accounts?: DeepPartial<AccountsState>;
        blockchain?: DeepPartial<BlockchainState>;
    };
    actions: UnknownAction[];
    blockchainSetCustomBackend: number;
};

export const init: InitFixture[] = [
    {
        description: 'no accounts',
        initialState: {
            blockchain: seedBackends([]),
        },
        actions: [{ type: feesActions.updateMultipleFees.type }],
        blockchainSetCustomBackend: 0,
    },
    {
        description: 'one coin and custom backend is present',
        initialState: {
            accounts: [{ symbol: 'btc' }],
            blockchain: seedBackends(['btc']),
        },
        actions: [{ type: feesActions.updateMultipleFees.type }],
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
        actions: [{ type: feesActions.updateMultipleFees.type }],
        blockchainSetCustomBackend: 3,
    },
];

export const onConnect: OnConnectFixture[] = [
    {
        description: 'unknown coin',
        symbol: 'btc-invalid',
        actions: [],
        blockchainEstimateFee: 0,
        blockchainSubscribe: 0,
    },
    {
        description: 'successful, no accounts, no subscriptions',
        symbol: 'btc',
        actions: [
            { type: blockchainActions.synced.type },
            { type: blockchainActions.connected.type },
        ],
        blockchainEstimateFee: 1,
        blockchainSubscribe: 0,
    },
    {
        description: 'successful, different coin accounts, no subscriptions',
        initialState: {
            accounts: [{ symbol: 'ltc' }],
        },
        symbol: 'btc',
        actions: [
            { type: blockchainActions.synced.type },
            { type: blockchainActions.connected.type },
        ],
        blockchainEstimateFee: 1,
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
            { type: blockchainActions.synced.type },
            { type: blockchainActions.connected.type },
        ],
        blockchainEstimateFee: 1,
        blockchainSubscribe: 1,
    },
    {
        description: 'successful, fee levels sorted',
        initialState: {
            accounts: [{ symbol: 'btc', history: {} }],
        },
        // order: estimateFee
        connect: [
            { payload: { levels: [{ label: 'normal' }, { label: 'high' }, { label: 'low' }] } },
        ],
        symbol: 'btc',
        actions: [
            { type: blockchainActions.synced.type },
            { type: blockchainActions.connected.type },
        ],
        blockchainEstimateFee: 1,
        blockchainSubscribe: 1,
    },
    {
        description: 'successful, blockchainEstimateFee errored',
        initialState: {
            accounts: [{ symbol: 'btc', history: {} }],
        },
        // order: estimateFee > subscribe > estimateFee
        connect: [{ success: false }, undefined, { success: false }],
        symbol: 'btc',
        actions: [
            { type: updateFeeInfoThunk.rejected.type },
            { type: blockchainActions.synced.type },
            { type: blockchainActions.connected.type },
        ],
        blockchainEstimateFee: 1,
        blockchainSubscribe: 1,
    },
    {
        description: 'successful, ETH blockchainEstimateFee errored',
        initialState: {
            accounts: [{ symbol: 'eth', history: {}, deviceState: 'abc' }],
        },
        // order: estimateFee > subscribe > subscribe > estimateFee
        connect: [{ success: false }, undefined, undefined, { success: false }],
        symbol: 'eth',
        actions: [
            { type: updateFeeInfoThunk.rejected.type },
            { type: blockchainActions.synced.type },
            { type: blockchainActions.connected.type },
        ],
        blockchainEstimateFee: 1,
        blockchainSubscribe: 2,
    },
];

export const onDisconnect: OnDisconnectFixture[] = [
    {
        description: 'unknown coin',
        symbol: 'btc-invalid',
        actions: [],
    },
    {
        description: 'without accounts, without armed timer, does nothing',
        symbol: 'btc',
        actions: [],
    },
    {
        description: 'without accounts, with armed timer, stops the sync chain',
        initialState: {
            blockchain: {
                btc: { syncTimeout: MOCK_SYNC_TIMEOUT },
            },
        },
        symbol: 'btc',
        clearsTimer: true,
        actions: [
            {
                type: blockchainActions.synced.type,
                payload: { symbol: 'btc', timeout: undefined },
            },
        ],
    },
    {
        description: 'with accounts, without armed timer, re-arms the sync chain',
        initialState: {
            accounts: [{ symbol: 'btc', visible: true }],
        },
        symbol: 'btc',
        armsTimer: true,
        actions: [
            {
                type: blockchainActions.synced.type,
                payload: { symbol: 'btc' },
            },
        ],
    },
    {
        description: 'with accounts, with armed timer, keeps the existing chain',
        initialState: {
            accounts: [{ symbol: 'btc' }],
            blockchain: {
                btc: { syncTimeout: MOCK_SYNC_TIMEOUT },
            },
        },
        symbol: 'btc',
        keepsTimer: true,
        actions: [],
    },
    {
        description: 'identity-scoped error, with accounts, re-arms a missing sync chain',
        initialState: {
            accounts: [
                {
                    symbol: 'eth',
                    visible: true,
                    deviceState: '1stTestnetAddress@device_id:0',
                },
            ],
        },
        symbol: 'eth',
        identity: '1stTestnetAddress@device_id:0',
        armsTimer: true,
        actions: [
            {
                type: blockchainActions.synced.type,
                payload: { symbol: 'eth' },
            },
        ],
    },
    {
        description: 'identity-scoped error, with accounts, keeps an armed chain',
        initialState: {
            accounts: [{ symbol: 'eth', deviceState: '1stTestnetAddress@device_id:0' }],
            blockchain: {
                eth: { syncTimeout: MOCK_SYNC_TIMEOUT },
            },
        },
        symbol: 'eth',
        identity: '1stTestnetAddress@device_id:0',
        keepsTimer: true,
        actions: [],
    },
];

export const onNotification: OnNotificationFixture[] = [
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
        description: 'pending btc tx, only matched account refetched',
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
        actions: [
            { type: notificationsActions.addEvent.type, payload: { formattedAmount: '0.001 BTC' } },
        ],
        getAccountInfo: 1,
    },
    {
        description: 'pending token tx, only matched account refetched',
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
        actions: [
            {
                type: notificationsActions.addEvent.type,
                payload: { formattedAmount: '0.001 erc20' },
            },
        ],
        getAccountInfo: 1,
    },
    {
        description: 'sent btc, only matched account refetched',
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
        getAccountInfo: 1,
    },
    {
        description: 'sent eth, only matched account refetched',
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

export const customBackend: CustomBackendFixture[] = [
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
