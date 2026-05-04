import type { Dispatch } from '@reduxjs/toolkit';

import { type EnsureSparkWalletDep, type SparkWalletParams } from './createEnsureSparkWallet';
import { sparkActions } from './sparkFeatureReducer';
import { getErrorMessage } from '../sdk/getErrorMessage';
import { getLightningInvoice } from '../sdk/getLightningInvoice';
import { getSparkStaticDepositAddress } from '../sdk/getSparkStaticDepositAddress';

export type LoadSparkReceiveDetails = (params: SparkWalletParams) => Promise<boolean>;

export type LoadSparkReceiveDetailsDep = {
    loadSparkReceiveDetails: LoadSparkReceiveDetails;
};

export type LoadSparkReceiveDetailsDeps = {
    dispatch: Dispatch;
} & EnsureSparkWalletDep;

export const createLoadSparkReceiveDetails = (
    deps: LoadSparkReceiveDetailsDeps,
): LoadSparkReceiveDetails => {
    const loadSparkReceiveDetails: LoadSparkReceiveDetails = async params => {
        const ensuredSparkWallet = await deps.ensureSparkWallet(params);

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

        try {
            const [bitcoinDepositAddress, lightningInvoice] = await Promise.all([
                getSparkStaticDepositAddress(ensuredSparkWallet.payload.wallet),
                getLightningInvoice(ensuredSparkWallet.payload.wallet),
            ]);

            deps.dispatch(
                sparkActions.setSparkWalletReceiveDetails({
                    accountNumber: params.accountNumber,
                    bitcoinDepositAddress,
                    lightningInvoice,
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

    return loadSparkReceiveDetails;
};
