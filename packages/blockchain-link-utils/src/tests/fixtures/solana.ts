import BigNumber from 'bignumber.js';

const getPublicKey = (address: string) => ({
    toString: () => address,
});

const instructions = {
    transfer: {
        parsed: {
            type: 'transfer',
        },
    },
    nonTransfer: {
        parsed: {
            type: 'nonTransfer',
        },
    },
    notParsed: {},
    tokenTransfer: {
        parsed: {
            info: {
                authority: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                destination: '2SyRvfaD5abg8j4cRfHViFXRh5KThuBBEU24RX8Cgrm3',
                mint: 'So11111111111111111111111111111111111111112',
                source: 'FRoT98CfAt984ZS9n1rmtw1p9nrTCzCcC6sygivztyZN',
                tokenAmount: {
                    amount: '2000000',
                    decimals: 9,
                    uiAmount: 0.002,
                    uiAmountString: '0.002',
                },
            },
            type: 'transferChecked',
        },
        program: 'spl-token',
    },
    secondTokenTransfer: {
        parsed: {
            info: {
                authority: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                destination: 'H8TGGw7Z85w1wDxcH3aTBAyCoCYsDQZrKUim7fwtKAMs',
                mint: 'DH1nKg3QZStnVh4bjm8kyWfsRJkiweXcnL4j7Ug3PfYA',
                source: '2Bwv9hYm3isiJtUJoWSiy46Na612c4xzNszp5NckWofu',
                tokenAmount: {
                    amount: '2',
                    decimals: 1,
                    uiAmount: 2,
                    uiAmountString: '2',
                },
            },
            type: 'transferChecked',
        },
        program: 'spl-token',
    },
    // without mint and tokenAmount
    tokenTransferToAssociated: {
        parsed: {
            info: {
                amount: '1534951700',
                authority: '5oPm4YqwfGceRoyAYJUZ3FqLb5KvhkLFTzRv92gXzCtz',
                destination: 'CoWky2oRf1LEENrV7WsFFzFgrbs14y5PibvtetdfTvXg',
                source: 'DaL2xPLQQ2rxHyqQxaE9E44Boa5bRpnfAZt9HaRMr9RY',
            },
            type: 'transfer',
        },
        program: 'spl-token',
    },
};

const parsedTransactions = {
    basic: {
        transaction: {
            meta: {
                computeUnitsConsumed: 100,
                preBalances: [200, 100],
                postBalances: [180, 110],
                fee: 10,
            },
            transaction: {
                signatures: ['txid1'],
                message: {
                    accountKeys: [
                        { pubkey: { toString: () => 'address1' } },
                        { pubkey: { toString: () => 'address2' } },
                    ],
                    instructions: [instructions.transfer],
                },
            },
            version: 'legacy',
            blockTime: 1631753600,
            slot: 5,
        },
    },
    withoutMeta: {
        transaction: {
            transaction: {
                message: {
                    accountKeys: [{ pubkey: { toString: () => 'address1' } }],
                },
            },
        },
    },
    withMeta: {
        transaction: {
            meta: {
                preBalances: [100, 200],
                postBalances: [110, 210],
            },
            transaction: {
                message: {
                    accountKeys: [
                        { pubkey: { toString: () => 'address1' } },
                        { pubkey: { toString: () => 'address2' } },
                    ],
                },
            },
        },
    },
    empty: {
        transaction: {
            transaction: {
                message: {
                    accountKeys: [],
                },
            },
        },
    },
    withZeroEffects: {
        transaction: {
            transaction: {
                message: {
                    accountKeys: [
                        { pubkey: { toString: () => 'address1' } },
                        { pubkey: { toString: () => 'address2' } },
                    ],
                },
            },
            meta: {
                preBalances: [100, 200],
                postBalances: [100, 200],
            },
        },
    },
    justWithFee: {
        transaction: {
            transaction: {
                message: {
                    instructions: [instructions.transfer],
                },
            },
            meta: {
                fee: 5,
            },
        },
    },
    singleTokenTransfer: {
        transaction: {
            meta: {},
            transaction: {
                signatures: ['txid1'],
                message: {
                    accountKeys: [
                        { pubkey: { toString: () => 'address1' } },
                        { pubkey: { toString: () => 'address2' } },
                    ],
                    instructions: [instructions.tokenTransfer],
                },
            },
            version: 'legacy',
            blockTime: 1631753600,
            slot: 5,
        },
    },
    multiTokenTransfer: {
        transaction: {
            meta: {},
            transaction: {
                signatures: ['txid1'],
                message: {
                    accountKeys: [
                        { pubkey: { toString: () => 'address1' } },
                        { pubkey: { toString: () => 'address2' } },
                    ],
                    instructions: [instructions.tokenTransfer, instructions.secondTokenTransfer],
                },
            },
            version: 'legacy',
            blockTime: 1631753600,
            slot: 5,
        },
    },
    tokenTransferToAssociated: {
        transaction: {
            meta: {},
            transaction: {
                signatures: ['txid1'],
                message: {
                    accountKeys: [
                        { pubkey: { toString: () => 'address1' } },
                        { pubkey: { toString: () => 'address2' } },
                    ],
                    instructions: [instructions.tokenTransferToAssociated],
                },
            },
            version: 'legacy',
            blockTime: 1631753600,
            slot: 5,
        },
    },
};

const effects = {
    negative: {
        address: 'address1',
        amount: new BigNumber(-20),
    },
    positive: {
        address: 'address2',
        amount: new BigNumber(10),
    },
};

const sampleMintToDetailMap = {
    So11111111111111111111111111111111111111112: {
        name: 'Wrapped SOL',
        symbol: 'WSOL',
    },
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: {
        name: 'Tether',
        symbol: 'USDT',
    },
    '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': {
        name: 'Raydium',
        symbol: 'RAY',
    },
};

const tokenAccountInfo = [
    {
        account: {
            data: {
                parsed: {
                    info: {
                        isNative: false,
                        mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
                        owner: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                        state: 'initialized',
                        tokenAmount: {
                            amount: '2000000',
                            decimals: 6,
                            uiAmount: 2,
                            uiAmountString: '2',
                        },
                    },
                    type: 'account',
                },
                program: 'spl-token',
                space: 165,
            },
            executable: false,
            lamports: 2039280,
            owner: getPublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            rentEpoch: 0,
        },
        pubkey: getPublicKey('ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF'),
    },
];

const tokenAccountInfoWithDuplicateTokenAccount = [
    {
        account: {
            data: {
                parsed: {
                    info: {
                        isNative: false,
                        mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
                        owner: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                        state: 'initialized',
                        tokenAmount: {
                            amount: '2000000',
                            decimals: 6,
                            uiAmount: 2,
                            uiAmountString: '2',
                        },
                    },
                    type: 'account',
                },
                program: 'spl-token',
                space: 165,
            },
            executable: false,
            lamports: 2039280,
            owner: getPublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            rentEpoch: 0,
        },
        pubkey: getPublicKey('ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF'),
    },
    {
        account: {
            data: {
                parsed: {
                    info: {
                        isNative: false,
                        mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
                        owner: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                        state: 'initialized',
                        tokenAmount: {
                            amount: '1000000',
                            decimals: 6,
                            uiAmount: 2,
                            uiAmountString: '1',
                        },
                    },
                    type: 'account',
                },
                program: 'spl-token',
                space: 165,
            },
            executable: false,
            lamports: 2039280,
            owner: getPublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            rentEpoch: 0,
        },
        pubkey: getPublicKey('CR6QfobBidQTSYdR6jihKTfMnHkRUtw8cLDCxENDVYmd'),
    },
];

const tokenEffects = {
    sent: {
        type: 'sent',
        standard: 'SPL',
        from: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
        to: 'GrwHUG2U6Nmr2CHjQ2kesKzbjMwvCNytcMAbhQxq1Jyd',
        contract: '6YuhWADZyAAxAaVKPm1G5N51RvDBXsnWo4SfsJ47wSoK',
        decimals: 9,
        name: '6YuhWADZyAAxAaVKPm1G5N51RvDBXsnWo4SfsJ47wSoK',
        symbol: '6Yu...',
        amount: '10',
    },
    recv: {
        type: 'recv',
        standard: 'SPL',
        from: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
        to: 'GrwHUG2U6Nmr2CHjQ2kesKzbjMwvCNytcMAbhQxq1Jyd',
        contract: '6YuhWADZyAAxAaVKPm1G5N51RvDBXsnWo4SfsJ47wSoK',
        decimals: 9,
        name: '6YuhWADZyAAxAaVKPm1G5N51RvDBXsnWo4SfsJ47wSoK',
        symbol: '6Yu...',
        amount: '20',
    },
};

export const fixtures = {
    extractAccountBalanceDiff: [
        {
            description: 'should return null if the address is not found in the transaction',
            input: {
                transaction: parsedTransactions.withMeta.transaction,
                address: 'nonexistentAddress',
            },
            expectedOutput: null,
        },
        {
            description:
                'should return preBalance and postBalance if the address is found in the transaction',
            input: { transaction: parsedTransactions.withMeta.transaction, address: 'address2' },
            expectedOutput: {
                preBalance: new BigNumber(200),
                postBalance: new BigNumber(210),
            },
        },
        {
            description: 'should return default values (0) if meta is not provided',
            input: { transaction: parsedTransactions.withoutMeta.transaction, address: 'address1' },
            expectedOutput: {
                preBalance: new BigNumber(0),
                postBalance: new BigNumber(0),
            },
        },
    ],
    getTransactionEffects: [
        {
            description: 'should return an empty array if there are no account keys',
            input: parsedTransactions.empty,
            expectedOutput: [],
        },
        {
            description: 'should return an empty array if there are no effects',
            input: parsedTransactions.withZeroEffects,
            expectedOutput: [],
        },
        {
            description: 'should return transaction effects',
            input: parsedTransactions.withMeta,
            expectedOutput: [
                {
                    address: 'address1',
                    amount: new BigNumber(10),
                },
                {
                    address: 'address2',
                    amount: new BigNumber(10),
                },
            ],
        },
    ],
    getTxType: [
        {
            description: 'should return "failed" if the transaction has an error',
            input: {
                transaction: {
                    meta: {
                        fee: 10,
                        err: 'Transaction failed',
                    },
                },
                effects: [],
                accountAddress: 'myAddress',
                tokenEffects: [],
            },
            expectedOutput: 'failed',
        },
        {
            description: 'should return "unknown" if instructions are not transfer',
            input: {
                transaction: {
                    transaction: {
                        message: {
                            instructions: [instructions.nonTransfer],
                        },
                    },
                },
                effects: [effects.negative],
                accountAddress: effects.negative.address,
                tokenEffects: [],
            },
            expectedOutput: 'unknown',
        },
        {
            description: 'should return "unknown" if at least single instruction is not parsed',
            input: {
                transaction: {
                    transaction: {
                        message: {
                            instructions: [instructions.notParsed],
                        },
                    },
                },
                effects: [effects.negative],
                accountAddress: effects.negative.address,
                tokenEffects: [],
            },
            expectedOutput: 'unknown',
        },
        {
            description: 'should return "self" if it matches a self-transaction with fee',
            input: {
                transaction: {
                    transaction: {
                        message: {
                            instructions: [instructions.transfer],
                        },
                    },
                    meta: {
                        fee: effects.negative.amount.abs().toString(),
                    },
                },
                effects: [effects.negative],
                accountAddress: effects.negative.address,
                tokenEffects: [],
            },
            expectedOutput: 'self',
        },
        {
            description:
                'should return "sent" if there are negative effects and the account address is a sender',
            input: {
                transaction: parsedTransactions.justWithFee.transaction,
                effects: [effects.negative],
                accountAddress: effects.negative.address,
                tokenEffects: [],
            },
            expectedOutput: 'sent',
        },
        {
            description:
                'should return "recv" if there are positive effects and the account address is a receiver',
            input: {
                transaction: parsedTransactions.justWithFee.transaction,
                effects: [effects.positive],
                accountAddress: effects.positive.address,
                tokenEffects: [],
            },
            expectedOutput: 'recv',
        },
        {
            description: 'should return "unknown" if none of the conditions match',
            input: {
                transaction: parsedTransactions.justWithFee.transaction,
                effects: [effects.positive],
                accountAddress: 'someOtherAddress',
                tokenEffects: [],
            },
            expectedOutput: 'unknown',
        },
        {
            description: 'should return "sent" for token transfer',
            input: {
                transaction: parsedTransactions.justWithFee.transaction,
                effects: [effects.negative],
                accountAddress: 'someOtherAddress',
                tokenEffects: [tokenEffects.sent],
            },
            expectedOutput: 'sent',
        },
        {
            description: 'should return "recv" for token receive',
            input: {
                transaction: parsedTransactions.justWithFee.transaction,
                effects: [],
                accountAddress: 'someOtherAddress',
                tokenEffects: [tokenEffects.recv],
            },
            expectedOutput: 'recv',
        },
    ],
    getTargets: [
        {
            description: 'should return an array with a target for "self" transaction type',
            input: {
                effects: [effects.negative],
                txType: 'self',
                accountAddress: effects.negative.address,
            },
            expectedOutput: [
                {
                    n: 0,
                    addresses: [effects.negative.address],
                    isAddress: true,
                    amount: effects.negative.amount.abs().toString(),
                    isAccountTarget: true,
                },
            ],
        },
        {
            description: 'should return an array with a target for "sent" transaction type',
            input: {
                effects: [effects.positive, effects.negative],
                txType: 'sent',
                accountAddress: effects.negative.address,
            },
            expectedOutput: [
                {
                    n: 0,
                    addresses: [effects.positive.address],
                    isAddress: true,
                    amount: effects.positive.amount.abs().toString(),
                    isAccountTarget: false,
                },
            ],
        },
        {
            description: 'should return an array with a target for "recv" transaction type',
            input: {
                effects: [effects.positive, effects.negative],
                txType: 'recv',
                accountAddress: effects.positive.address,
            },
            expectedOutput: [
                {
                    n: 0,
                    addresses: [effects.positive.address],
                    isAddress: true,
                    amount: effects.positive.amount.abs().toString(),
                    isAccountTarget: true,
                },
            ],
        },
        {
            description: 'should return an empty array for "unknown" transaction type',
            input: {
                effects: [effects.positive, effects.negative],
                txType: 'unknown',
                accountAddress: 'someOtherAddress',
            },
            expectedOutput: [],
        },
    ],
    getAmount: [
        {
            description: 'should return "0" if accountEffect is undefined',
            input: {
                accountEffect: undefined,
                txType: 'recv',
            },
            expectedOutput: '0',
        },
        {
            description:
                'should return the absolute amount as a string for "self" transaction type',
            input: {
                accountEffect: effects.negative,
                txType: 'self',
            },
            expectedOutput: effects.negative.amount.abs().toString(),
        },
        {
            description: 'should return the amount as a string for other transaction types',
            input: {
                accountEffect: effects.positive,
                txType: 'unknown',
            },
            expectedOutput: effects.positive.amount.toString(),
        },
    ],
    getDetails: [
        {
            description: 'should return transaction details with valid inputs',
            input: {
                transaction: parsedTransactions.basic.transaction,
                effects: [effects.positive, effects.negative],
                accountAddress: effects.negative.address,
            },
            expectedOutput: {
                size: parsedTransactions.basic.transaction.meta.computeUnitsConsumed,
                totalInput: effects.negative.amount.abs().toString(),
                totalOutput: effects.positive.amount.abs().toString(),
                vin: [
                    {
                        txid: 'txid1',
                        version: 'legacy',
                        isAddress: true,
                        isAccountOwned: true,
                        n: 0,
                        value: effects.negative.amount.abs().toString(),
                        addresses: [effects.negative.address],
                    },
                ],
                vout: [
                    {
                        txid: 'txid1',
                        version: 'legacy',
                        isAddress: true,
                        isAccountOwned: false,
                        n: 0,
                        value: effects.positive.amount.abs().toString(),
                        addresses: [effects.positive.address],
                    },
                ],
            },
        },
    ],
    getTokens: [
        {
            description: 'should return an empty array if transaction contains no token transfers',
            input: {
                transaction: parsedTransactions.basic.transaction,
                accountAddress: 'someAddress',
                map: sampleMintToDetailMap,
                tokenAccountsInfos: [],
            },
            expectedOutput: [],
        },
        {
            description: 'parses a single token transfer',
            input: {
                transaction: parsedTransactions.tokenTransferToAssociated.transaction,
                accountAddress: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                map: sampleMintToDetailMap,
                tokenAccountsInfos: [
                    {
                        address: 'CoWky2oRf1LEENrV7WsFFzFgrbs14y5PibvtetdfTvXg',
                        mint: 'So11111111111111111111111111111111111115555',
                        decimals: 1,
                    },
                ],
            },
            expectedOutput: [
                {
                    type: 'recv',
                    standard: 'SPL',
                    from: '5oPm4YqwfGceRoyAYJUZ3FqLb5KvhkLFTzRv92gXzCtz',
                    to: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                    contract: 'So11111111111111111111111111111111111115555',
                    decimals: 1,
                    name: 'So11111111111111111111111111111111111115555',
                    symbol: 'So1...',
                    amount: '1534951700',
                },
            ],
        },
        {
            description: 'parses a token transfer to associated token account',
            input: {
                transaction: parsedTransactions.singleTokenTransfer.transaction,
                accountAddress: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                map: sampleMintToDetailMap,
                tokenAccountsInfos: [],
            },
            expectedOutput: [
                {
                    type: 'sent',
                    standard: 'SPL',
                    from: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                    to: '2SyRvfaD5abg8j4cRfHViFXRh5KThuBBEU24RX8Cgrm3',
                    contract: 'So11111111111111111111111111111111111111112',
                    decimals: 9,
                    name: 'Wrapped SOL',
                    symbol: 'WSOL',
                    amount: '2000000',
                },
            ],
        },
        {
            description: 'parses multiple token transfers',
            input: {
                transaction: parsedTransactions.multiTokenTransfer.transaction,
                accountAddress: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                map: sampleMintToDetailMap,
                tokenAccountsInfos: [],
            },
            expectedOutput: [
                {
                    type: 'sent',
                    standard: 'SPL',
                    from: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                    to: '2SyRvfaD5abg8j4cRfHViFXRh5KThuBBEU24RX8Cgrm3',
                    contract: 'So11111111111111111111111111111111111111112',
                    decimals: 9,
                    name: 'Wrapped SOL',
                    symbol: 'WSOL',
                    amount: '2000000',
                },
                {
                    type: 'sent',
                    standard: 'SPL',
                    from: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                    to: 'H8TGGw7Z85w1wDxcH3aTBAyCoCYsDQZrKUim7fwtKAMs',
                    contract: 'DH1nKg3QZStnVh4bjm8kyWfsRJkiweXcnL4j7Ug3PfYA',
                    decimals: 1,
                    name: 'DH1nKg3QZStnVh4bjm8kyWfsRJkiweXcnL4j7Ug3PfYA',
                    symbol: 'DH1...',
                    amount: '2',
                },
            ],
        },
    ],
    transformTransaction: [
        {
            description: 'should return a valid Transaction object when all inputs are valid',
            input: {
                transaction: parsedTransactions.basic.transaction,
                accountAddress: effects.negative.address,
                tokenAccountsInfos: [],
            },
            expectedOutput: {
                type: 'sent',
                txid: 'txid1',
                blockTime: 1631753600,
                amount: '-20',
                fee: '10',
                solanaSpecific: {
                    status: 'confirmed',
                },
                targets: [
                    {
                        addresses: ['address2'],
                        amount: '10',
                        isAccountTarget: false,
                        isAddress: true,
                        n: 0,
                    },
                ],
                tokens: [],
                internalTransfers: [],
                details: {
                    size: 100,
                    totalInput: '20',
                    totalOutput: '10',
                    vin: [
                        {
                            txid: 'txid1',
                            version: 'legacy',
                            isAddress: true,
                            isAccountOwned: true,
                            n: 0,
                            value: effects.negative.amount.abs().toString(),
                            addresses: [effects.negative.address],
                        },
                    ],
                    vout: [
                        {
                            txid: 'txid1',
                            version: 'legacy',
                            isAddress: true,
                            isAccountOwned: false,
                            n: 0,
                            value: effects.positive.amount.abs().toString(),
                            addresses: [effects.positive.address],
                        },
                    ],
                },
            },
        },
    ],
    getTokenNameAndSymbol: [
        {
            description: 'parses non-whitelist token data from mint',
            input: {
                mint: 'AQoKYV7tYpTrFZN6P5oUufbQKAUr9mNYGe1TTJC5wajM',
                map: sampleMintToDetailMap,
            },
            expectedOutput: {
                name: 'AQoKYV7tYpTrFZN6P5oUufbQKAUr9mNYGe1TTJC5wajM',
                symbol: 'AQo...',
            },
        },
        {
            description: 'parses whitelisted token data from mint',
            input: {
                mint: 'So11111111111111111111111111111111111111112',
                map: sampleMintToDetailMap,
            },
            expectedOutput: {
                name: 'Wrapped SOL',
                symbol: 'WSOL',
            },
        },
    ],
    transformTokenInfo: [
        {
            description: 'parses token info from token accounts api response',
            input: {
                accountInfo: tokenAccountInfo,
                map: sampleMintToDetailMap,
            },
            expectedOutput: [
                {
                    type: 'SPL',
                    contract: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
                    balance: '2000000',
                    decimals: 6,
                    name: 'Raydium',
                    symbol: 'RAY',
                    accounts: [
                        {
                            balance: '2000000',
                            publicKey: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                        },
                    ],
                },
            ],
        },
        {
            description:
                'parses token info for multiple token accounts with the same token from api response',
            input: {
                accountInfo: tokenAccountInfoWithDuplicateTokenAccount,
                map: sampleMintToDetailMap,
            },
            expectedOutput: [
                {
                    type: 'SPL',
                    contract: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
                    balance: '3000000',
                    decimals: 6,
                    name: 'Raydium',
                    symbol: 'RAY',
                    accounts: [
                        {
                            balance: '2000000',
                            publicKey: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                        },
                        {
                            balance: '1000000',
                            publicKey: 'CR6QfobBidQTSYdR6jihKTfMnHkRUtw8cLDCxENDVYmd',
                        },
                    ],
                },
            ],
        },
    ],
};
