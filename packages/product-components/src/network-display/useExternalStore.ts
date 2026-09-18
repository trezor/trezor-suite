import { useCallback, useSyncExternalStore } from 'react';

export type ExternalStore<TState> = {
    getState: () => TState;
    subscribe: (onChange: () => void) => () => void;
};

export const useExternalStore = <TState, TSelected>(
    store: ExternalStore<TState>,
    select: (state: TState) => TSelected,
): TSelected => {
    const getSnapshot = useCallback(() => select(store.getState()), [store, select]);

    return useSyncExternalStore(store.subscribe, getSnapshot);
};
