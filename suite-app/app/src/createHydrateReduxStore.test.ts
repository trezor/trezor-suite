import { createMockDeps, mock } from '@trezor/dependency-injection';
import { createDeferred } from '@trezor/utils';

import { type HydrateReduxStoreDeps, createHydrateReduxStore } from './createHydrateReduxStore';
import { type PreloadStoreAction } from './createPreloadStore';

describe(createHydrateReduxStore.name, () => {
    it('waits for preloading and the state patch before replacing the reducer', async () => {
        const preloading = createDeferred<PreloadStoreAction>();
        const statePatch = createDeferred<undefined>();
        const preloadAction: PreloadStoreAction = { type: '@storage/error', payload: 'blocked' };
        const deps = createMockDeps<HydrateReduxStoreDeps>({
            preloadStore: () => preloading.promise,
            getStatePatch: () => statePatch.promise,
            reducer: mock(),
            store: { replaceReducer: () => undefined },
        });

        const hydration = createHydrateReduxStore(deps)();

        expect(deps.preloadStore).toHaveBeenCalledTimes(1);
        expect(deps.getStatePatch).not.toHaveBeenCalled();
        expect(deps.store.replaceReducer).not.toHaveBeenCalled();

        preloading.resolve(preloadAction);
        await preloading.promise;

        expect(deps.getStatePatch).toHaveBeenCalledTimes(1);
        expect(deps.store.replaceReducer).not.toHaveBeenCalled();

        statePatch.resolve(undefined);
        expect(await hydration).toBe(preloadAction);

        expect(deps.reducer).toHaveBeenCalledWith(undefined, preloadAction);
        expect(deps.store.replaceReducer).toHaveBeenCalledTimes(1);
        expect(deps.store.replaceReducer).toHaveBeenCalledWith(expect.any(Function));
    });

    it('still obtains the state patch when IndexedDB is unsupported, without replacing the reducer', async () => {
        const deps = createMockDeps<HydrateReduxStoreDeps>({
            preloadStore: () => Promise.resolve(undefined),
            getStatePatch: () => Promise.resolve(undefined),
            reducer: null,
            store: { replaceReducer: null },
        });

        expect(await createHydrateReduxStore(deps)()).toBeUndefined();

        expect(deps.getStatePatch).toHaveBeenCalledTimes(1);
    });
});
