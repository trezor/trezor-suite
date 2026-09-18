import { type ReactNode, createContext, useContext, useMemo } from 'react';

import type { NetworkSymbol } from '@trezor/network-module-types';

import type { NetworkDisplayConfig, NetworkOption } from './NetworkDisplayConfig';
import { type ExternalStore, useExternalStore } from './useExternalStore';

const NetworkDisplayContext = createContext<NetworkDisplayConfig | null>(null);

type NetworkDisplayProviderProps = {
    value: NetworkDisplayConfig;
    children: ReactNode;
};

export const NetworkDisplayProvider = ({ value, children }: NetworkDisplayProviderProps) => (
    <NetworkDisplayContext.Provider value={value}>{children}</NetworkDisplayContext.Provider>
);

type NetworkDisplayStoreProviderProps<TState> = {
    store: ExternalStore<TState>;
    selectNetworks: (state: TState) => NetworkDisplayConfig['networks'];
    selectNetworkNamesMap: (state: TState) => NetworkDisplayConfig['networkNamesMap'];
    children: ReactNode;
};

export const NetworkDisplayStoreProvider = <TState,>({
    store,
    selectNetworks,
    selectNetworkNamesMap,
    children,
}: NetworkDisplayStoreProviderProps<TState>) => {
    const networks = useExternalStore(store, selectNetworks);
    const networkNamesMap = useExternalStore(store, selectNetworkNamesMap);
    const value = useMemo(() => ({ networks, networkNamesMap }), [networks, networkNamesMap]);

    return <NetworkDisplayProvider value={value}>{children}</NetworkDisplayProvider>;
};

export const useNetworkOptions = (symbols?: readonly NetworkSymbol[]): readonly NetworkOption[] => {
    const config = useContext(NetworkDisplayContext);

    if (config === null) {
        throw new Error('Network display components require a NetworkDisplayProvider.');
    }

    return useMemo(
        () =>
            (symbols ?? config.networks).map(symbol => ({
                symbol,
                name: config.networkNamesMap?.[symbol] ?? symbol,
            })),
        [config, symbols],
    );
};
