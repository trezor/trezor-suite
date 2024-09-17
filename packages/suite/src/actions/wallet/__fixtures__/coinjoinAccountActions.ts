import { notificationsActions } from '@suite-common/toast-notifications';
import { accountsActions } from '@suite-common/wallet-core';
import { Account } from 'src/types/wallet';
import * as COINJOIN from 'src/actions/wallet/constants/coinjoinConstants';

const ACCOUNT: Partial<Account> = {
    accountType: 'coinjoin',
    backendType: 'coinjoin',
    symbol: 'btc',
    deviceState: '1stTestnetAddress@device_id:0',
    key: '12345',
};

const CJ_ACCOUNT = {
    key: ACCOUNT.key,
    symbol: ACCOUNT.symbol,
};

const SESSION = { signedRounds: [] as string[], maxRounds: 10 };

export const createCoinjoinAccount = [
    {
        description: 'unsupported coinjoin client',
        params: {
            network: {
                symbol: 'ltc', // only btc is supported in tests
                networkType: 'bitcoin',
            },
            account: { accountType: 'coinjoin' },
        },
        result: {
            actions: [
                COINJOIN.CLIENT_ENABLE,
                COINJOIN.CLIENT_DISABLE,
                notificationsActions.addToast.type,
            ],
        },
    },
    {
        description: 'path not unlocked',
        connect: {
            success: false,
            payload: {
                error: 'Cancelled',
            },
        },
        params: {
            network: {
                symbol: 'btc',
                networkType: 'bitcoin',
            },
            account: {
                accountType: 'coinjoin',
            },
        },
        result: {
            actions: [
                COINJOIN.CLIENT_ENABLE,
                COINJOIN.CLIENT_ENABLE_SUCCESS,
                COINJOIN.ACCOUNT_PRELOADING,
                notificationsActions.addToast.type,
                COINJOIN.CLIENT_DISABLE,
                COINJOIN.ACCOUNT_PRELOADING,
            ],
        },
    },
    {
        description: 'public key not given',
        connect: [
            {
                success: true, // unlockPath
            },
            {
                success: false, // getPublicKey
                payload: {
                    error: 'Forbidden key path',
                },
            },
        ],
        params: {
            network: {
                symbol: 'btc',
                networkType: 'bitcoin',
            },
            account: {
                accountType: 'coinjoin',
                bip43Path: "m/10025'/1'/i'/1'",
            },
        },
        result: {
            actions: [
                COINJOIN.CLIENT_ENABLE,
                COINJOIN.CLIENT_ENABLE_SUCCESS,
                COINJOIN.ACCOUNT_PRELOADING,
                notificationsActions.addToast.type,
                COINJOIN.CLIENT_DISABLE,
                COINJOIN.ACCOUNT_PRELOADING,
            ],
        },
    },
    {
        description: 'success',
        connect: [
            {
                success: true, // unlockPath
            },
            {
                success: true, // getPublicKey
                payload: {
                    xpub: 'legacy-xpub',
                    xpubSegwit: 'xpub',
                },
            },
            {
                success: true, // getAccountInfo
                payload: {
                    xpub: 'legacy-xpub',
                    xpubSegwit: 'xpub',
                },
            },
        ],
        params: {
            network: {
                symbol: 'btc',
                networkType: 'bitcoin',
            },
            account: {
                accountType: 'coinjoin',
                bip43Path: "m/10025'/1'/i'/1'",
            },
        },
        result: {
            actions: [
                COINJOIN.CLIENT_ENABLE,
                COINJOIN.CLIENT_ENABLE_SUCCESS,
                COINJOIN.ACCOUNT_PRELOADING,
                accountsActions.createAccount.type,
                COINJOIN.ACCOUNT_DISCOVERY_RESET,
                COINJOIN.ACCOUNT_PRELOADING,
                accountsActions.startCoinjoinAccountSync.type,
                COINJOIN.ACCOUNT_DISCOVERY_PROGRESS,
                COINJOIN.ACCOUNT_SET_LIQUIDITY_CLUE,
                accountsActions.updateAccount.type,
                accountsActions.endCoinjoinAccountSync.type,
            ],
        },
    },
];

export const startCoinjoinSession = [
    {
        description: 'client not found',
        params: {
            ...ACCOUNT,
            symbol: 'ltc', // only btc is supported in tests
        },
        result: {
            actions: [
                COINJOIN.CLIENT_ENABLE,
                COINJOIN.CLIENT_DISABLE,
                notificationsActions.addToast.type,
            ],
        },
    },
    {
        description: 'authorizeCoinjoin cancelled',
        connect: {
            success: false,
            payload: {
                error: 'Cancelled',
            },
        },
        state: {
            coinjoin: {
                accounts: [CJ_ACCOUNT],
            },
        },
        params: ACCOUNT,
        result: {
            actions: [
                COINJOIN.CLIENT_ENABLE,
                COINJOIN.CLIENT_ENABLE_SUCCESS,
                COINJOIN.SESSION_STARTING,
                COINJOIN.ACCOUNT_AUTHORIZE,
                COINJOIN.ACCOUNT_AUTHORIZE_FAILED,
                notificationsActions.addToast.type,
                COINJOIN.SESSION_STARTING,
            ],
        },
    },
    {
        description: 'success',
        connect: {
            success: true,
            payload: {
                message: 'Authorized',
            },
        },
        state: {
            coinjoin: {
                accounts: [CJ_ACCOUNT],
            },
        },
        params: ACCOUNT,
        result: {
            actions: [
                COINJOIN.CLIENT_ENABLE,
                COINJOIN.CLIENT_ENABLE_SUCCESS,
                COINJOIN.SESSION_STARTING,
                COINJOIN.ACCOUNT_AUTHORIZE,
                COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS,
                COINJOIN.SESSION_STARTING,
            ],
        },
    },
];

export const stopCoinjoinSession = [
    {
        description: 'client not found',
        state: {
            accounts: [ACCOUNT],
            coinjoin: {
                accounts: [{ key: ACCOUNT.key }],
            },
        },
        param: '000',
        result: {
            actions: [],
        },
    },
    {
        description: 'success',
        client: 'btc',
        state: {
            accounts: [ACCOUNT],
            coinjoin: {
                accounts: [{ key: ACCOUNT.key }],
            },
        },
        param: '12345',
        result: {
            actions: ['@coinjoin/account-unregister'],
        },
    },
];

export const restoreCoinjoinAccounts = [
    {
        description: 'four accounts, two networks, one success, one failed',
        state: {
            accounts: [
                { key: 'account-1', symbol: 'regtest' }, // regtest is not supported in tests
                { key: 'account-2', symbol: 'regtest' },
                { key: 'account-A', symbol: 'btc' },
                { key: 'account-B', symbol: 'btc' },
            ],
            coinjoin: {
                clients: {},
                accounts: [
                    { key: 'account-2', symbol: 'regtest', session: { ...SESSION, paused: true } },
                    { key: 'account-B', symbol: 'regtest', session: { ...SESSION, paused: true } },
                    { key: 'account-A', symbol: 'btc', session: SESSION },
                    { key: 'account-1', symbol: 'btc', session: { ...SESSION, paused: true } },
                ],
            },
        },
        result: {
            actions: [
                COINJOIN.CLIENT_ENABLE,
                COINJOIN.CLIENT_DISABLE,
                notificationsActions.addToast.type, // failed account 1 + 2 client init
                COINJOIN.CLIENT_ENABLE,
                COINJOIN.CLIENT_ENABLE_SUCCESS, // success account A + B client init
            ],
        },
    },
];

export const restoreCoinjoinSession = [
    {
        description: 'restore one paused coinjoin session',
        client: 'btc',
        state: {
            accounts: [ACCOUNT],
            coinjoin: {
                accounts: [{ ...CJ_ACCOUNT, session: { ...SESSION, paused: true } }],
            },
        },
        param: '12345',
        result: {
            actions: [
                COINJOIN.SESSION_STARTING,
                COINJOIN.SESSION_RESTORE,
                COINJOIN.SESSION_STARTING,
            ],
        },
    },
];
