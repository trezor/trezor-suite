import {
    type CreateSuiteStorage,
    type CreateSuiteSyncOwner,
} from '@suite-common/suite-sync-storage';
import {
    type SubscribeSuiteSyncInternalErrorHandler,
    type SuiteSyncInternalErrorHandler,
} from '@suite-common/suite-sync-types';
import { loadModule } from '@trezor/lazy-loading';

import { type EvoluDeps, type EvoluDepsFactoryDeps } from './createEvoluDeps';

export type LazyEvoluDeps = {
    createSuiteStorage: CreateSuiteStorage;
    createSuiteSyncOwner: CreateSuiteSyncOwner;
    subscribeError: SubscribeSuiteSyncInternalErrorHandler;
};

/**
 * Evolu deps that load the Evolu SDK on first use, so it stays out of the initial bundle.
 * Evolu, its shared worker included, starts when a wallet first needs Suite Sync storage.
 * A failed load returns a `LazyLoadingError`, and the next call loads again.
 */
export const createLazyEvoluDeps = (deps: EvoluDepsFactoryDeps): LazyEvoluDeps => {
    const errorHandlers: SuiteSyncInternalErrorHandler[] = [];
    let evoluDeps: EvoluDeps | null = null;

    // Each call checks for a started Evolu once its import resolves, so concurrent calls start one.
    // A failed import or start leaves none, and the next call tries again.
    const loadEvoluDeps = () =>
        loadModule(() =>
            import('./createEvoluDeps').then(({ createEvoluDeps }) => {
                if (evoluDeps === null) {
                    const startedEvoluDeps = createEvoluDeps(deps);

                    errorHandlers.forEach(errorHandler =>
                        startedEvoluDeps.subscribeError(errorHandler),
                    );
                    evoluDeps = startedEvoluDeps;
                }

                return evoluDeps;
            }),
        );

    return {
        createSuiteStorage: async params => {
            const evoluDepsResult = await loadEvoluDeps();

            if (!evoluDepsResult.success) {
                return evoluDepsResult;
            }

            return evoluDepsResult.payload.createSuiteStorage(params);
        },
        createSuiteSyncOwner: async params => {
            const evoluCreateSuiteSyncOwnerResult = await loadModule(() =>
                import('@suite-common/suite-sync-evolu').then(
                    ({ evoluCreateSuiteSyncOwner }) => evoluCreateSuiteSyncOwner,
                ),
            );

            if (!evoluCreateSuiteSyncOwnerResult.success) {
                return evoluCreateSuiteSyncOwnerResult;
            }

            return evoluCreateSuiteSyncOwnerResult.payload(params);
        },
        // Errors come only from a started Evolu, so subscribing once it starts misses none.
        subscribeError: errorHandler => {
            errorHandlers.push(errorHandler);
            evoluDeps?.subscribeError(errorHandler);
        },
    };
};
