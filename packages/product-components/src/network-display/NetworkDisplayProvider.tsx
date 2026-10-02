import {
    type ReactNode,
    createContext,
    useCallback,
    useContext,
    useSyncExternalStore,
} from 'react';

import type { NetworkConfigState, NetworkConfigStore } from '@trezor/network-module-types';

const NetworkDisplayContext = createContext<NetworkConfigStore | null>(null);

type NetworkDisplayProviderProps = {
    store: NetworkConfigStore;
    children: ReactNode;
};

export const NetworkDisplayProvider = ({ store, children }: NetworkDisplayProviderProps) => (
    <NetworkDisplayContext.Provider value={store}>{children}</NetworkDisplayContext.Provider>
);

export const useNetworkDisplaySelector = <TSelected,>(
    selector: (state: NetworkConfigState) => TSelected,
) => {
    const store = useContext(NetworkDisplayContext);

    if (store === null) {
        throw new Error('Network display components require a NetworkDisplayProvider.');
    }

    const getSnapshot = useCallback(() => selector(store.getState()), [store, selector]);

    return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
};
