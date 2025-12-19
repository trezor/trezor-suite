import React from 'react';

import { MMKVStorage } from '@suite-native/storage';

import { CommonServices, NativeServices, buildNativeServices } from './nativeServices';

const NativeServicesContext = React.createContext<NativeServices | null>(null);

// NOTE: pass the deps one by one to ensure memoization just in case
type NativeServicesProviderParams = {
    commonServices: CommonServices;
    mmkvStorage: MMKVStorage;
    children: React.ReactNode;
};

export const NativeServicesProvider = React.memo(
    ({ commonServices, mmkvStorage, children }: NativeServicesProviderParams) => (
        <NativeServicesContext.Provider
            value={buildNativeServices({ commonServices, mmkvStorage })}
        >
            {children}
        </NativeServicesContext.Provider>
    ),
);

NativeServicesProvider.displayName = 'NativeServicesProvider';

export const useNativeServices = (): NativeServices => {
    const services = React.useContext(NativeServicesContext);

    if (!services) {
        throw new Error('useNativeServices must be used within a NativeServicesProvider');
    }

    return services;
};
