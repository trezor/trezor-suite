import { testMocks } from '@suite-common/test-utils';

import type { TransactionsState } from '../transactionsReducer';
import type { transactionsActions } from '../transactionsActions';

const ACCOUNT = testMocks.getWalletAccount();

export const addTransaction: {
    description: string;
    initialState: Partial<TransactionsState>;
    actionPayload: ReturnType<typeof transactionsActions.addTransaction>['payload'];
    result: Partial<TransactionsState>;
}[] = [
    {
        description: 'tx exists and will NOT be replaced',
        initialState: {
            transactions: { [ACCOUNT.key]: [testMocks.getWalletTransaction()] },
        },
        actionPayload: {
            account: ACCOUNT,
            transactions: [testMocks.getWalletTransaction({ amount: '2000' })], // NOTE: different amount
        },
        result: { [ACCOUNT.key]: [testMocks.getWalletTransaction()] },
    },
    {
        description: 'pending tx will be replaced by mined tx',
        initialState: {
            transactions: {
                [ACCOUNT.key]: [testMocks.getWalletTransaction({ blockHeight: -1 })],
            },
        },
        actionPayload: {
            account: ACCOUNT,
            transactions: [testMocks.getWalletTransaction()],
        },
        result: { [ACCOUNT.key]: [testMocks.getWalletTransaction()] },
    },
    {
        description: 'mined tx will be replaced by mined tx with greater blockHeight',
        initialState: {
            transactions: {
                [ACCOUNT.key]: [testMocks.getWalletTransaction({ blockHeight: 1 })],
            },
        },
        actionPayload: {
            account: ACCOUNT,
            transactions: [testMocks.getWalletTransaction({ blockHeight: 2 })],
        },
        result: { [ACCOUNT.key]: [testMocks.getWalletTransaction({ blockHeight: 2 })] },
    },
    {
        description: 'pending tx will be replaced pending tx with greater blockTime',
        initialState: {
            transactions: {
                [ACCOUNT.key]: [testMocks.getWalletTransaction({ blockHeight: -1, blockTime: 1 })],
            },
        },
        actionPayload: {
            account: ACCOUNT,
            transactions: [testMocks.getWalletTransaction({ blockHeight: -1, blockTime: 2 })],
        },
        result: {
            [ACCOUNT.key]: [testMocks.getWalletTransaction({ blockHeight: -1, blockTime: 2 })],
        },
    },
    {
        description: 'mined tx will be replaced mined tx with greater blockTime',
        initialState: {
            transactions: {
                [ACCOUNT.key]: [testMocks.getWalletTransaction({ blockTime: 1 })],
            },
        },
        actionPayload: {
            account: ACCOUNT,
            transactions: [testMocks.getWalletTransaction({ blockTime: 2 })],
        },
        result: {
            [ACCOUNT.key]: [testMocks.getWalletTransaction({ blockTime: 2 })],
        },
    },
    {
        description: 'mined tx will NOT be replaced by pending tx with greater blockTime',
        initialState: {
            transactions: {
                [ACCOUNT.key]: [testMocks.getWalletTransaction({ blockTime: 1 })],
            },
        },
        actionPayload: {
            account: ACCOUNT,
            transactions: [
                testMocks.getWalletTransaction({
                    blockHeight: 0,
                    blockTime: 2,
                }),
            ],
        },
        result: {
            [ACCOUNT.key]: [testMocks.getWalletTransaction({ blockTime: 1 })],
        },
    },
    {
        description: 'pending tx will be replaced by pending tx with rbfParams',
        initialState: {
            transactions: {
                [ACCOUNT.key]: [testMocks.getWalletTransaction({ blockHeight: undefined })],
            },
        },
        actionPayload: {
            account: ACCOUNT,
            transactions: [
                testMocks.getWalletTransaction({
                    blockHeight: undefined,
                    rbfParams: { txid: '00', utxo: [], outputs: [], feeRate: '1', baseFee: 1 },
                }),
            ],
        },
        result: {
            [ACCOUNT.key]: [
                testMocks.getWalletTransaction({
                    blockHeight: undefined,
                    rbfParams: { txid: '00', utxo: [], outputs: [], feeRate: '1', baseFee: 1 },
                }),
            ],
        },
    },
    {
        description: 'mined tx will NOT be replaced by pending tx with rbfParams',
        initialState: {
            transactions: {
                [ACCOUNT.key]: [testMocks.getWalletTransaction()],
            },
        },
        actionPayload: {
            account: ACCOUNT,
            transactions: [
                testMocks.getWalletTransaction({
                    blockHeight: 0,
                    rbfParams: { txid: '00', utxo: [], outputs: [], feeRate: '1', baseFee: 1 },
                }),
            ],
        },
        result: {
            [ACCOUNT.key]: [testMocks.getWalletTransaction()],
        },
    },
    {
        description: 'tx with deadline will be replaced',
        initialState: {
            transactions: {
                [ACCOUNT.key]: [testMocks.getWalletTransaction({ txid: '00', deadline: 1 })],
            },
        },
        actionPayload: {
            account: ACCOUNT,
            transactions: [testMocks.getWalletTransaction({ txid: '00' })],
        },
        result: { [ACCOUNT.key]: [testMocks.getWalletTransaction({ txid: '00' })] },
    },
];

export const removeTransaction: {
    description: string;
    initialState: Partial<TransactionsState>;
    actionPayload: ReturnType<typeof transactionsActions.removeTransaction>['payload'];
    result: Partial<TransactionsState>;
}[] = [
    {
        description: 'tx will be removed from existing account',
        initialState: {
            transactions: {
                [ACCOUNT.key]: [testMocks.getWalletTransaction()],
            },
        },
        actionPayload: {
            account: ACCOUNT,
            txs: [testMocks.getWalletTransaction()],
        },
        result: { [ACCOUNT.key]: [] },
    },
    {
        description:
            'removing tx from nonexistent account, must NOT add accountKey into transactions',
        initialState: {
            transactions: {},
        },
        actionPayload: {
            account: ACCOUNT,
            txs: [testMocks.getWalletTransaction()],
        },
        result: {},
    },
];
