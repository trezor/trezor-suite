import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import type { transactionsActions } from '../transactionsActions';
import type { TransactionsState } from '../transactionsReducerTypes';

const ACCOUNT = mockWalletAccount({
    descriptor: asAccountDescriptor('btc1'),
    symbol: asNetworkSymbol('btc'),
    deviceState: '1@2:3',
});

const tx = (txid: string, overrides?: Partial<WalletAccountTransaction>) =>
    testMocks.getWalletTransaction({ txid, ...overrides });

const sparse = (length: number, slots: Record<number, WalletAccountTransaction | undefined>) =>
    Object.assign(new Array<WalletAccountTransaction>(length), slots);

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
                    rbfParams: {
                        type: 'bitcoin',
                        txid: '00',
                        utxo: [],
                        outputs: [],
                        feeRate: '1',
                        baseFee: 1,
                    },
                }),
            ],
        },
        result: {
            [ACCOUNT.key]: [
                testMocks.getWalletTransaction({
                    blockHeight: undefined,
                    rbfParams: {
                        type: 'bitcoin',
                        txid: '00',
                        utxo: [],
                        outputs: [],
                        feeRate: '1',
                        baseFee: 1,
                    },
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
                    rbfParams: {
                        type: 'bitcoin',
                        txid: '00',
                        utxo: [],
                        outputs: [],
                        feeRate: '1',
                        baseFee: 1,
                    },
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
    {
        description: 'confirmed tx replaces the fake pending record in place, keeping its position',
        initialState: {
            transactions: {
                [ACCOUNT.key]: [
                    testMocks.getWalletTransaction({
                        txid: '00',
                        blockHeight: undefined,
                        deadline: 10,
                    }),
                    testMocks.getWalletTransaction({ txid: '01' }),
                ],
            },
        },
        actionPayload: {
            account: ACCOUNT,
            transactions: [testMocks.getWalletTransaction({ txid: '00', blockHeight: 11 })],
        },
        result: {
            [ACCOUNT.key]: [
                testMocks.getWalletTransaction({ txid: '00', blockHeight: 11 }),
                testMocks.getWalletTransaction({ txid: '01' }),
            ],
        },
    },
    {
        description: 'page into an empty account leaves the slots before it empty',
        initialState: { transactions: {} },
        actionPayload: {
            account: ACCOUNT,
            transactions: [tx('a'), tx('b')],
            page: 2,
            perPage: 2,
        },
        result: { [ACCOUNT.key]: sparse(4, { 2: tx('a'), 3: tx('b') }) },
    },
    {
        description: 'page overwrites stored txs by position, the overwritten tx is not re-added',
        initialState: {
            transactions: { [ACCOUNT.key]: [tx('o0'), tx('o1'), tx('o2'), tx('o3'), tx('o4')] },
        },
        actionPayload: {
            account: ACCOUNT,
            transactions: [tx('new'), tx('o0'), tx('o1')],
            page: 1,
            perPage: 3,
        },
        result: { [ACCOUNT.key]: [tx('new'), tx('o0'), tx('o1'), tx('o3'), tx('o4')] },
    },
    {
        description: 'repeated txid within one page updates its first copy',
        initialState: { transactions: {} },
        actionPayload: {
            account: ACCOUNT,
            transactions: [tx('a', { blockHeight: 0 }), tx('a')],
            page: 1,
            perPage: 2,
        },
        result: { [ACCOUNT.key]: [tx('a')] },
    },
    {
        description: 'stored tx is found at its shifted position after a prepend',
        initialState: { transactions: { [ACCOUNT.key]: [tx('x', { blockHeight: 0 })] } },
        actionPayload: {
            account: ACCOUNT,
            transactions: [tx('new'), tx('x')],
        },
        result: { [ACCOUNT.key]: [tx('new'), tx('x')] },
    },
    {
        description: 'tx prepended earlier in the same payload is updated by its later copy',
        initialState: { transactions: {} },
        actionPayload: {
            account: ACCOUNT,
            transactions: [tx('a', { blockHeight: 0 }), tx('b'), tx('a')],
        },
        result: { [ACCOUNT.key]: [tx('b'), tx('a')] },
    },
    {
        description: 'prepend turns empty slots into undefined',
        initialState: { transactions: { [ACCOUNT.key]: sparse(3, { 0: tx('a'), 2: tx('b') }) } },
        actionPayload: {
            account: ACCOUNT,
            transactions: [tx('new')],
        },
        result: {
            [ACCOUNT.key]: sparse(4, { 0: tx('new'), 1: tx('a'), 2: undefined, 3: tx('b') }),
        },
    },
    {
        description: 'page overwriting the first of duplicate txs updates the later copy',
        initialState: {
            transactions: {
                [ACCOUNT.key]: [tx('d', { blockHeight: 1 }), tx('y'), tx('d', { blockHeight: 2 })],
            },
        },
        actionPayload: {
            account: ACCOUNT,
            transactions: [tx('z'), tx('d', { blockHeight: 5 })],
            page: 1,
            perPage: 2,
        },
        result: { [ACCOUNT.key]: [tx('z'), tx('y'), tx('d', { blockHeight: 5 })] },
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
    {
        description: 'tx with an empty txid is removed',
        initialState: { transactions: { [ACCOUNT.key]: [tx(''), tx('01')] } },
        actionPayload: {
            account: ACCOUNT,
            txs: [{ txid: '' }],
        },
        result: { [ACCOUNT.key]: [tx('01')] },
    },
    {
        description: 'undefined slots are kept and empty slots dropped',
        initialState: {
            transactions: { [ACCOUNT.key]: sparse(4, { 0: tx('a'), 1: undefined, 3: tx('b') }) },
        },
        actionPayload: {
            account: ACCOUNT,
            txs: [{ txid: 'a' }],
        },
        result: { [ACCOUNT.key]: sparse(2, { 0: undefined, 1: tx('b') }) },
    },
];
