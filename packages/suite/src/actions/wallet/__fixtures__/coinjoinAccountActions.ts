import { notificationsActions } from '@suite-common/toast-notifications';
import { accountsActions } from '@suite-common/wallet-core';

const ACCOUNT = {
    accountType: 'coinjoin',
    backendType: 'coinjoin',
    symbol: 'btc',
    deviceState: 'device-state',
};

export const createCoinjoinAccount = [
    {
        description: 'unsupported Coinjoin client',
        params: {
            symbol: 'ltc', // only btc is supported in tests
            networkType: 'bitcoin',
            accountType: 'coinjoin',
        },
        result: {
            actions: [
                '@coinjoin/client-enable',
                '@coinjoin/client-enable-failed',
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
            symbol: 'btc',
            networkType: 'bitcoin',
            accountType: 'coinjoin',
        },
        result: {
            actions: [
                '@coinjoin/client-enable',
                '@coinjoin/client-enable-success',
                '@coinjoin/account-preloading',
                notificationsActions.addToast.type,
                '@coinjoin/account-preloading',
                '@coinjoin/client-disable',
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
            symbol: 'btc',
            networkType: 'bitcoin',
            accountType: 'coinjoin',
            bip43Path: "m/10025'/1'/i'/1'",
        },
        result: {
            actions: [
                '@coinjoin/account-preloading',
                notificationsActions.addToast.type,
                '@coinjoin/account-preloading',
                '@coinjoin/client-disable',
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
            symbol: 'btc',
            networkType: 'bitcoin',
            accountType: 'coinjoin',
            bip43Path: "m/10025'/1'/i'/1'",
        },
        result: {
            actions: [
                '@coinjoin/account-preloading',
                accountsActions.createAccount.type,
                '@coinjoin/account-create',
                '@coinjoin/account-preloading',
                accountsActions.startCoinjoinAccountSync.type,
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
                '@coinjoin/client-enable',
                '@coinjoin/client-enable-failed',
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
        params: ACCOUNT,
        result: {
            actions: [
                '@coinjoin/account-authorize',
                '@coinjoin/account-authorize-failed',
                notificationsActions.addToast.type,
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
        params: ACCOUNT,
        result: {
            actions: ['@coinjoin/account-authorize', '@coinjoin/account-authorize-success'], // authorize, success
        },
    },
];

export const stopCoinjoinSession = [
    {
        description: 'client not found',
        params: {
            ...ACCOUNT,
            symbol: 'ltc', // only btc is supported in tests
        },
        result: {
            actions: [],
        },
    },
    {
        description: 'success',
        params: ACCOUNT,
        result: {
            actions: ['@coinjoin/account-unregister'],
        },
    },
];
