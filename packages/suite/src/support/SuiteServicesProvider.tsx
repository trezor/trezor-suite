import React from 'react';

import { type SuiteServices } from './extraDependencies';

const SuiteServicesContext = React.createContext<SuiteServices | null>(null);

type SuiteServicesProviderParams = {
    services: SuiteServices;
    children: React.ReactNode;
};

export const SuiteServicesProvider = React.memo(
    ({ services, children }: SuiteServicesProviderParams) => (
        <SuiteServicesContext.Provider value={services}>{children}</SuiteServicesContext.Provider>
    ),
);

SuiteServicesProvider.displayName = 'SuiteServicesProvider';

export const useSuiteServices = (): SuiteServices => {
    const services = React.useContext(SuiteServicesContext);

    if (!services) {
        throw new Error('useSuiteServices must be used within a SuiteServicesProvider');
    }

    return services;
};
