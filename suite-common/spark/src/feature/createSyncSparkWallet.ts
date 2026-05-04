import type { Dispatch } from '@reduxjs/toolkit';

import { type EnsureSparkWalletDep, type SparkWalletParams } from './createEnsureSparkWallet';
import { type RunningSparkWallet } from './createRunningSparkWalletRepository';
import { sparkActions } from './sparkFeatureReducer';
import { getErrorMessage } from '../sdk/getErrorMessage';
import { getSparkWalletBalance } from '../sdk/getSparkWalletBalance';
import { getSparkWalletTransfers } from '../sdk/getSparkWalletTransfers';

export type SyncSparkWalletStateParams = SparkWalletParams & {
    runningSparkWallet: RunningSparkWallet;
    setLoading?: boolean;
};

export type SyncSparkWalletState = (params: SyncSparkWalletStateParams) => Promise<boolean>;

export type SyncSparkWalletStateDep = {
    syncSparkWalletState: SyncSparkWalletState;
};

export type SyncSparkWalletStateDeps = {
    dispatch: Dispatch;
};

export const createSyncSparkWalletState =
    (deps: SyncSparkWalletStateDeps): SyncSparkWalletState =>
    async params => {
        if (params.setLoading === true) {
            deps.dispatch(
                sparkActions.setSparkWalletLoading({
                    accountNumber: params.accountNumber,
                    walletDescriptor: params.walletDescriptor,
                }),
            );
        }

        try {
            const [balanceSats, transfers] = await Promise.all([
                getSparkWalletBalance(params.runningSparkWallet.wallet),
                getSparkWalletTransfers(params.runningSparkWallet.wallet),
            ]);

            deps.dispatch(
                sparkActions.setSparkWalletLoaded({
                    accountNumber: params.accountNumber,
                    balanceSats,
                    transfers,
                    walletDescriptor: params.walletDescriptor,
                }),
            );

            return true;
        } catch (error) {
            deps.dispatch(
                sparkActions.setSparkWalletError({
                    accountNumber: params.accountNumber,
                    error: getErrorMessage(error),
                    walletDescriptor: params.walletDescriptor,
                }),
            );

            return false;
        }
    };

export type SyncSparkWalletParams = SparkWalletParams & {
    setLoading?: boolean;
};

export type SyncSparkWallet = (params: SyncSparkWalletParams) => Promise<boolean>;

export type SyncSparkWalletDep = {
    syncSparkWallet: SyncSparkWallet;
};

export type SyncSparkWalletDeps = {
    dispatch: Dispatch;
} & EnsureSparkWalletDep &
    SyncSparkWalletStateDep;

export const createSyncSparkWallet =
    (deps: SyncSparkWalletDeps): SyncSparkWallet =>
    async params => {
        const runningSparkWallet = await deps.ensureSparkWallet(params);

        if (!runningSparkWallet.success) {
            deps.dispatch(
                sparkActions.setSparkWalletError({
                    accountNumber: params.accountNumber,
                    error: runningSparkWallet.error.message,
                    walletDescriptor: params.walletDescriptor,
                }),
            );

            return false;
        }

        return deps.syncSparkWalletState({
            ...params,
            runningSparkWallet: runningSparkWallet.payload,
            setLoading: params.setLoading,
        });
    };
