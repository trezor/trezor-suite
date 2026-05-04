import type { Dispatch } from '@reduxjs/toolkit';

import type { WalletDescriptor } from '@suite-common/wallet-types';
import { type Result, err, ok } from '@trezor/type-utils';

import {
    type DeviceStaticSessionId,
    type EnsureSparkOwnerSecretDep,
} from './createEnsureSparkOwnerSecret';
import { type InitializeRunningSparkWalletDep } from './createInitializeRunningSparkWallet';
import {
    type RunningSparkWallet,
    type RunningSparkWalletRepositoryDep,
} from './createRunningSparkWalletRepository';
import { type SparkWalletSubscriptionStorageDep } from './createSparkWalletSubscriptionStorage';
import { type SyncSparkWalletStateDep } from './createSyncSparkWallet';
import { sparkActions } from './sparkFeatureReducer';
import { createSparkWalletKey } from '../accounts/sparkAccounts';
import { getErrorMessage } from '../sdk/getErrorMessage';
import { type SparkWalletClientError, getSparkWalletMnemonic } from '../sdk/getSparkWalletMnemonic';

export type SparkWalletParams = {
    accountNumber: number;
    deviceStaticSessionId: DeviceStaticSessionId;
    walletDescriptor: WalletDescriptor;
};

export type EnsureSparkWalletParams = SparkWalletParams;

export type EnsureSparkWalletError =
    | {
          type: 'EnsureSparkOwnerSecretFailed';
          message: string;
      }
    | {
          type: 'GetSparkWalletMnemonicFailed';
          message: string;
      }
    | {
          type: 'InitializeRunningSparkWalletFailed';
          message: string;
      };

export type EnsureSparkWalletResult = Result<RunningSparkWallet, EnsureSparkWalletError>;

export type EnsureSparkWallet = (
    params: EnsureSparkWalletParams,
) => Promise<EnsureSparkWalletResult>;

export type EnsureSparkWalletDep = {
    ensureSparkWallet: EnsureSparkWallet;
};

export type EnsureSparkWalletDeps = {
    dispatch: Dispatch;
} & EnsureSparkOwnerSecretDep &
    InitializeRunningSparkWalletDep &
    RunningSparkWalletRepositoryDep &
    SparkWalletSubscriptionStorageDep &
    SyncSparkWalletStateDep;

export const createEnsureSparkWallet = (deps: EnsureSparkWalletDeps): EnsureSparkWallet => {
    const mapEnsureSparkWalletError = (
        error: SparkWalletClientError | { message: string },
    ): EnsureSparkWalletError => ({
        message: error.message,
        type: 'GetSparkWalletMnemonicFailed',
    });

    const handleAsyncRunningSparkWalletError = (
        error: unknown,
        params: EnsureSparkWalletParams,
        walletKey: string,
    ): EnsureSparkWalletResult => {
        const message = getErrorMessage(error);

        deps.runningSparkWalletRepository.delete(walletKey);
        deps.sparkWalletSubscriptionStorage.dispose(walletKey);
        deps.dispatch(
            sparkActions.setSparkWalletError({
                accountNumber: params.accountNumber,
                error: message,
                walletDescriptor: params.walletDescriptor,
            }),
        );

        return err({
            message,
            type: 'InitializeRunningSparkWalletFailed',
        });
    };

    const ensureSparkWallet: EnsureSparkWallet = async params => {
        const walletKey = createSparkWalletKey(params);
        const existingRunningSparkWallet = deps.runningSparkWalletRepository.get(walletKey);

        if (existingRunningSparkWallet !== null) {
            try {
                return ok(await existingRunningSparkWallet);
            } catch (error) {
                return handleAsyncRunningSparkWalletError(error, params, walletKey);
            }
        }

        const ownerSecretResult = await deps.ensureSparkOwnerSecret({
            deviceStaticSessionId: params.deviceStaticSessionId,
        });

        if (!ownerSecretResult.success) {
            return err({
                message: ownerSecretResult.error.message,
                type: 'EnsureSparkOwnerSecretFailed',
            });
        }

        const mnemonicResult = getSparkWalletMnemonic(ownerSecretResult.payload);

        if (!mnemonicResult.success) {
            return err(mapEnsureSparkWalletError(mnemonicResult.error));
        }

        const runningSparkWallet = deps.initializeRunningSparkWallet({
            ...params,
            mnemonic: mnemonicResult.payload,
            walletKey,
        });

        deps.runningSparkWalletRepository.set(walletKey, runningSparkWallet);

        try {
            return ok(await runningSparkWallet);
        } catch (error) {
            return handleAsyncRunningSparkWalletError(error, params, walletKey);
        }
    };

    return ensureSparkWallet;
};
