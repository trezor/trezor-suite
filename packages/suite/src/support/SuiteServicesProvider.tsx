import React from 'react';

import { SuiteAppServices } from './suiteCompositionRoot';

const ServicesContext = React.createContext<SuiteAppServices | null>(null);

type ServicesProviderParams = {
    services: SuiteAppServices;
    children: React.ReactNode;
};

export const SuiteServicesProvider = ({ services, children }: ServicesProviderParams) => (
    <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
);

export const useSuiteServices = () => {
    const services = React.useContext(ServicesContext);

    if (!services) {
        throw new Error('useServices must be used within a ServicesProvider');
    }

    return services;
};
