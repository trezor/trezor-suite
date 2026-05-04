import type { Dispatch } from '@reduxjs/toolkit';

import { type EnsureSparkWalletDep, type SparkWalletParams } from './createEnsureSparkWallet';
import { type SyncSparkWalletDep } from './createSyncSparkWallet';
import { sparkActions } from './sparkFeatureReducer';
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
} & EnsureSparkWalletDep &
    SyncSparkWalletDep;

export const createSubmitSparkLightningSend =
    (deps: SubmitSparkLightningSendDeps): SubmitSparkLightningSend =>
    async params => {
        const ensuredSparkWallet = await deps.ensureSparkWallet({
            ...params,
        });

        if (!ensuredSparkWallet.success) {
            deps.dispatch(
                sparkActions.setSparkWalletError({
                    accountNumber: params.accountNumber,
                    error: ensuredSparkWallet.error.message,
                    walletDescriptor: params.walletDescriptor,
                }),
            );

            return false;
        }

        const sendResult = await paySparkLightningInvoice({
            amountSats: params.amountSats,
            invoice: params.invoice,
            wallet: ensuredSparkWallet.payload.wallet,
            walletKey: ensuredSparkWallet.payload.walletKey,
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

        await deps.syncSparkWallet({
            ...params,
            setLoading: false,
        });

        return true;
    };
