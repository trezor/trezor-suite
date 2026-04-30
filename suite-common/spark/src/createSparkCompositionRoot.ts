import type { Dispatch } from '@reduxjs/toolkit';

import type { PlatformEncryptionDep } from '@suite-common/platform-encryption';
import type {
    EnsureWalletSuiteSyncOnDep,
    TurnOnSuiteSyncDep,
} from '@suite-common/suite-sync-types';

import { createAddSparkAccount } from './feature/createAddSparkAccount';
import type { AddSparkAccountDep } from './feature/createAddSparkAccount';
import {
    type EnsureSparkOwnerSecretDep,
    createEnsureSparkOwnerSecret,
} from './feature/createEnsureSparkOwnerSecret';
import { createLoadSparkWallet } from './feature/createLoadSparkWallet';
import type { LoadSparkWalletDep } from './feature/createLoadSparkWallet';
import { createRefreshSparkLightningInvoice } from './feature/createRefreshSparkLightningInvoice';
import type { RefreshSparkLightningInvoiceDep } from './feature/createRefreshSparkLightningInvoice';
import { createSubmitSparkLightningSend } from './feature/createSubmitSparkLightningSend';
import type { SubmitSparkLightningSendDep } from './feature/createSubmitSparkLightningSend';

export type Spark = AddSparkAccountDep &
    EnsureSparkOwnerSecretDep &
    LoadSparkWalletDep &
    RefreshSparkLightningInvoiceDep &
    SubmitSparkLightningSendDep;

export type SparkDep = {
    spark: Spark;
};

type SparkStoreDeps = {
    dispatch: Dispatch;
    getState: () => unknown;
};

export type SparkCompositionRootDeps = SparkStoreDeps &
    PlatformEncryptionDep &
    EnsureWalletSuiteSyncOnDep &
    TurnOnSuiteSyncDep;

export const createSparkCompositionRoot = (deps: SparkCompositionRootDeps): Spark => {
    const ensureSparkOwnerSecret = createEnsureSparkOwnerSecret(deps);

    const loadSparkWallet = createLoadSparkWallet({
        dispatch: deps.dispatch,
        ensureSparkOwnerSecret,
    });

    const addSparkAccount = createAddSparkAccount({
        dispatch: deps.dispatch,
        loadSparkWallet,
    });

    const refreshSparkLightningInvoice = createRefreshSparkLightningInvoice({ loadSparkWallet });

    const submitSparkLightningSend = createSubmitSparkLightningSend({
        dispatch: deps.dispatch,
        ensureSparkOwnerSecret,
        loadSparkWallet,
    });

    return {
        addSparkAccount,
        ensureSparkOwnerSecret,
        loadSparkWallet,
        refreshSparkLightningInvoice,
        submitSparkLightningSend,
    };
};
