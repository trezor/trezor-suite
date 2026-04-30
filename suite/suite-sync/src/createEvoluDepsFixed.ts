import type { ConsoleDep } from '@evolu/common';
import { createEvoluDeps as createCommonEvoluDeps } from '@evolu/common/local-first';
import type {
    CreateDbWorker,
    DbWorkerInit,
    EvoluDeps,
    SharedWorkerInput,
} from '@evolu/common/local-first';
import { createMessageChannel, createSharedWorker, createWorker } from '@evolu/web';

const getSharedWorker = () => {
    if ('SharedWorker' in globalThis) {
        return new SharedWorker(
            new URL(
                /* webpackChunkName: "workers/evolu-sharedworker" */
                './Shared.worker.ts',
                import.meta.url,
            ),
            { type: 'module' },
        );
    }

    const regularWorker = new Worker(
        new URL(
            /* webpackChunkName: "workers/evolu-sharedworker" */
            './Shared.worker.ts',
            import.meta.url,
        ),
        { type: 'module' },
    );

    return { port: regularWorker } as unknown as SharedWorker;
};

// This is a temporary workaround to fix Suite Web in browsers without SharedWorker support (Chrome Android).
// Once this is implemented directly in Evolu, we will remove this method.
// See Evolu issue https://github.com/evoluhq/evolu/issues/670
export const createEvoluDepsFixed = (deps: Partial<ConsoleDep> = {}): EvoluDeps => {
    const createDbWorker: CreateDbWorker = () =>
        createWorker<DbWorkerInit, never>(
            new Worker(
                new URL(
                    /* webpackChunkName: "workers/evolu-db-worker" */
                    './Db.worker.ts',
                    import.meta.url,
                ),
                { type: 'module' },
            ),
        );

    const sharedWorker = createSharedWorker<SharedWorkerInput>(getSharedWorker());

    return createCommonEvoluDeps({
        ...deps,
        createDbWorker,
        createMessageChannel,
        reloadApp: url => {
            // Not exported from Evolu, so copy pasted here.
            if (typeof document === 'undefined') {
                return;
            }

            location.replace(url ?? '/');
        },
        sharedWorker,
    });
};
