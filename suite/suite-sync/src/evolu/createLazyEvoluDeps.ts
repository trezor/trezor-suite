import {
    type CreateSuiteStorage,
    CreateSuiteStorageError,
    type CreateSuiteSyncOwner,
    CreateSuiteSyncOwnerError,
} from '@suite-common/suite-sync-storage';
import {
    type SubscribeSuiteSyncInternalErrorHandler,
    type SuiteSyncInternalErrorHandler,
} from '@suite-common/suite-sync-types';
import { err } from '@trezor/type-utils';

import { type EvoluDeps, type EvoluDepsFactoryDeps } from './createEvoluDeps';

export type LazyEvoluDeps = {
    createSuiteStorage: CreateSuiteStorage;
    createSuiteSyncOwner: CreateSuiteSyncOwner;
    subscribeError: SubscribeSuiteSyncInternalErrorHandler;
};

/**
 * Evolu deps that load the Evolu SDK on first use, so it stays out of the initial bundle.
 * Evolu, its shared worker included, starts when a wallet first needs Suite Sync storage.
 * A failed load returns an error result, and the next call loads again.
 */
export const createLazyEvoluDeps = (deps: EvoluDepsFactoryDeps): LazyEvoluDeps => {
    const errorHandlers: SuiteSyncInternalErrorHandler[] = [];
    let loadedEvoluDeps: EvoluDeps | null = null;
    let evoluDepsPromise: Promise<EvoluDeps> | null = null;

    const loadEvoluDeps = async () => {
        const { createEvoluDeps } = await import('./createEvoluDeps');
        const evoluDeps = createEvoluDeps(deps);

        errorHandlers.forEach(errorHandler => evoluDeps.subscribeError(errorHandler));
        loadedEvoluDeps = evoluDeps;

        return evoluDeps;
    };

    // Every call shares one Evolu; a failed load rejects, and the next call retries it.
    const getEvoluDeps = () => {
        evoluDepsPromise ??= loadEvoluDeps().catch((error: unknown) => {
            evoluDepsPromise = null;
            throw error;
        });

        return evoluDepsPromise;
    };

    return {
        createSuiteStorage: async params => {
            const evoluDeps = await getEvoluDeps().catch(() => null);

            if (evoluDeps === null) {
                return err(CreateSuiteStorageError('Failed to load Evolu'));
            }

            return evoluDeps.createSuiteStorage(params);
        },
        createSuiteSyncOwner: params =>
            import('@suite-common/suite-sync-evolu').then(
                ({ evoluCreateSuiteSyncOwner }) => evoluCreateSuiteSyncOwner(params),
                () => err(CreateSuiteSyncOwnerError('Failed to load Evolu')),
            ),
        // Errors come only from a loaded Evolu, so subscribing once it loads misses none.
        subscribeError: errorHandler => {
            errorHandlers.push(errorHandler);
            loadedEvoluDeps?.subscribeError(errorHandler);
        },
    };
};
