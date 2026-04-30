import type { Dispatch } from '@reduxjs/toolkit';

import { type EnsureSparkOwnerSecretDep } from './createEnsureSparkOwnerSecret';
import { type LoadSparkWalletDep, type SparkWalletParams } from './createLoadSparkWallet';
import { sparkActions } from './sparkFeatureReducer';
import { createSparkWalletKey } from '../accounts/sparkAccounts';
import { paySparkLightningInvoice } from '../sdk/paySparkLightningInvoice';

export type SparkLightningSendParams = SparkWalletParams & {
    amountSats?: string;
    invoice: string;
};

export type SubmitSparkLightningSend = (params: SparkLightningSendParams) => Promise<boolean>;

export type SubmitSparkLightningSendDep = {
    submitSparkLightningSend: SubmitSparkLightningSend;
};

export type SubmitSparkLightningSendDeps = {
    dispatch: Dispatch;
} & EnsureSparkOwnerSecretDep &
    LoadSparkWalletDep;

export const createSubmitSparkLightningSend =
    (deps: SubmitSparkLightningSendDeps): SubmitSparkLightningSend =>
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

            return false;
        }

        const sendResult = await paySparkLightningInvoice({
            accountNumber: params.accountNumber,
            amountSats: params.amountSats,
            invoice: params.invoice,
            ownerSecret: ownerSecretResult.payload,
            walletKey: createSparkWalletKey(params),
        });

        if (!sendResult.success) {
            deps.dispatch(
                sparkActions.setSparkWalletError({
                    accountNumber: params.accountNumber,
                    error: sendResult.error.message,
                    walletDescriptor: params.walletDescriptor,
                }),
            );

            return false;
        }

        await deps.loadSparkWallet(params);

        return true;
    };
