import { SparkWalletEvent } from '@buildonspark/spark-sdk';
import type { Dispatch } from '@reduxjs/toolkit';

import type { WalletDescriptor } from '@suite-common/wallet-types';

import {
    type DeviceStaticSessionId,
    type EnsureSparkOwnerSecretDep,
} from './createEnsureSparkOwnerSecret';
import {
    type RunningSparkWallet,
    type RunningSparkWalletRepositoryDep,
} from './createRunningSparkWalletRepository';
import { type SparkWalletSubscriptionStorageDep } from './createSparkWalletSubscriptionStorage';
import { type SyncSparkWalletStateDep } from './createSyncSparkWallet';
import { sparkActions } from './sparkFeatureReducer';
import { createSparkWalletKey } from '../accounts/sparkAccounts';
import { getErrorMessage } from '../sdk/getErrorMessage';
import { getSparkWalletMnemonic } from '../sdk/getSparkWalletMnemonic';
import { initializeSparkWallet } from '../sdk/initializeSparkWallet';

export type SparkWalletParams = {
    accountNumber: number;
    deviceStaticSessionId: DeviceStaticSessionId;
    walletDescriptor: WalletDescriptor;
};

export type EnsureSparkWalletParams = SparkWalletParams;

export type EnsureSparkWallet = (
    params: EnsureSparkWalletParams,
) => Promise<RunningSparkWallet | null>;

export type EnsureSparkWalletDep = {
    ensureSparkWallet: EnsureSparkWallet;
};

export type EnsureSparkWalletDeps = {
    dispatch: Dispatch;
} & EnsureSparkOwnerSecretDep &
    RunningSparkWalletRepositoryDep &
    SparkWalletSubscriptionStorageDep &
    SyncSparkWalletStateDep;

export const createEnsureSparkWallet = (deps: EnsureSparkWalletDeps): EnsureSparkWallet => {
    const ensureSparkWallet: EnsureSparkWallet = async params => {
        const walletKey = createSparkWalletKey(params);
        const existingRunningSparkWallet = deps.runningSparkWalletRepository.get(walletKey);

        if (existingRunningSparkWallet !== null) {
            return existingRunningSparkWallet;
        }

        const ownerSecretResult = await deps.ensureSparkOwnerSecret({
            deviceStaticSessionId: params.deviceStaticSessionId,
        });

        if (!ownerSecretResult.success) {
            deps.dispatch(
                sparkActions.setSparkWalletError({
                    accountNumber: params.accountNumber,
                    error: ownerSecretResult.error.message,
                    walletDescriptor: params.walletDescriptor,
                }),
            );

            return null;
        }

        const mnemonicResult = getSparkWalletMnemonic(ownerSecretResult.payload);

        if (!mnemonicResult.success) {
            deps.dispatch(
                sparkActions.setSparkWalletError({
                    accountNumber: params.accountNumber,
                    error: mnemonicResult.error.message,
                    walletDescriptor: params.walletDescriptor,
                }),
            );

            return null;
        }

        const runningSparkWallet = initializeSparkWallet({
            accountNumber: params.accountNumber,
            mnemonic: mnemonicResult.payload,
        }).then(wallet => {
            const nextRunningSparkWallet: RunningSparkWallet = {
                mnemonic: mnemonicResult.payload,
                wallet,
                walletKey,
            };

            const syncWallet = () => {
                void deps.syncSparkWalletState({
                    ...params,
                    runningSparkWallet: nextRunningSparkWallet,
                });
            };

            wallet.on(SparkWalletEvent.TransferClaimed, syncWallet);
            wallet.on(SparkWalletEvent.DepositConfirmed, syncWallet);
            wallet.on(SparkWalletEvent.StreamConnected, syncWallet);

            deps.sparkWalletSubscriptionStorage.add({
                walletKey,
                unsubscribe: () => {
                    wallet.off(SparkWalletEvent.TransferClaimed, syncWallet);
                    wallet.off(SparkWalletEvent.DepositConfirmed, syncWallet);
                    wallet.off(SparkWalletEvent.StreamConnected, syncWallet);
                },
            });

            return nextRunningSparkWallet;
        });

        deps.runningSparkWalletRepository.set(walletKey, runningSparkWallet);

        try {
            return await runningSparkWallet;
        } catch (error) {
            deps.runningSparkWalletRepository.delete(walletKey);
            deps.sparkWalletSubscriptionStorage.dispose(walletKey);
            deps.dispatch(
                sparkActions.setSparkWalletError({
                    accountNumber: params.accountNumber,
                    error: getErrorMessage(error),
                    walletDescriptor: params.walletDescriptor,
                }),
            );

            return null;
        }
    };

    return ensureSparkWallet;
};
