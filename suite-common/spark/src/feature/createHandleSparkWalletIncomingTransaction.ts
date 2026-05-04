import type { Dispatch } from '@reduxjs/toolkit';

import { notificationsActions } from '@suite-common/toast-notifications';

import type { SyncSparkWalletStateDep, SyncSparkWalletStateParams } from './createSyncSparkWallet';

export type HandleSparkWalletIncomingTransaction = (
    params: SyncSparkWalletStateParams,
) => Promise<boolean>;

export type HandleSparkWalletIncomingTransactionDep = {
    handleSparkWalletIncomingTransaction: HandleSparkWalletIncomingTransaction;
};

export type HandleSparkWalletIncomingTransactionDeps = {
    dispatch: Dispatch;
} & SyncSparkWalletStateDep;

export const createHandleSparkWalletIncomingTransaction = (
    deps: HandleSparkWalletIncomingTransactionDeps,
): HandleSparkWalletIncomingTransaction => {
    const handleSparkWalletIncomingTransaction: HandleSparkWalletIncomingTransaction =
        async params => {
            const hasProcessedIncomingTransaction = await deps.syncSparkWalletState({
                ...params,
                setLoading: false,
            });

            if (hasProcessedIncomingTransaction) {
                deps.dispatch(notificationsActions.addToast({ type: 'spark-receive-success' }));
            }

            return hasProcessedIncomingTransaction;
        };

    return handleSparkWalletIncomingTransaction;
};
