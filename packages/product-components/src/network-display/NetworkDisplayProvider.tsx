import {
    type ReactNode,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useSyncExternalStore,
} from 'react';

import type { NetworkSymbol } from '@trezor/network-module-types';
import { typedObjectKeys } from '@trezor/utils';

import type {
    NetworkDisplayState,
    NetworkDisplayStore,
    NetworkOption,
} from './NetworkDisplayConfig';

const NetworkDisplayContext = createContext<NetworkDisplayState['networks'] | undefined>(undefined);

type NetworkDisplayProviderProps = {
    store: NetworkDisplayStore;
    children: ReactNode;
};

export const NetworkDisplayProvider = ({ store, children }: NetworkDisplayProviderProps) => {
    const getSnapshot = useCallback(() => store.getState().networks, [store]);
    const networks = useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);

    return (
        <NetworkDisplayContext.Provider value={networks}>{children}</NetworkDisplayContext.Provider>
    );
};

export const useNetworkOptions = (symbols?: readonly NetworkSymbol[]): readonly NetworkOption[] => {
    const networks = useContext(NetworkDisplayContext);

    if (networks === undefined) {
        throw new Error('Network display components require a NetworkDisplayProvider.');
    }

    return useMemo(
        () =>
            (symbols ?? (networks === null ? [] : typedObjectKeys(networks))).map(symbol => ({
                symbol,
                name: networks?.[symbol]?.name ?? symbol,
            })),
        [networks, symbols],
    );
};
