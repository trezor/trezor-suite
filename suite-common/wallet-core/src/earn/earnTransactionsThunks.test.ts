import { combineReducers } from '@reduxjs/toolkit';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type NotificationsRootState,
    createNotificationsReducer,
    notificationsActions,
    selectNotifications,
} from '@suite-common/toast-notifications';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    type EarnTransactionsRootState,
    earnTransactionsReducer,
    selectTrackedEarnTransaction,
} from './earnTransactionsReducer';
import { notifyEarnTransactionBroadcastThunk } from './earnTransactionsThunks';

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
