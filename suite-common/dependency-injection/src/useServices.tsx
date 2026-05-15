import React from 'react';

const ServicesContext = React.createContext<any>(null);

type ServicesProviderProps = {
    // This is intentional `any`. Services cannot be known in advance,
    // doing some global super type would create same complication as we
    // currently have in the `ExtraDependenciesStatic` type, where
    // we have central place where _everything_ must be imported.
    services: any;
    children: React.ReactNode;
};

export const ServicesProvider = ({ services, children }: ServicesProviderProps) => (
    <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
);

ServicesProvider.displayName = 'ServicesProvider';

type MissingUseServicesGenericError =
    'useServices<TServices>() requires an explicit service type argument';

export const useServices = <TServices = never,>(
    ..._enforceTypeArgument: [TServices] extends [never] ? [MissingUseServicesGenericError] : []
): TServices => {
    const services = React.useContext(ServicesContext);

    if (!services) {
        throw new Error('useServices must be used within a ServicesProvider');
    }

    return services as TServices;
};
