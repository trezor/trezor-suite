import {
    createConsole,
    createConsoleStoreOutput,
    createOwnerWebSocketTransport,
} from '@evolu/common';
import { createRun, createEvoluDeps as createWebEvoluDeps } from '@evolu/web';
import { type Dispatch } from '@reduxjs/toolkit';

import {
    createEvoluErrorHandler,
    createEvoluInstanceFactory,
    createEvoluStorageFactory,
    createEvoluSubscribeRelayConnections,
} from '@suite-common/suite-sync-evolu';
import { type CreateSuiteStorage } from '@suite-common/suite-sync-storage';
import {
    type SubscribeSuiteSyncInternalErrorHandler,
    type SubscribeSuiteSyncRelayConnections,
} from '@suite-common/suite-sync-types';

import { createOnSharedWorkerUnsupported } from './createOnSharedWorkerUnsupported';

export type EvoluDeps = {
    createSuiteStorage: CreateSuiteStorage;
    subscribeError: SubscribeSuiteSyncInternalErrorHandler;
    subscribeRelayConnections: SubscribeSuiteSyncRelayConnections;
};

export type EvoluDepsFactoryDeps = {
    dispatch: Dispatch;
};

export const createEvoluDeps = (deps: EvoluDepsFactoryDeps): EvoluDeps => {
    const evoluDeps = createWebEvoluDeps({
        console: createConsole({ output: createConsoleStoreOutput() }),
        onSharedWorkerUnsupported: createOnSharedWorkerUnsupported({
            dispatch: deps.dispatch,
        }),
    });
    const run = createRun(evoluDeps);
    const createSuiteStorage = createEvoluStorageFactory({
        evoluInstanceFactory: createEvoluInstanceFactory({ run }),
        createOwnerWebSocketTransport,
        syncState: evoluDeps.syncState,
    });
    const subscribeError: SubscribeSuiteSyncInternalErrorHandler =
        suiteSyncInternalErrorHandler => {
            evoluDeps.evoluError.subscribe(
                createEvoluErrorHandler(evoluDeps.evoluError, suiteSyncInternalErrorHandler),
            );
        };

    return {
        createSuiteStorage,
        subscribeError,
        subscribeRelayConnections: createEvoluSubscribeRelayConnections({
            syncState: evoluDeps.syncState,
        }),
    };
};
