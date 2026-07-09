import { createRun, createEvoluDeps as createWebEvoluDeps } from '@evolu/web';
import { type Dispatch } from '@reduxjs/toolkit';

import { type UpdateRelayConnectionStatus } from '@suite-common/suite-sync';
import {
    createEvoluErrorHandler,
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
} from '@suite-common/suite-sync-evolu';
import { type CreateSuiteStorage } from '@suite-common/suite-sync-storage';
import { type SubscribeSuiteSyncInternalErrorHandler } from '@suite-common/suite-sync-types';

import { createEvoluConsole } from './createEvoluConsole';
import { createOnSharedWorkerUnsupported } from './createOnSharedWorkerUnsupported';

export type EvoluDeps = {
    createSuiteStorage: CreateSuiteStorage;
    subscribeError: SubscribeSuiteSyncInternalErrorHandler;
};

export type EvoluDepsFactoryDeps = {
    dispatch: Dispatch;
    updateRelayConnectionStatus: UpdateRelayConnectionStatus;
};

export const createEvoluDeps = (deps: EvoluDepsFactoryDeps): EvoluDeps => {
    const console = createEvoluConsole({
        updateRelayConnectionStatus: deps.updateRelayConnectionStatus,
    });
    const evoluDeps = createWebEvoluDeps({
        console,
        onSharedWorkerUnsupported: createOnSharedWorkerUnsupported({
            dispatch: deps.dispatch,
        }),
    });
    const run = createRun(evoluDeps);
    const createSuiteStorage = createEvoluStorageFactory({
        createEvoluInstance: createEvoluInstanceFactory({ run }),
    });
    const subscribeError: SubscribeSuiteSyncInternalErrorHandler =
        suiteSyncInternalErrorHandler => {
            evoluDeps.evoluError.subscribe(
                createEvoluErrorHandler(evoluDeps.evoluError, suiteSyncInternalErrorHandler),
            );
        };

    return { createSuiteStorage, subscribeError };
};
