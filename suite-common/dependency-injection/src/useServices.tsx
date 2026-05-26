import React from 'react';

const ServicesContext = React.createContext<any>(null);

// This is intentional `any`. Services cannot be known in advance,
// doing some global super type would create same complication as we
// currently have in the `ExtraDependenciesStatic` type, where
// we have central place where _everything_ must be imported.
type Services = any;

export type ServiceSelector<TSelected> = (services: Services) => TSelected;

type SelectorResult<TSelector> =
    TSelector extends ServiceSelector<infer TSelected> ? TSelected : never;

type UnionToIntersection<TUnion> = (
    TUnion extends unknown ? (value: TUnion) => void : never
) extends (value: infer TIntersection) => void
    ? TIntersection
    : never;

type SelectedServices<TSelectors extends readonly ServiceSelector<any>[]> = UnionToIntersection<
    SelectorResult<TSelectors[number]>
>;

type ServicesProviderProps = {
    services: Services;
    children: React.ReactNode;
};

export const ServicesProvider = ({ services, children }: ServicesProviderProps) => (
    <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
);

ServicesProvider.displayName = 'ServicesProvider';

type MissingUseServicesGenericError =
    'useServices<TServices>() requires an explicit service type argument';

export const selectServices = (services: Services, ...selectors: ServiceSelector<any>[]) => {
    if (selectors.length === 0) {
        return services;
    }

    return Object.assign({}, ...selectors.map(selector => selector(services)));
};

export function useServices<TServices = never>(
    ...args: [TServices] extends [never] ? [MissingUseServicesGenericError] : []
): TServices;

export function useServices<
    const TSelectors extends readonly [ServiceSelector<any>, ...ServiceSelector<any>[]],
>(...selectors: TSelectors): SelectedServices<TSelectors>;

export function useServices(...selectors: ServiceSelector<any>[]) {
    const services = React.useContext(ServicesContext);

    if (!services) {
        throw new Error('useServices must be used within a ServicesProvider');
    }

    return selectServices(services, ...selectors);
}
