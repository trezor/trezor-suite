import type { Dispatch } from '@reduxjs/toolkit';

import type { WalletDescriptor } from '@suite-common/wallet-types';

import {
    type DeviceStaticSessionId,
    type EnsureSparkOwnerSecretDep,
} from './createEnsureSparkOwnerSecret';
import { sparkActions } from './sparkFeatureReducer';
import { createSparkWalletKey } from '../accounts/sparkAccounts';
import { loadSparkWalletSnapshot } from '../sdk/loadSparkWalletSnapshot';

export type SparkWalletParams = {
    accountNumber: number;
    deviceStaticSessionId: DeviceStaticSessionId;
    walletDescriptor: WalletDescriptor;
};

export type LoadSparkWallet = (params: SparkWalletParams) => Promise<void>;

export type LoadSparkWalletDep = {
    loadSparkWallet: LoadSparkWallet;
};

export type LoadSparkWalletDeps = {
    dispatch: Dispatch;
} & EnsureSparkOwnerSecretDep;

export const createLoadSparkWallet =
    (deps: LoadSparkWalletDeps): LoadSparkWallet =>
    async params => {
        deps.dispatch(
            sparkActions.setSparkWalletLoading({
                accountNumber: params.accountNumber,
                walletDescriptor: params.walletDescriptor,
            }),
        );

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

            return;
        }

        const walletSnapshot = await loadSparkWalletSnapshot({
            accountNumber: params.accountNumber,
            ownerSecret: ownerSecretResult.payload,
            walletKey: createSparkWalletKey(params),
        });

        if (!walletSnapshot.success) {
            deps.dispatch(
                sparkActions.setSparkWalletError({
                    accountNumber: params.accountNumber,
                    error: walletSnapshot.error.message,
                    walletDescriptor: params.walletDescriptor,
                }),
            );

            return;
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
    };
