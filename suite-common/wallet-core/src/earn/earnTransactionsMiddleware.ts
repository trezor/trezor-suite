import { type UnknownAction } from '@reduxjs/toolkit';

import { type DeviceRootState, selectDevices } from '@suite-common/device';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import {
    type NotificationsRootState,
    notificationsActions,
    selectEarnTransactionNotifications,
} from '@suite-common/toast-notifications';
import { findAccountDevice, isPending } from '@suite-common/wallet-utils';

import {
    EARN_TRANSACTION_TOAST_TYPE,
    type EarnTransactionsRootState,
    earnTransactionsActions,
    selectTrackedEarnTransaction,
} from './earnTransactionsReducer';
import { transactionsActions } from '../transactions/transactionsActions';

export type EarnTransactionsMiddlewareState = DeviceRootState &
    EarnTransactionsRootState &
    NotificationsRootState;

export const prepareEarnTransactionsMiddleware = createMiddlewareWithExtraDeps<
    void,
    UnknownAction,
    EarnTransactionsMiddlewareState
>((action, { dispatch, next, getState }) => {
    next(action);

    if (transactionsActions.addTransaction.match(action)) {
        const { account, transactions } = action.payload;

        transactions.forEach(tx => {
            if (isPending(tx)) return;

            const tracked = selectTrackedEarnTransaction(getState(), account.key, tx.txid);

            if (!tracked) return;

            dispatch(
                earnTransactionsActions.untrackEarnTransaction({
                    accountKey: account.key,
                    txid: tx.txid,
                }),
            );

            if (tx.type === 'failed') return;

            const previousStages = selectEarnTransactionNotifications(getState(), {
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid: tx.txid,
            });

            if (previousStages.length > 0) {
                dispatch(notificationsActions.remove(previousStages));
            }

            dispatch(
                notificationsActions.addToast({
                    type: EARN_TRANSACTION_TOAST_TYPE[tracked.flow],
                    stage: 'confirmed',
                    device: findAccountDevice(account, selectDevices(getState()) ?? []),
                    descriptor: account.descriptor,
                    symbol: account.symbol,
                    txid: tx.txid,
                }),
            );
        });
    }

    return action;
});
