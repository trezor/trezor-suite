import BigNumber from 'bignumber.js';

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
            },
            expectedOutput: 'recv',
        },
        {
            description: 'should return "unknown" if none of the conditions match',
            input: {
                transaction: parsedTransactions.justWithFee.transaction,
                effects: [effects.positive],
                accountAddress: 'someOtherAddress',
            },
            expectedOutput: 'unknown',
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
    transformTransaction: [
        {
            description: 'should return null when tx is null',
            input: {
                transaction: null,
                accountAddress: 'myAddress',
                slotToBlockHeightMapping: {},
            },
            expectedOutput: null,
        },
        {
            description: 'should return null when tx.meta is null',
            input: {
                transaction: {
                    transaction: {
                        signatures: ['txid1'],
                    },
                    blockTime: 1631753600,
                },
                accountAddress: 'myAddress',
                slotToBlockHeightMapping: {},
            },
            expectedOutput: null,
        },
        {
            description: 'should return null when tx.transaction is null',
            input: {
                transaction: {
                    meta: {},
                    blockTime: 1631753600,
                },
                accountAddress: 'myAddress',
                slotToBlockHeightMapping: {},
            },
            expectedOutput: null,
        },
        {
            description: 'should return null when tx.blockTime is null',
            input: {
                transaction: {
                    meta: {},
                    transaction: {
                        signatures: ['txid2'],
                    },
                },
                accountAddress: 'myAddress',
                slotToBlockHeightMapping: {},
            },
            expectedOutput: null,
        },
        {
            description: 'should return a valid Transaction object when all inputs are valid',
            input: {
                transaction: parsedTransactions.basic.transaction,
                accountAddress: effects.negative.address,
                slotToBlockHeightMapping: { 5: 20 },
            },
            expectedOutput: {
                type: 'sent',
                txid: 'txid1',
                blockTime: 1631753600,
                blockHeight: 20,
                amount: '-20',
                fee: '10',
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
};
