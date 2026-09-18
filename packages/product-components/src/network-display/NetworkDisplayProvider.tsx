import { type ReactNode, createContext, useContext, useMemo, useSyncExternalStore } from 'react';

import type { NetworkSymbol } from '@trezor/network-module-types';

import type { NetworkDisplayServices } from './NetworkDisplayServices';

const NetworkDisplayContext = createContext<NetworkDisplayServices | null>(null);

type NetworkDisplayProviderProps = {
    services: NetworkDisplayServices;
    children: ReactNode;
};

export const NetworkDisplayProvider = ({ services, children }: NetworkDisplayProviderProps) => (
    <NetworkDisplayContext.Provider value={services}>{children}</NetworkDisplayContext.Provider>
);

export const useNetworkOptions = (symbols?: readonly NetworkSymbol[]) => {
    const services = useContext(NetworkDisplayContext);

    if (services === null) {
        throw new Error('Network display components require a NetworkDisplayProvider.');
    }

    const source = useMemo(() => services.getNetworks(symbols), [services, symbols]);

    return useSyncExternalStore(source.subscribe, source.getSnapshot, source.getServerSnapshot);
};
