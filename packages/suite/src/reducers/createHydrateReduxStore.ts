import { isCodesignBuild } from '@trezor/env-utils';
import { mergeDeepObject } from '@trezor/utils';

import { type PreloadStoreAction } from 'src/support/suite/preloadStore';

import { type SuiteReduxStore } from './createReduxStore';
import { type AppState, type SuiteRootReducer } from './store';

type HydrateReduxStoreDeps = {
    store: Pick<SuiteReduxStore, 'replaceReducer'>;
    reducer: SuiteRootReducer;
};

export type HydrateReduxStore = (
    preloadStoreAction: PreloadStoreAction,
    statePatch?: Record<string, unknown>,
) => void;

export type HydrateReduxStoreDep = { hydrateReduxStore: HydrateReduxStore };

const patchConfirm = (statePatch: unknown) =>
    !isCodesignBuild() ||
    confirm(
        `Trezor Suite is starting with partially predefined state. Press OK only if you intended to do that!\n\n` +
            JSON.stringify(statePatch, null, 4),
    );

export const createHydrateReduxStore =
    (deps: HydrateReduxStoreDeps): HydrateReduxStore =>
    (preloadStoreAction, statePatch) => {
        if (!preloadStoreAction) {
            return;
        }

        // Preserve the original preload semantics: reducers receive undefined, not the
        // current state, and the desktop patch is applied before any app effects run.
        const preloadedState = deps.reducer(undefined, preloadStoreAction);
        const partialStatePatch: Partial<AppState> | undefined = statePatch;
        const patchedState =
            partialStatePatch && patchConfirm(partialStatePatch)
                ? mergeDeepObject.withOptions(
                      { dotNotation: true },
                      preloadedState,
                      partialStatePatch,
                  )
                : preloadedState;

        let isHydrating = true;

        // Redux's replaceReducer initializes through its internal dispatch, bypassing middleware.
        // Previously preloading happened before store creation, so it must not trigger application
        // effects now either. Only the replacement's first reduction installs the hydrated state.
        deps.store.replaceReducer((state, action) => {
            if (isHydrating) {
                isHydrating = false;

                // Preserve normal initialization, including filling missing slices and
                // discarding unknown state-patch keys.
                return deps.reducer(patchedState, action);
            }

            return deps.reducer(state, action);
        });
    };
