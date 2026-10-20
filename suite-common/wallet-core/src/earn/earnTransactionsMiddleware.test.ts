import { combineReducers } from '@reduxjs/toolkit';

import {
    type AnalyticsDep,
    type AnalyticsSharedEvents,
    type events,
} from '@suite-common/analytics';
import { deviceInitialState } from '@suite-common/device';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    createNotificationsReducer,
    notificationsActions,
    selectNotifications,
} from '@suite-common/toast-notifications';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { type AccountTransaction } from '@trezor/connect';
import { isNative } from '@trezor/env-utils';
import { type WithServices } from '@trezor/redux-utils';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import {
    type EarnTransactionsMiddlewareState,
    prepareEarnTransactionsMiddleware,
} from './earnTransactionsMiddleware';
import {
    type EarnTransactionFlow,
    type TrackedEarnTransaction,
    earnTransactionsReducer,
    selectTrackedEarnTransaction,
} from './earnTransactionsReducer';
import { notifyEarnTransactionBroadcastThunk } from './earnTransactionsThunks';
import { mockEarnTransactionsState, mockTrackedEarnTransaction } from '../../mocks';
import { transactionsActions } from '../transactions/transactionsActions';
import { prepareTransactionsReducer } from '../transactions/transactionsReducer';

const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    deviceState: '1@2:3',
    descriptor: asAccountDescriptor('accA'),
});

const createTransaction = (
    txid: string,
    overrides: Partial<AccountTransaction> = {},
): AccountTransaction => ({
    txid,
    type: 'self',
    blockHeight: 100,
    blockTime: 1,
    amount: '0',
    fee: '0',
    targets: [],
    tokens: [],
    internalTransfers: [],
    details: { vin: [], vout: [], size: 0, totalInput: '0', totalOutput: '0' },
    ...overrides,
});

const transaction = (overrides: Partial<AccountTransaction> = {}) =>
    createTransaction('local-txid', overrides);
const broadcast = () =>
    transactionsActions.transactionBroadcastStatus({
        account,
        flow: 'stake',
        status: 'success',
        txid: 'local-txid',
    });

const { reducer: notificationsReducer } = createNotificationsReducer();

const analytics = mockAnalytics<AnalyticsSharedEvents>();
const transactionsReducer = prepareTransactionsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadTransactions: mockReducer() },
});
const initStore = (trackedTransactions: TrackedEarnTransaction[] = []) =>
    createTestCompositionRoot<WithServices<AnalyticsDep>, EarnTransactionsMiddlewareState>({
        services: () => ({ analytics }),
        middleware: [prepareEarnTransactionsMiddleware(() => ({ services: { analytics } }))],
        reducer: {
            wallet: combineReducers({
                earnTransactions: earnTransactionsReducer,
                transactions: transactionsReducer,
                accounts: (state = [account]) => state,
            }),
            device: (state = deviceInitialState) => state,
            notifications: notificationsReducer,
        },
        preloadedState: {
            wallet: { earnTransactions: mockEarnTransactionsState(trackedTransactions) },
        },
    }).services.store;

const getToastPayloads = (store: ReturnType<typeof initStore>) =>
    store
        .getActions()
        .filter(notificationsActions.addToast.match)
        .map(action => action.payload);

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isNative: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isNative).mockReturnValue(false);
});

describe('prepareEarnTransactionsMiddleware', () => {
    it('shows the confirmed toast and untracks a tracked transaction once it is written as confirmed', () => {
        const store = initStore([
            mockTrackedEarnTransaction({ accountKey: account.key, txid: 'tx1', flow: 'stake' }),
        ]);

        store.dispatch(
            transactionsActions.addTransaction({
                account,
                transactions: [createTransaction('tx1')],
            }),
        );

        expect(getToastPayloads(store)).toEqual([
            expect.objectContaining({ type: 'tx-staked', stage: 'confirmed', txid: 'tx1' }),
        ]);
        expect(selectTrackedEarnTransaction(store.getState(), account.key, 'tx1')).toBeUndefined();
    });

    it('reports and untracks a mobile confirmation without desktop toasts', () => {
        jest.mocked(isNative).mockReturnValue(true);
        const store = initStore();
        store.dispatch(broadcast());
        store.dispatch(
            transactionsActions.addTransaction({ account, transactions: [transaction()] }),
        );

        expect(analytics.report).toHaveBeenCalledTimes(2);
        expect(analytics.report).toHaveBeenLastCalledWith({
            type: 'transaction/broadcast-status',
            payload: {
                stage: 'confirmation',
                status: 'success',
                networkSymbol: account.symbol,
                flow: 'stake',
                isCancellation: false,
                isRbf: false,
            },
        });
        expect(store.getState().wallet.earnTransactions).toEqual({});
        expect(getToastPayloads(store)).toEqual([]);
    });

    it('replaces the pending entry with the confirmed one in the notification list', () => {
        const store = initStore([
            mockTrackedEarnTransaction({ accountKey: account.key, txid: 'tx1', flow: 'stake' }),
        ]);
        store.dispatch(
            notificationsActions.addToast({
                type: 'tx-staked',
                stage: 'pending',
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid: 'tx1',
            }),
        );

        store.dispatch(
            transactionsActions.addTransaction({
                account,
                transactions: [createTransaction('tx1')],
            }),
        );

        expect(selectNotifications(store.getState())).toEqual([
            expect.objectContaining({ type: 'tx-staked', stage: 'confirmed', txid: 'tx1' }),
        ]);
    });

    it('ignores a tracked transaction that is still pending', () => {
        const store = initStore([
            mockTrackedEarnTransaction({ accountKey: account.key, txid: 'tx1', flow: 'stake' }),
        ]);

        store.dispatch(
            transactionsActions.addTransaction({
                account,
                transactions: [createTransaction('tx1', { blockHeight: undefined })],
            }),
        );

        expect(getToastPayloads(store)).toEqual([]);
        expect(selectTrackedEarnTransaction(store.getState(), account.key, 'tx1')).toMatchObject({
            flow: 'stake',
        });
    });

    it('untracks a failed transaction without a toast', () => {
        const store = initStore([
            mockTrackedEarnTransaction({ accountKey: account.key, txid: 'tx1', flow: 'claim' }),
        ]);

        store.dispatch(
            transactionsActions.addTransaction({
                account,
                transactions: [createTransaction('tx1', { type: 'failed' })],
            }),
        );

        expect(getToastPayloads(store)).toEqual([]);
        expect(selectTrackedEarnTransaction(store.getState(), account.key, 'tx1')).toBeUndefined();
    });

    it('shows the toast only once when the same confirmed transaction is written again', () => {
        const store = initStore([
            mockTrackedEarnTransaction({ accountKey: account.key, txid: 'tx1', flow: 'unstake' }),
        ]);
        const transactions = [createTransaction('tx1')];

        store.dispatch(transactionsActions.addTransaction({ account, transactions }));
        store.dispatch(transactionsActions.addTransaction({ account, transactions }));

        expect(getToastPayloads(store)).toHaveLength(1);
    });

    it('does not introduce staking notifications for approval confirmations', () => {
        const store = initStore([]);
        store.dispatch(
            transactionsActions.transactionBroadcastStatus({
                account,
                flow: 'approve',
                status: 'success',
                txid: 'tx1',
            }),
        );
        store.dispatch(
            transactionsActions.addTransaction({
                account,
                transactions: [createTransaction('tx1')],
            }),
        );
        expect(getToastPayloads(store)).toEqual([]);
        expect(selectTrackedEarnTransaction(store.getState(), account.key, 'tx1')).toBeUndefined();
    });

    it.each<EarnTransactionFlow>([
        'stake',
        'claim',
        'yield-deposit',
        'yield-withdraw',
        'yield-redeem',
        'merkl-claim',
    ])('shows only the confirmed toast for a fast %s confirmation', flow => {
        const store = initStore([]);
        store.dispatch(
            transactionsActions.addTransaction({
                account,
                transactions: [createTransaction('tx1')],
            }),
        );
        store.dispatch(notifyEarnTransactionBroadcastThunk({ account, flow, txid: 'tx1' }));
        expect(getToastPayloads(store)).toEqual([
            expect.objectContaining({ stage: 'confirmed', txid: 'tx1' }),
        ]);
        expect(selectNotifications(store.getState())).toEqual([
            expect.objectContaining({ stage: 'confirmed', txid: 'tx1' }),
        ]);
        expect(analytics.report).toHaveBeenCalledTimes(2);
    });

    it('does not show a staking toast for an on-chain cancellation', () => {
        const store = initStore([]);
        store.dispatch(
            notifyEarnTransactionBroadcastThunk({
                account,
                flow: 'stake',
                isCancellation: true,
                prevTxid: 'original',
                txid: 'tx1',
            }),
        );
        store.dispatch(
            transactionsActions.addTransaction({
                account,
                transactions: [createTransaction('tx1')],
            }),
        );
        expect(getToastPayloads(store)).toEqual([]);
    });

    it('leaves transactions it does not track alone', () => {
        const store = initStore([
            mockTrackedEarnTransaction({ accountKey: account.key, txid: 'tx1', flow: 'stake' }),
        ]);

        store.dispatch(
            transactionsActions.addTransaction({
                account,
                transactions: [createTransaction('tx9')],
            }),
        );

        expect(getToastPayloads(store)).toEqual([]);
        expect(selectTrackedEarnTransaction(store.getState(), account.key, 'tx1')).toMatchObject({
            flow: 'stake',
        });
    });
});

describe('Earn transaction status', () => {
    it('reports broadcast acceptance immediately, with only coarse attributes', () => {
        const store = initStore();
        store.dispatch(broadcast());
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'transaction/broadcast-status',
            payload: {
                stage: 'broadcast',
                status: 'success',
                networkSymbol: account.symbol,
                flow: 'stake',
                isCancellation: false,
                isRbf: false,
            },
        });
        expect(
            selectTrackedEarnTransaction(store.getState(), account.key, 'local-txid'),
        ).toMatchObject({ flow: 'stake' });
    });

    it.each<events.TransactionBroadcastStatusFlow>([
        'stake',
        'unstake',
        'claim',
        'withdraw',
        'vote',
        'yield-deposit',
        'yield-withdraw',
        'yield-redeem',
        'merkl-claim',
        'approve',
        'revoke',
        'wrap',
        'unwrap',
    ])('tracks broadcast and confirmation for %s without leaking transaction data', flow => {
        const store = initStore();
        store.dispatch(
            transactionsActions.transactionBroadcastStatus({
                account,
                flow,
                status: 'success',
                txid: 'local-txid',
            }),
        );
        store.dispatch(
            transactionsActions.addTransaction({ account, transactions: [transaction()] }),
        );
        expect(analytics.report.mock.calls).toEqual([
            [
                {
                    type: 'transaction/broadcast-status',
                    payload: {
                        stage: 'broadcast',
                        status: 'success',
                        networkSymbol: account.symbol,
                        flow,
                        isCancellation: false,
                        isRbf: false,
                    },
                },
            ],
            [
                {
                    type: 'transaction/broadcast-status',
                    payload: {
                        stage: 'confirmation',
                        status: 'success',
                        networkSymbol: account.symbol,
                        flow,
                        isCancellation: false,
                        isRbf: false,
                    },
                },
            ],
        ]);
    });

    it.each([
        ['stake', 'self'],
        ['unstake', 'failed'],
        ['yield-deposit', 'self'],
        ['yield-withdraw', 'failed'],
    ] as const)('reports an on-chain cancellation of %s with its original flow', (flow, type) => {
        const store = initStore();
        store.dispatch(
            transactionsActions.transactionBroadcastStatus({
                account,
                flow,
                isCancellation: true,
                isRbf: true,
                status: 'success',
                txid: 'local-txid',
            }),
        );
        store.dispatch(
            transactionsActions.addTransaction({ account, transactions: [transaction({ type })] }),
        );
        expect(analytics.report.mock.calls).toEqual([
            [
                {
                    type: 'transaction/broadcast-status',
                    payload: {
                        stage: 'broadcast',
                        status: 'success',
                        networkSymbol: account.symbol,
                        flow,
                        isCancellation: true,
                        isRbf: true,
                    },
                },
            ],
            [
                {
                    type: 'transaction/broadcast-status',
                    payload: {
                        stage: 'confirmation',
                        status: type === 'failed' ? 'error' : 'success',
                        networkSymbol: account.symbol,
                        flow,
                        isCancellation: true,
                        isRbf: true,
                    },
                },
            ],
        ]);
    });

    it.each([
        { flow: 'approve', isCancellation: false, isRbf: false },
        { flow: 'unstake', isCancellation: true, isRbf: true },
        { flow: 'stake', isCancellation: false, isRbf: true },
    ] as const)(
        'reports a rejected $flow broadcast (cancel=$isCancellation, rbf=$isRbf) without tracking a confirmation',
        ({ flow, isCancellation, isRbf }) => {
            const store = initStore();
            store.dispatch(
                transactionsActions.transactionBroadcastStatus({
                    account,
                    flow,
                    isCancellation,
                    isRbf,
                    status: 'error',
                }),
            );
            expect(analytics.report).toHaveBeenCalledWith({
                type: 'transaction/broadcast-status',
                payload: {
                    stage: 'broadcast',
                    status: 'error',
                    networkSymbol: account.symbol,
                    flow,
                    isCancellation,
                    isRbf,
                },
            });
            expect(store.getState().wallet.earnTransactions).toEqual({});
        },
    );

    it.each(['self', 'failed'] as const)(
        'preserves the speedup flag through a terminal %s result',
        type => {
            const store = initStore();
            store.dispatch(
                transactionsActions.transactionBroadcastStatus({
                    account,
                    flow: 'stake',
                    status: 'success',
                    txid: 'local-txid',
                    isRbf: true,
                }),
            );
            store.dispatch(
                transactionsActions.addTransaction({
                    account,
                    transactions: [transaction({ type })],
                }),
            );
            expect(analytics.report.mock.calls).toEqual([
                [
                    {
                        type: 'transaction/broadcast-status',
                        payload: {
                            stage: 'broadcast',
                            status: 'success',
                            networkSymbol: account.symbol,
                            flow: 'stake',
                            isCancellation: false,
                            isRbf: true,
                        },
                    },
                ],
                [
                    {
                        type: 'transaction/broadcast-status',
                        payload: {
                            stage: 'confirmation',
                            status: type === 'failed' ? 'error' : 'success',
                            networkSymbol: account.symbol,
                            flow: 'stake',
                            isCancellation: false,
                            isRbf: true,
                        },
                    },
                ],
            ]);
        },
    );

    it.each(['self', 'failed'] as const)('reports a terminal %s transaction once', type => {
        const store = initStore();
        store.dispatch(broadcast());
        const update = transactionsActions.addTransaction({
            account,
            transactions: [transaction({ type })],
        });
        store.dispatch(update);
        store.dispatch(update);
        expect(analytics.report).toHaveBeenCalledTimes(2);
        expect(analytics.report).toHaveBeenLastCalledWith({
            type: 'transaction/broadcast-status',
            payload: {
                stage: 'confirmation',
                status: type === 'failed' ? 'error' : 'success',
                networkSymbol: account.symbol,
                flow: 'stake',
                isCancellation: false,
                isRbf: false,
            },
        });
        expect(store.getState().wallet.earnTransactions).toEqual({});
    });

    it('ignores pending transactions and unrelated account history', () => {
        const store = initStore();
        store.dispatch(broadcast());
        store.dispatch(
            transactionsActions.addTransaction({
                account,
                transactions: [
                    transaction({ blockHeight: undefined }),
                    transaction({ txid: 'unrelated' }),
                ],
            }),
        );
        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(
            selectTrackedEarnTransaction(store.getState(), account.key, 'local-txid'),
        ).toBeDefined();
    });

    it('recognizes Solana confirmation without a block height', () => {
        const store = initStore();
        store.dispatch(broadcast());
        store.dispatch(
            transactionsActions.addTransaction({
                account,
                transactions: [
                    transaction({
                        blockHeight: undefined,
                        solanaSpecific: { status: 'confirmed' },
                    }),
                ],
            }),
        );
        expect(analytics.report).toHaveBeenLastCalledWith({
            type: 'transaction/broadcast-status',
            payload: {
                stage: 'confirmation',
                status: 'success',
                networkSymbol: account.symbol,
                flow: 'stake',
                isCancellation: false,
                isRbf: false,
            },
        });
    });

    it('handles confirmation arriving before the broadcast response', () => {
        const store = initStore();
        store.dispatch(
            transactionsActions.addTransaction({ account, transactions: [transaction()] }),
        );
        expect(analytics.report).not.toHaveBeenCalled();
        store.dispatch(broadcast());
        expect(analytics.report).toHaveBeenCalledTimes(2);
        expect(analytics.report).toHaveBeenLastCalledWith({
            type: 'transaction/broadcast-status',
            payload: {
                stage: 'confirmation',
                status: 'success',
                networkSymbol: account.symbol,
                flow: 'stake',
                isCancellation: false,
                isRbf: false,
            },
        });
        expect(store.getState().wallet.earnTransactions).toEqual({});
    });
});
