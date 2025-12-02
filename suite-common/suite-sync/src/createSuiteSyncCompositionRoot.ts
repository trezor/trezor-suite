import { Dispatch } from '@reduxjs/toolkit';

import {
    CreateSuiteStorage,
    CreateSuiteSyncOwner,
    SuiteSync,
    createSuiteSyncStorageRepositoryFactory,
} from '@suite-common/suite-sync-storage';
import { selectAllDeviceOwners } from '@suite-common/wallet-core';

import { createSubscribeLabeling } from './labeling/createSubscribeLabeling';
import { createChangeRelayUrl } from './relay/changeRelayUrl';
import { DEFAULT_SUITE_SYNC_RELAY_URL } from './relay/relayUrl';
import { createSubscribeSuiteSyncStorage } from './storage/subscribeSuiteSyncStorage';
import { createSubscriptionStorage } from './storage/subscriptionStorage';
import { createUnsubscribeSuiteSyncStorage } from './storage/unsubscribeSuiteSync';
import { selectSuiteSyncRelayUrl } from './suiteSyncSelectors';
import { createTurnOffSuiteSync } from './turnOffSuiteSync';

type CreateSuiteSyncCompositionRootDeps = {
    createSuiteStorage: CreateSuiteStorage;
    createSuiteSyncOwner: CreateSuiteSyncOwner;
    getState: () => any;
    dispatch: Dispatch;
};

export const createSuiteSyncCompositionRoot = (
    deps: CreateSuiteSyncCompositionRootDeps,
): SuiteSync => {
    const suiteSyncStorageRepository = createSuiteSyncStorageRepositoryFactory({
        createSuiteStorage: deps.createSuiteStorage,
        defaultRelayUrl: DEFAULT_SUITE_SYNC_RELAY_URL,
        getRelayUrl: () => selectSuiteSyncRelayUrl(deps.getState()),
    })();

    const subscriptionStorage = createSubscriptionStorage();

    const subscribeLabeling = createSubscribeLabeling({
        subscriptionStorage,
        dispatch: deps.dispatch,
        suiteSyncStorageRepository,
    });

    const subscribeSuiteSyncStorage = createSubscribeSuiteSyncStorage({
        dispatch: deps.dispatch,
        getState: deps.getState,
        subscribeLabeling,
    });

    const unsubscribeSuiteSyncStorage = createUnsubscribeSuiteSyncStorage({
        suiteSyncStorageRepository,
        subscriptionStorage,
    });

    return {
        changeRelayUrl: createChangeRelayUrl({
            suiteSyncStorageRepository,
            getAllDevicesOwners: () => selectAllDeviceOwners(deps.getState()),
            dispatch: deps.dispatch,
        }),
        suiteSyncStorageRepository,
        createSuiteSyncOwner: deps.createSuiteSyncOwner,
        subscribeSuiteSyncStorage,
        unsubscribeSuiteSyncStorage,
        turnOffSuiteSync: createTurnOffSuiteSync({
            getState: deps.getState,
            unsubscribeSuiteSyncStorage,
        }),
    };
};
