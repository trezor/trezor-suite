import React from 'react';

import { type NativeServices } from './nativeServices';

const NativeServicesContext = React.createContext<NativeServices | null>(null);

type NativeServicesProviderParams = {
    services: NativeServices;
    children: React.ReactNode;
};

export const NativeServicesProvider = React.memo(
    ({ services, children }: NativeServicesProviderParams) => (
        <NativeServicesContext.Provider value={services}>{children}</NativeServicesContext.Provider>
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
