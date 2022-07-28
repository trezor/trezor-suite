export const createCoinjoinAccount = [
    {
        description: 'invalid accountType',
        params: {
            accountType: 'segwit',
        },
        result: {
            actions: 0,
        },
    },
    {
        description: 'experimental features not enabled',
        connect: {
            success: false,
        },
        params: {
            accountType: 'coinjoin',
        },
        result: {
            actions: 1, // notification
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
            accountType: 'coinjoin',
        },
        result: {
            actions: 1, // notification
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
            actions: 3, // @account/create + @coinjoin/account-create + @account/account-update actions
        },
    },
];
