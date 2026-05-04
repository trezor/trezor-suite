import type { Dispatch } from '@reduxjs/toolkit';

import type { PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { createFakeSparkSigner } from '@suite-common/spark-fake-signer';
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
import {
    type EnsureSparkWalletDep,
    createEnsureSparkWallet,
} from './feature/createEnsureSparkWallet';
import { createHandleSparkWalletIncomingTransaction } from './feature/createHandleSparkWalletIncomingTransaction';
import { createInitializeRunningSparkWallet } from './feature/createInitializeRunningSparkWallet';
import {
    type LoadSparkReceiveDetailsDep,
    createLoadSparkReceiveDetails,
} from './feature/createLoadSparkReceiveDetails';
import { createRunningSparkWalletRepository } from './feature/createRunningSparkWalletRepository';
import { createSparkWalletSubscriptionStorage } from './feature/createSparkWalletSubscriptionStorage';
import { createSubmitSparkLightningSend } from './feature/createSubmitSparkLightningSend';
import type { SubmitSparkLightningSendDep } from './feature/createSubmitSparkLightningSend';
import {
    type SyncSparkWalletDep,
    createSyncSparkWallet,
    createSyncSparkWalletState,
} from './feature/createSyncSparkWallet';

export type Spark = AddSparkAccountDep &
    EnsureSparkOwnerSecretDep &
    EnsureSparkWalletDep &
    LoadSparkReceiveDetailsDep &
    SyncSparkWalletDep &
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

    const runningSparkWalletRepository = createRunningSparkWalletRepository();
    const sparkWalletSubscriptionStorage = createSparkWalletSubscriptionStorage();
    const syncSparkWalletState = createSyncSparkWalletState({ dispatch: deps.dispatch });
    const fakeSparkSigner = createFakeSparkSigner();
    const handleSparkWalletIncomingTransaction = createHandleSparkWalletIncomingTransaction({
        dispatch: deps.dispatch,
        syncSparkWalletState,
    });

    const initializeRunningSparkWallet = createInitializeRunningSparkWallet({
        createFakeSparkSigner: fakeSparkSigner,
        dispatch: deps.dispatch,
        handleSparkWalletIncomingTransaction,
        runningSparkWalletRepository,
        sparkWalletSubscriptionStorage,
        syncSparkWalletState,
    });

    const ensureSparkWallet = createEnsureSparkWallet({
        dispatch: deps.dispatch,
        ensureSparkOwnerSecret,
        initializeRunningSparkWallet,
        runningSparkWalletRepository,
        sparkWalletSubscriptionStorage,
        syncSparkWalletState,
    });

    const loadSparkReceiveDetails = createLoadSparkReceiveDetails({
        dispatch: deps.dispatch,
        ensureSparkWallet,
    });

    const syncSparkWallet = createSyncSparkWallet({
        dispatch: deps.dispatch,
        ensureSparkWallet,
        syncSparkWalletState,
    });

    const addSparkAccount = createAddSparkAccount({
        dispatch: deps.dispatch,
        syncSparkWallet,
    });

    const submitSparkLightningSend = createSubmitSparkLightningSend({
        dispatch: deps.dispatch,
        ensureSparkWallet,
        syncSparkWallet,
    });

    return {
        addSparkAccount,
        ensureSparkOwnerSecret,
        ensureSparkWallet,
        loadSparkReceiveDetails,
        syncSparkWallet,
        submitSparkLightningSend,
    };
};
