export const paramsError = (error: string, code?: string) => ({
    success: false,
    payload: {
        error,
        code,
    },
});

const fixtures = [
    {
        description: 'All accounts are empty',
        connect: {
            success: true,
            interruption: ['only-for-type-correctness'],
        },
        result: {
            failed: [],
        },
    },
    {
        description: 'Few accounts are not empty',
        connect: {
            success: true,
            usedAccounts: ["m/44'/0'/1'", "m/49'/0'/2'", "m/49'/2'/3'"],
        },
        result: {
            failed: [],
        },
    },
    {
        description: 'Few accounts failed on runtime',
        connect: {
            success: true,
            usedAccounts: ["m/44'/0'/1'", "m/49'/0'/2'", "m/44'/2'/3'"],
            failedAccounts: ["m/84'/0'/0'", "m/49'/0'/1'", "m/44'/2'/3'"],
        },
        result: {
            failed: [
                {
                    error: 'Runtime discovery error',
                    symbol: 'btc',
                    accountType: 'normal',
                },
                {
                    error: 'Runtime discovery error',
                    symbol: 'btc',
                    accountType: 'segwit',
                },
                {
                    error: 'Runtime discovery error',
                    symbol: 'ltc',
                    accountType: 'legacy',
                },
            ],
        },
    },
    {
        description: 'Account beyond the limit (10)',
        connect: {
            success: true,
            usedAccounts: ["m/44'/0'/20'"],
        },
        result: {
            failed: [],
        },
    },
    {
        description: 'First iteration btc account error',
        connect: {
            error: {
                error: '[{"index":0,"coin":"btc","exception":"Btc not supported"}]',
                code: 'bundle_fw_exception',
            },
            success: true,
        },
        result: {
            failed: [
                {
                    error: 'Btc not supported',
                    fwException: 'Btc not supported',
                    symbol: 'btc',
                    accountType: 'normal',
                },
            ],
        },
    },
    {
        description: 'First iteration multiple accounts error',
        connect: {
            error: {
                error: JSON.stringify([
                    {
                        index: 1,
                        coin: 'btc',
                        exception: 'Btc p2sh not supported',
                    },
                    {
                        index: 4,
                        coin: 'ltc',
                        exception: 'Ltc legacy not supported',
                    },
                ]),
                code: 'bundle_fw_exception',
            },
            success: true,
        },
        result: {
            failed: [
                {
                    error: 'Btc p2sh not supported',
                    fwException: 'Btc p2sh not supported',
                    symbol: 'btc',
                    accountType: 'segwit',
                },
                {
                    error: 'Ltc legacy not supported',
                    fwException: 'Ltc legacy not supported',
                    symbol: 'ltc',
                    accountType: 'legacy',
                },
            ],
        },
    },
    {
        description: 'First iteration other error',
        connect: {
            error: {
                error: 'Other error',
                code: undefined,
            },
        },
    },
];

export const interruptionFixtures = [
    {
        description: 'Interruption after 1st account, rejected event after 3rd account',
        connect: {
            success: true,
            interruption: ["m/44'/0'/0'"],
        },
        trigger: ["m/84'/0'/0'"],
    },
    {
        description: 'Interruption in third row (5 rows total)',
        connect: {
            success: true,
            usedAccounts: ["m/44'/0'/4'", "m/49'/0'/4'", "m/49'/2'/4'"],
            interruption: ["m/44'/0'/2'"],
        },
        trigger: ["m/49'/0'/2'"],
    },
    {
        description: 'Multiple interruptions',
        connect: {
            success: true,
            usedAccounts: ["m/84'/0'/4'", "m/49'/0'/4'", "m/44'/0'/4'"],
            interruption: ["m/49'/0'/0'", "m/49'/0'/1'", "m/44'/0'/1'", "m/44'/0'/2'"],
        },
        trigger: ["m/84'/0'/0'", "m/84'/0'/1'", "m/49'/0'/1'", "m/84'/0'/2'"],
    },
    {
        description:
            'Last account discovered, results from trezor-connect are ok, but discovery is expecting interruption',
        connect: {
            success: true,
        },
        trigger: 'last',
    },
];

export default fixtures;
