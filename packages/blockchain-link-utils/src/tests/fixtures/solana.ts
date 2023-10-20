import BigNumber from 'bignumber.js';

const parsedTransactions = {
    withoutMeta: {
        transaction: {
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
};
