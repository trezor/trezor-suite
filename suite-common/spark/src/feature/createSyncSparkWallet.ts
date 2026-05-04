import type { Dispatch } from '@reduxjs/toolkit';

import { type EnsureSparkWalletDep, type SparkWalletParams } from './createEnsureSparkWallet';
import { type RunningSparkWallet } from './createRunningSparkWalletRepository';
import { sparkActions } from './sparkFeatureReducer';
import { loadSparkWalletSnapshot } from '../sdk/loadSparkWalletSnapshot';

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

        const walletSnapshot = await loadSparkWalletSnapshot({
            mnemonic: params.runningSparkWallet.mnemonic,
            wallet: params.runningSparkWallet.wallet,
        });

        if (!walletSnapshot.success) {
            deps.dispatch(
                sparkActions.setSparkWalletError({
                    accountNumber: params.accountNumber,
                    error: walletSnapshot.error.message,
                    walletDescriptor: params.walletDescriptor,
                }),
            );

            return false;
        }

        deps.dispatch(
            sparkActions.setSparkWalletLoaded({
                accountNumber: params.accountNumber,
                balanceSats: walletSnapshot.payload.balanceSats,
                bitcoinDepositAddress: walletSnapshot.payload.bitcoinDepositAddress,
                lightningInvoice: walletSnapshot.payload.lightningInvoice,
                mnemonic: walletSnapshot.payload.mnemonic as never,
                transfers: walletSnapshot.payload.transfers,
                walletDescriptor: params.walletDescriptor,
            }),
        );

        return true;
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
