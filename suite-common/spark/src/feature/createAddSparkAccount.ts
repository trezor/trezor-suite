import type { Dispatch } from '@reduxjs/toolkit';

import { type SparkWalletParams } from './createEnsureSparkWallet';
import { type SyncSparkWalletDep } from './createSyncSparkWallet';
import { sparkActions } from './sparkFeatureReducer';

export type AddSparkAccount = (params: SparkWalletParams) => Promise<void>;

export type AddSparkAccountDep = {
    addSparkAccount: AddSparkAccount;
};

export type AddSparkAccountDeps = {
    dispatch: Dispatch;
} & SyncSparkWalletDep;

export const createAddSparkAccount =
    (deps: AddSparkAccountDeps): AddSparkAccount =>
    async params => {
        deps.dispatch(
            sparkActions.addSparkAccount({
                accountNumber: params.accountNumber,
                walletDescriptor: params.walletDescriptor,
            }),
        );
        deps.dispatch(
            sparkActions.selectSparkAccount({
                accountNumber: params.accountNumber,
                walletDescriptor: params.walletDescriptor,
            }),
        );

        await deps.syncSparkWallet({
            ...params,
            setLoading: true,
        });
    };
