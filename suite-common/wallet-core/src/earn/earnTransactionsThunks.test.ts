import { combineReducers } from '@reduxjs/toolkit';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type NotificationsRootState,
    createNotificationsReducer,
    notificationsActions,
    selectNotifications,
} from '@suite-common/toast-notifications';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type PrecomposedTransactionFinal, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    type EarnTransactionsRootState,
    earnTransactionsReducer,
    selectTrackedEarnTransaction,
} from './earnTransactionsReducer';
import {
    handleEarnTransactionReplacementThunk,
    notifyEarnTransactionBroadcastThunk,
} from './earnTransactionsThunks';
import { transactionsActions } from '../transactions/transactionsActions';

const account = mockWalletAccount({
    symbol: asNetworkSymbol('trx'),
    deviceState: '1@2:3',
    descriptor: asAccountDescriptor('accA'),
});

const { reducer: notificationsReducer } = createNotificationsReducer();

const initStore = () =>
    createTestCompositionRoot<void, EarnTransactionsRootState & NotificationsRootState>({
        reducer: {
            wallet: combineReducers({ earnTransactions: earnTransactionsReducer }),
            notifications: notificationsReducer,
        },
    }).services.store;

const getToastPayloads = (store: ReturnType<typeof initStore>) =>
    store
        .getActions()
        .filter(notificationsActions.addToast.match)
        .map(action => action.payload);

describe('notifyEarnTransactionBroadcastThunk', () => {
    it('tracks the broadcast and shows the pending toast of its flow', () => {
        const store = initStore();

        store.dispatch(
            notifyEarnTransactionBroadcastThunk({ account, txid: 'tx1', flow: 'withdraw' }),
        );

        expect(selectTrackedEarnTransaction(store.getState(), account.key, 'tx1')).toMatchObject({
            flow: 'withdraw',
            isRbf: false,
        });
        expect(getToastPayloads(store)).toEqual([
            expect.objectContaining({
                type: 'tx-withdrawn',
                stage: 'pending',
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid: 'tx1',
            }),
        ]);
    });

    it('moves the record to the new txid and shows the sped-up toast for a fee bump', () => {
        const store = initStore();
        store.dispatch(
            notifyEarnTransactionBroadcastThunk({ account, txid: 'tx1', flow: 'stake' }),
        );

        store.dispatch(
            notifyEarnTransactionBroadcastThunk({
                account,
                txid: 'tx2',
                flow: 'stake',
                stage: 'sped-up',
                prevTxid: 'tx1',
            }),
        );

        expect(selectTrackedEarnTransaction(store.getState(), account.key, 'tx1')).toBeUndefined();
        expect(selectTrackedEarnTransaction(store.getState(), account.key, 'tx2')).toMatchObject({
            flow: 'stake',
            isRbf: true,
        });
        expect(getToastPayloads(store).at(-1)).toEqual(
            expect.objectContaining({ type: 'tx-staked', stage: 'sped-up', txid: 'tx2' }),
        );
    });

    it('keeps a single notification entry for a bumped transaction', () => {
        const store = initStore();
        store.dispatch(
            notifyEarnTransactionBroadcastThunk({ account, txid: 'tx1', flow: 'stake' }),
        );

        store.dispatch(
            notifyEarnTransactionBroadcastThunk({
                account,
                txid: 'tx2',
                flow: 'stake',
                stage: 'sped-up',
                prevTxid: 'tx1',
            }),
        );

        expect(selectNotifications(store.getState())).toEqual([
            expect.objectContaining({ type: 'tx-staked', stage: 'sped-up', txid: 'tx2' }),
        ]);
    });
});

const precomposedTransaction: PrecomposedTransactionFinal = {
    type: 'final',
    inputs: [],
    outputs: [],
    fee: '0',
    totalSpent: '0',
    feePerByte: '1',
    bytes: 1,
    outputsPermutation: [],
};

describe('Earn replacement outcomes from the send form', () => {
    it('ignores replacements of transactions outside Earn', async () => {
        const store = initStore();
        const hasEarnToast = await store
            .dispatch(
                handleEarnTransactionReplacementThunk({
                    account,
                    precomposedTransaction: {
                        ...precomposedTransaction,
                        rbfType: 'bump-fee',
                        prevTxid: 'unrelated',
                        feeDifference: '1',
                        useNativeRbf: false,
                    },
                    txid: 'sent',
                }),
            )
            .unwrap();
        expect(hasEarnToast).toBe(false);
        expect(store.getState().wallet.earnTransactions).toEqual({});
        expect(getToastPayloads(store)).toEqual([]);
    });

    it('keeps the original tracked transaction when a replacement broadcast fails', async () => {
        const store = initStore();
        store.dispatch(
            transactionsActions.transactionBroadcastStatus({
                account,
                flow: 'approve',
                txid: 'previous',
                status: 'success',
            }),
        );
        await store
            .dispatch(
                handleEarnTransactionReplacementThunk({
                    account,
                    precomposedTransaction: {
                        ...precomposedTransaction,
                        rbfType: 'bump-fee',
                        prevTxid: 'previous',
                        feeDifference: '1',
                        useNativeRbf: false,
                    },
                    txid: null,
                }),
            )
            .unwrap();
        expect(
            selectTrackedEarnTransaction(store.getState(), account.key, 'previous'),
        ).toMatchObject({ flow: 'approve' });
        expect(
            store.getActions().filter(transactionsActions.transactionBroadcastStatus.match).at(-1)
                ?.payload,
        ).toEqual({
            account,
            flow: 'approve',
            status: 'error',
            isCancellation: false,
            isRbf: true,
        });
        expect(getToastPayloads(store)).toEqual([]);
    });

    it.each([
        { flow: 'stake', isCancellation: false, replacement: 'bump-fee', hasToast: true },
        { flow: 'wrap', isCancellation: false, replacement: 'bump-fee', hasToast: false },
        { flow: 'stake', isCancellation: true, replacement: 'bump-fee', hasToast: false },
        { flow: 'yield-deposit', isCancellation: false, replacement: 'cancel', hasToast: false },
    ] as const)(
        'preserves $flow when replacing it with $replacement (cancel=$isCancellation)',
        async ({ flow, isCancellation, replacement, hasToast }) => {
            const store = initStore();
            store.dispatch(
                transactionsActions.transactionBroadcastStatus({
                    account,
                    flow,
                    isCancellation,
                    status: 'success',
                    txid: 'previous',
                }),
            );
            const replacementTransaction =
                replacement === 'cancel'
                    ? {
                          ...precomposedTransaction,
                          rbfType: 'cancel' as const,
                          prevTxid: 'previous',
                      }
                    : {
                          ...precomposedTransaction,
                          rbfType: 'bump-fee' as const,
                          prevTxid: 'previous',
                          feeDifference: '1',
                          useNativeRbf: false,
                      };
            const hasEarnToast = await store
                .dispatch(
                    handleEarnTransactionReplacementThunk({
                        account,
                        precomposedTransaction: replacementTransaction,
                        txid: 'replacement',
                    }),
                )
                .unwrap();
            expect(hasEarnToast).toBe(hasToast);
            expect(
                selectTrackedEarnTransaction(store.getState(), account.key, 'replacement'),
            ).toMatchObject({
                flow,
                isCancellation: isCancellation || replacement === 'cancel',
                isRbf: true,
            });
            expect(
                store.getActions().filter(transactionsActions.transactionBroadcastStatus.match),
            ).toHaveLength(2);
            expect(getToastPayloads(store)).toHaveLength(hasToast ? 1 : 0);
        },
    );
});
