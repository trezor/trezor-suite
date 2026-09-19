import {
    type ReactNode,
    createContext,
    useCallback,
    useContext,
    useSyncExternalStore,
} from 'react';

import type { NetworkDisplayState, NetworkDisplayStore } from './NetworkDisplayConfig';

const NetworkDisplayContext = createContext<NetworkDisplayStore | null>(null);

type NetworkDisplayProviderProps = {
    store: NetworkDisplayStore;
    children: ReactNode;
};

export const NetworkDisplayProvider = ({ store, children }: NetworkDisplayProviderProps) => (
    <NetworkDisplayContext.Provider value={store}>{children}</NetworkDisplayContext.Provider>
);

export const useNetworkDisplaySelector = <TSelected,>(
    selector: (state: NetworkDisplayState) => TSelected,
) => {
    const store = useContext(NetworkDisplayContext);

    if (store === null) {
        throw new Error('Network display components require a NetworkDisplayProvider.');
    }

    const getSnapshot = useCallback(() => selector(store.getState()), [store, selector]);

    return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
};
