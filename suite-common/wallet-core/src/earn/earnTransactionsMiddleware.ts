import { type UnknownAction } from '@reduxjs/toolkit';

import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type DeviceRootState, selectDevices } from '@suite-common/device';
import {
    type NotificationsRootState,
    notificationsActions,
    selectEarnTransactionNotifications,
} from '@suite-common/toast-notifications';
import { type Account, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { findAccountDevice, isPending } from '@suite-common/wallet-utils';
import { isNative } from '@trezor/env-utils';
import { type WithServices, createMiddlewareWithExtraDeps } from '@trezor/redux-utils';

import {
    EARN_TRANSACTION_TOAST_TYPE,
    type EarnTransactionsRootState,
    earnTransactionsActions,
    selectTrackedEarnTransaction,
} from './earnTransactionsReducer';
import { transactionsActions } from '../transactions/transactionsActions';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import { selectTransactionByAccountKeyAndTxid } from '../transactions/transactionsSelectors';

export type EarnTransactionsMiddlewareState = DeviceRootState &
    EarnTransactionsRootState &
    NotificationsRootState &
    TransactionsRootState;

export const prepareEarnTransactionsMiddleware = createMiddlewareWithExtraDeps<
    WithServices<AnalyticsDep>,
    UnknownAction,
    EarnTransactionsMiddlewareState
>((action, { dispatch, getState, next, extra }) => {
    if (
        !transactionsActions.transactionBroadcastStatus.match(action) &&
        !transactionsActions.addTransaction.match(action)
    ) {
        return next(action);
    }

    next(action);

    const confirmTransaction = (account: Account, tx: WalletAccountTransaction) => {
        if (isPending(tx)) return;
        const tracked = selectTrackedEarnTransaction(getState(), account.key, tx.txid);
        if (!tracked) return;

        const status = tx.type === 'failed' ? 'error' : 'success';
        dispatch(
            earnTransactionsActions.untrackEarnTransaction({
                accountKey: account.key,
                txid: tx.txid,
            }),
        );
        extra.services.analytics.report({
            type: events.transactionBroadcastStatusEvent.name,
            payload: {
                stage: 'confirmation',
                status,
                networkSymbol: account.symbol,
                flow: tracked.flow,
                isCancellation: tracked.isCancellation,
                isRbf: tracked.isRbf,
            },
        });

        const toastType = EARN_TRANSACTION_TOAST_TYPE[tracked.flow];
        if (isNative() || status === 'error' || tracked.isCancellation || !toastType) return;

        const previousStages = selectEarnTransactionNotifications(getState(), {
            descriptor: account.descriptor,
            symbol: account.symbol,
            txid: tx.txid,
        });
        if (previousStages.length > 0) dispatch(notificationsActions.remove(previousStages));
        dispatch(
            notificationsActions.addToast({
                type: toastType,
                stage: 'confirmed',
                device: findAccountDevice(account, selectDevices(getState()) ?? []),
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid: tx.txid,
            }),
        );
    };

    if (transactionsActions.transactionBroadcastStatus.match(action)) {
        const { account, flow, status, isCancellation = false, isRbf = false } = action.payload;
        extra.services.analytics.report({
            type: events.transactionBroadcastStatusEvent.name,
            payload: {
                stage: 'broadcast',
                status,
                networkSymbol: account.symbol,
                flow,
                isCancellation,
                isRbf,
            },
        });
        if (action.payload.status === 'success') {
            const tx = selectTransactionByAccountKeyAndTxid(
                getState(),
                account.key,
                action.payload.txid,
            );
            if (tx) confirmTransaction(account, tx);
        }
    }

    if (transactionsActions.addTransaction.match(action)) {
        const { account, transactions } = action.payload;
        transactions.forEach(tx => confirmTransaction(account, tx));
    }

    return action;
});
