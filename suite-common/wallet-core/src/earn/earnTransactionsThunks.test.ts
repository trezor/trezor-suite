import { combineReducers } from '@reduxjs/toolkit';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
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

const initStore = () =>
    createTestCompositionRoot<void, EarnTransactionsRootState>({
        reducer: { wallet: combineReducers({ earnTransactions: earnTransactionsReducer }) },
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

        expect(selectTrackedEarnTransaction(store.getState(), account.key, 'tx1')).toEqual({
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

    it('shows the sped-up toast when the broadcast is a fee bump', () => {
        const store = initStore();

        store.dispatch(
            notifyEarnTransactionBroadcastThunk({
                account,
                txid: 'tx2',
                flow: 'stake',
                stage: 'sped-up',
            }),
        );

        expect(getToastPayloads(store)).toEqual([
            expect.objectContaining({ type: 'tx-staked', stage: 'sped-up', txid: 'tx2' }),
        ]);
    });
});
