import React from 'react';

import type { ExtraDependencies } from './extraDependenciesType';

const ServicesContext = React.createContext<ExtraDependencies['services'] | null>(null);

type ServicesProviderParams = {
    services: ExtraDependencies['services'];
    children: React.ReactNode;
};

export const ServicesProvider = ({ services, children }: ServicesProviderParams) => (
    <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
);

export const useServices = () => {
    const services = React.useContext(ServicesContext);

    if (!services) {
        throw new Error('useServices must be used within a ServicesProvider');
    }

    return services;
};
