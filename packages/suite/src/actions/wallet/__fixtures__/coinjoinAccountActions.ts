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
                '@notification/toast',
            ],
        },
    },
    {
        description: 'experimental features not enabled',
        connect: {
            success: false,
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
                '@notification/toast',
            ],
        },
    },
    {
        description: 'public key not given',
        connect: [
            {
                success: true, // applySettings
            },
            {
                success: false, // getPublicKey
            },
        ],
        params: {
            symbol: 'btc',
            networkType: 'bitcoin',
            accountType: 'coinjoin',
        },
        result: {
            actions: ['@notification/toast'],
        },
    },
    {
        description: 'success',
        connect: [
            {
                success: true, // applySettings
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
        },
        result: {
            actions: ['@account/create', '@coinjoin/account-create', '@account/update'],
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
                '@notification/toast',
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
                '@notification/toast',
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
