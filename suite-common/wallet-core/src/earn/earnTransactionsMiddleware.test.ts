import { combineReducers } from '@reduxjs/toolkit';

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
import { type AccountTransaction } from '@trezor/connect';

import {
    type EarnTransactionsMiddlewareState,
    prepareEarnTransactionsMiddleware,
} from './earnTransactionsMiddleware';
import {
    type TrackedEarnTransaction,
    earnTransactionsReducer,
    selectTrackedEarnTransaction,
} from './earnTransactionsReducer';
import { mockEarnTransactionsState, mockTrackedEarnTransaction } from '../../mocks';
import { transactionsActions } from '../transactions/transactionsActions';

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

const { reducer: notificationsReducer } = createNotificationsReducer();

const initStore = (trackedTransactions: TrackedEarnTransaction[]) =>
    createTestCompositionRoot<void, EarnTransactionsMiddlewareState>({
        middleware: [prepareEarnTransactionsMiddleware(() => ({}))],
        reducer: {
            wallet: combineReducers({ earnTransactions: earnTransactionsReducer }),
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
