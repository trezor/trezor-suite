import React from 'react';

import { NativeAppServices } from './nativeCompositionRoot';

const ServicesContext = React.createContext<NativeAppServices | null>(null);

type ServicesProviderParams = {
    services: NativeAppServices;
    children: React.ReactNode;
};

export const NativeServicesProvider = ({ services, children }: ServicesProviderParams) => (
    <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
);

export const useNativeServices = () => {
    const services = React.useContext(ServicesContext);

    if (!services) {
        throw new Error('useServices must be used within a ServicesProvider');
    }

    return services;
};
