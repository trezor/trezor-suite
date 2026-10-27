import { AppState } from 'react-native';

import { type Store } from '@reduxjs/toolkit';

import { type DeferrablePersistStorageDep } from './createDeferrablePersistStorage';

type DeferPersistWritesWhileDeps<TState> = DeferrablePersistStorageDep & {
    store: Pick<Store<TState>, 'getState' | 'subscribe'>;
};

type DeferPersistWritesWhileParams<TState> = {
    shouldDeferWrites: (state: TState) => boolean;
};

const logWriteError = (error: unknown) => console.error('Failed to write persisted state', error);

/**
 * Defers the writes of the deferrable persist storage while `shouldDeferWrites` holds for the store
 * state, and writes the deferred state once when it stops holding. The deferred state is also
 * written when the app goes to background, so that it survives the app being killed there.
 * Returns a function that stops watching.
 */
export const deferPersistWritesWhile = <TState>(
    deps: DeferPersistWritesWhileDeps<TState>,
    { shouldDeferWrites }: DeferPersistWritesWhileParams<TState>,
) => {
    let isDeferring = false;

    const unsubscribeStore = deps.store.subscribe(() => {
        const isDeferringRequired = shouldDeferWrites(deps.store.getState());
        if (isDeferringRequired === isDeferring) return;

        isDeferring = isDeferringRequired;
        if (isDeferringRequired) {
            deps.deferrablePersistStorage.deferWrites();
        } else {
            deps.deferrablePersistStorage.resumeWrites().catch(logWriteError);
        }
    });

    const appStateSubscription = AppState.addEventListener('change', appState => {
        if (appState === 'background') {
            deps.deferrablePersistStorage.flushWrites().catch(logWriteError);
        }
    });

    return () => {
        unsubscribeStore();
        appStateSubscription.remove();
    };
};
